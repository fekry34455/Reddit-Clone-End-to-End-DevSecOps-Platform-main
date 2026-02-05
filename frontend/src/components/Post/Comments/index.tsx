import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Flex,
  SkeletonCircle,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useSetRecoilState } from "recoil";
import { authModalState } from "../../../atoms/authModalAtom";
import { Post, postState } from "../../../atoms/postsAtom";
import { User } from "../../../types/user";
import { commentApi } from "../../../lib/api";
import CommentItem, { Comment } from "./CommentItem";
import CommentInput from "./Input";

type CommentsProps = {
  user?: User | null;
  selectedPost: Post;
};

const Comments: React.FC<CommentsProps> = ({ user, selectedPost }) => {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentFetchLoading, setCommentFetchLoading] = useState(false);
  const [commentCreateLoading, setCommentCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState("");
  const setAuthModalState = useSetRecoilState(authModalState);
  const setPostState = useSetRecoilState(postState);

  const onCreateComment = async (comment: string) => {
    if (!user) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    setCommentCreateLoading(true);
    try {
      const newComment = await commentApi.create(
        selectedPost.id,
        user.id,
        comment
      );

      setComment("");
      setComments((prev) => [newComment as Comment, ...prev]);

      // Fetch posts again to update number of comments
      setPostState((prev) => ({
        ...prev,
        selectedPost: {
          ...prev.selectedPost,
          numberOfComments: prev.selectedPost?.numberOfComments! + 1,
        } as Post,
        postUpdateRequired: true,
      }));
    } catch (error: any) {
      console.log("onCreateComment error", error.message);
    }
    setCommentCreateLoading(false);
  };

  const onDeleteComment = useCallback(
    async (comment: Comment) => {
      setDeleteLoading(comment.id as string);
      try {
        if (!comment.id) throw "Comment has no ID";

        await commentApi.remove(comment.id);

        setPostState((prev) => ({
          ...prev,
          selectedPost: {
            ...prev.selectedPost,
            numberOfComments: prev.selectedPost?.numberOfComments! - 1,
          } as Post,
          postUpdateRequired: true,
        }));

        setComments((prev) => prev.filter((item) => item.id !== comment.id));
      } catch (error: any) {
        console.log("Error deletig comment", error.message);
      }
      setDeleteLoading("");
    },
    [setComments, setPostState]
  );

  const getPostComments = async () => {
    setCommentFetchLoading(true);
    try {
      const response = await commentApi.list(selectedPost.id);
      setComments(response as Comment[]);
    } catch (error: any) {
      console.log("getPostComments error", error.message);
    }
    setCommentFetchLoading(false);
  };

  useEffect(() => {
    console.log("HERE IS SELECTED POST", selectedPost.id);

    getPostComments();
  }, []);

  return (
    <Box bg="white" p={2} borderRadius="0px 0px 4px 4px">
      <Flex
        direction="column"
        pl={10}
        pr={4}
        mb={6}
        fontSize="10pt"
        width="100%"
      >
        <CommentInput
          comment={comment}
          setComment={setComment}
          loading={commentCreateLoading}
          user={user}
          onCreateComment={onCreateComment}
        />
      </Flex>
      <Stack spacing={6} p={2}>
        {commentFetchLoading ? (
          <>
            {[0, 1, 2].map((item) => (
              <Box key={item} padding="6" bg="white">
                <SkeletonCircle size="10" />
                <SkeletonText mt="4" noOfLines={2} spacing="4" />
              </Box>
            ))}
          </>
        ) : (
          <>
            {!!comments.length ? (
              <>
                {comments.map((item: Comment) => (
                  <CommentItem
                    key={item.id}
                    comment={item}
                    onDeleteComment={onDeleteComment}
                    isLoading={deleteLoading === (item.id as string)}
                    userId={user?.id}
                  />
                ))}
              </>
            ) : (
              <Flex
                direction="column"
                justify="center"
                align="center"
                borderTop="1px solid"
                borderColor="gray.100"
                p={20}
              >
                <Text fontWeight={700} opacity={0.3}>
                  No Comments Yet
                </Text>
              </Flex>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};
export default Comments;
