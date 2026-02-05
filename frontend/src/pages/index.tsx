import { useEffect } from "react";
import { Stack } from "@chakra-ui/react";
import type { NextPage } from "next";
import { useRecoilValue } from "recoil";
import { communityState } from "../atoms/communitiesAtom";
import { Post } from "../atoms/postsAtom";
import CreatePostLink from "../components/Community/CreatePostLink";
import Recommendations from "../components/Community/Recommendations";
import PageContentLayout from "../components/Layout/PageContent";
import PostLoader from "../components/Post/Loader";
import PostItem from "../components/Post/PostItem";
import usePosts from "../hooks/usePosts";
import Premium from "../components/Community/Premium";
import PersonalHome from "../components/Community/PersonalHome";
import { postApi } from "../lib/api";
import { useAuthContext } from "../context/AuthContext";

const Home: NextPage = () => {
  const { user, loading: loadingUser } = useAuthContext();
  const {
    postStateValue,
    setPostStateValue,
    onVote,
    onSelectPost,
    onDeletePost,
    loading,
    setLoading,
  } = usePosts();
  const communityStateValue = useRecoilValue(communityState);

  const getUserHomePosts = async () => {
    console.log("GETTING USER FEED");
    setLoading(true);
    try {
      /**
       * if snippets has no length (i.e. user not in any communities yet)
       * do query for 20 posts ordered by voteStatus
       */
      const feedPosts: Post[] = [];

      // User has joined communities
    if (communityStateValue.mySnippets.length) {
      console.log("GETTING POSTS IN USER COMMUNITIES");

      const myCommunityIds = communityStateValue.mySnippets.map(
        (snippet) => snippet.communityId
      );
      const postPromises = myCommunityIds.slice(0, 3).map((communityId) =>
        postApi.list(communityId, user?.id)
      );
      const queryResults = await Promise.all(postPromises);
      queryResults.forEach((posts) => {
        feedPosts.push(...posts.slice(0, 3));
      });
    }
      // User has not joined any communities yet
      else {
        console.log("USER HAS NO COMMUNITIES - GETTING GENERAL POSTS");

      const posts = await postApi.list(undefined, user?.id);
      feedPosts.push(...posts.slice(0, 10));
    }

      console.log("HERE ARE FEED POSTS", feedPosts);

      setPostStateValue((prev) => ({
        ...prev,
        posts: feedPosts,
      }));

      // if not in any, get 5 communities ordered by number of members
      // for each one, get 2 posts ordered by voteStatus and set these to postState posts
    } catch (error: any) {
      console.log("getUserHomePosts error", error.message);
    }
    setLoading(false);
  };

  const getNoUserHomePosts = async () => {
    console.log("GETTING NO USER FEED");
    setLoading(true);
    try {
      const posts = await postApi.list();
      console.log("NO USER FEED", posts);

      setPostStateValue((prev) => ({
        ...prev,
        posts: posts.slice(0, 10) as Post[],
      }));
    } catch (error: any) {
      console.log("getNoUserHomePosts error", error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    /**
     * initSnippetsFetched ensures that user snippets have been retrieved;
     * the value is set to true when snippets are first retrieved inside
     * of getSnippets in useCommunityData
     */
    if (!communityStateValue.initSnippetsFetched) return;

    if (user) {
      getUserHomePosts();
    }
  }, [user, communityStateValue.initSnippetsFetched]);

  useEffect(() => {
    if (!user && !loadingUser) {
      getNoUserHomePosts();
    }
  }, [user, loadingUser]);

  useEffect(() => {
    if (!user?.id || !postStateValue.posts.length) return;
    setPostStateValue((prev) => ({
      ...prev,
      postVotes: postStateValue.posts
        .filter((post) => post.currentUserVoteStatus)
        .map((post) => ({
          id: post.currentUserVoteStatus!.id,
          postId: post.id,
          communityId: post.communityId,
          voteValue: post.currentUserVoteStatus!.voteValue,
        })),
    }));
  }, [postStateValue.posts, user?.id, setPostStateValue]);

  return (
    <PageContentLayout>
      <>
        <CreatePostLink />
        {loading ? (
          <PostLoader />
        ) : (
          <Stack>
            {postStateValue.posts.map((post: Post, index) => (
              <PostItem
                key={post.id}
                post={post}
                postIdx={index}
                onVote={onVote}
                onDeletePost={onDeletePost}
                userVoteValue={
                  postStateValue.postVotes.find(
                    (item) => item.postId === post.id
                  )?.voteValue
                }
                userIsCreator={user?.uid === post.creatorId}
                onSelectPost={onSelectPost}
                homePage
              />
            ))}
          </Stack>
        )}
      </>
      <Stack spacing={5} position="sticky" top="14px">
        <Recommendations />
        <Premium />
        <PersonalHome />
      </Stack>
    </PageContentLayout>
  );
};

export default Home;
