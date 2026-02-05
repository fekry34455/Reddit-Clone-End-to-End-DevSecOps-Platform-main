import React, { useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { authModalState } from "../atoms/authModalAtom";
import { Community, communityState } from "../atoms/communitiesAtom";
import { Post, postState, PostVote } from "../atoms/postsAtom";
import { useRouter } from "next/router";
import { useAuthContext } from "../context/AuthContext";
import { postApi } from "../lib/api";

const usePosts = (communityData?: Community) => {
  const { user, loading: loadingUser } = useAuthContext();
  const [postStateValue, setPostStateValue] = useRecoilState(postState);
  const setAuthModalState = useSetRecoilState(authModalState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const communityStateValue = useRecoilValue(communityState);

  const onSelectPost = (post: Post, postIdx: number) => {
    setPostStateValue((prev) => ({
      ...prev,
      selectedPost: { ...post, postIdx },
    }));
    router.push(`/r/${post.communityId}/comments/${post.id}`);
  };

  const onVote = async (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    post: Post,
    vote: number,
    communityId: string
  ) => {
    event.stopPropagation();
    if (!user?.id) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    const { voteStatus } = post;
    const existingVote = postStateValue.postVotes.find(
      (vote) => vote.postId === post.id
    );

    try {
      let voteChange = vote;

      const updatedPost = { ...post };
      const updatedPosts = [...postStateValue.posts];
      let updatedPostVotes = [...postStateValue.postVotes];

      if (!existingVote) {
        const newVote = await postApi.vote(post.id, user.id, vote);
        const newPostVote: PostVote = {
          id: newVote.id,
          postId: post.id,
          communityId,
          voteValue: vote,
        };

        updatedPost.voteStatus = voteStatus + vote;
        updatedPostVotes = [...updatedPostVotes, newPostVote];
      } else {
        if (existingVote.voteValue === vote) {
          voteChange *= -1;
          await postApi.removeVote(post.id, user.id);
          updatedPost.voteStatus = voteStatus - vote;
          updatedPostVotes = updatedPostVotes.filter(
            (vote) => vote.id !== existingVote.id
          );
        } else {
          voteChange = 2 * vote;
          const updatedVote = await postApi.vote(post.id, user.id, vote);
          updatedPost.voteStatus = voteStatus + 2 * vote;
          const voteIdx = postStateValue.postVotes.findIndex(
            (vote) => vote.id === existingVote.id
          );

          if (voteIdx !== -1) {
            updatedPostVotes[voteIdx] = {
              ...existingVote,
              id: updatedVote.id,
              voteValue: vote,
            };
          }
        }
      }

      let updatedState = { ...postStateValue, postVotes: updatedPostVotes };

      const postIdx = postStateValue.posts.findIndex(
        (item) => item.id === post.id
      );

      updatedPosts[postIdx!] = updatedPost;
      updatedState = {
        ...updatedState,
        posts: updatedPosts,
        postsCache: {
          ...updatedState.postsCache,
          [communityId]: updatedPosts,
        },
      };

      if (updatedState.selectedPost) {
        updatedState = {
          ...updatedState,
          selectedPost: updatedPost,
        };
      }

      setPostStateValue(updatedState);
    } catch (error) {
      console.log("onVote error", error);
    }
  };

  const onDeletePost = async (post: Post): Promise<boolean> => {
    try {
      await postApi.remove(post.id);

      setPostStateValue((prev) => ({
        ...prev,
        posts: prev.posts.filter((item) => item.id !== post.id),
        postsCache: {
          ...prev.postsCache,
          [post.communityId]: prev.postsCache[post.communityId]?.filter(
            (item) => item.id !== post.id
          ),
        },
      }));

      return true;
    } catch (error) {
      console.log("THERE WAS AN ERROR", error);
      return false;
    }
  };

  const syncVotesFromPosts = () => {
    if (!user?.id) {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
      return;
    }

    const nextVotes: PostVote[] = postStateValue.posts
      .filter((post) => post.currentUserVoteStatus)
      .map((post) => ({
        id: post.currentUserVoteStatus!.id,
        postId: post.id,
        communityId: post.communityId,
        voteValue: post.currentUserVoteStatus!.voteValue,
      }));

    setPostStateValue((prev) => ({
      ...prev,
      postVotes: nextVotes,
    }));
  };

  useEffect(() => {
    if (!user?.id || !communityStateValue.currentCommunity) return;
    syncVotesFromPosts();
  }, [user, communityStateValue.currentCommunity, postStateValue.posts]);

  useEffect(() => {
    if (!user?.id && !loadingUser) {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
      return;
    }
  }, [user, loadingUser]);

  return {
    postStateValue,
    setPostStateValue,
    onSelectPost,
    onDeletePost,
    loading,
    setLoading,
    onVote,
    error,
  };
};

export default usePosts;
