import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './queryKeys';
import {
  addComment,
  addCommentReply,
  addFeedback,
  addFeedbackReply,
  deleteComment,
  deleteCommentReply,
  deleteFeedback,
  deleteFeedbackReply,
  getCommentReplies,
  getComments,
  getFeedbackReplies,
  getFeedbacks,
  getPostCommentsCount,
  getPostFeedbacksCount,
  getPostRepliesCount,
} from '../appwrite-apis/comments';

// *** COMMENT-QUERIES ***

// Use-Get-Post-Comments-Count
export const useGetPostCommentsCount = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_COMMENTS_COUNT, postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      return getPostCommentsCount(postId);
    },
    enabled: !!postId,
  });
};

// Use-Get-Comments
export const useGetComments = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_COMMENTS, postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });
};

// Use-Add-Comment
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      authorId,
      userId,
      content,
    }: {
      postId: string;
      authorId: string;
      userId: string;
      content: string;
    }) => addComment(postId, authorId, userId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS_COUNT, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES_COUNT, postId],
      });
      //   queryClient.invalidateQueries({
      //     queryKey: [QUERY_KEYS.GET_USER_INFO],
      //   });
    },
  });
};

// Use-Delete-Comment
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      postId,
    }: {
      commentId: string;
      postId: string;
    }) => deleteComment(commentId, postId),

    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS_COUNT, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES_COUNT, postId],
      });
    },
  });
};

// *** FEEBACK-QUERIES ***

// Use-Get-Post-Feedbacks-Count
export const useGetPostFeedbacksCount = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS_COUNT, postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      return getPostFeedbacksCount(postId);
    },
    enabled: !!postId,
  });
};

// Use-Get-Feedbacks
export const useGetFeedbacks = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS, postId],
    queryFn: () => getFeedbacks(postId),
    enabled: !!postId,
  });
};

// Use-Add-Feedback
export const useAddFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      authorId,
      userId,
      content,
    }: {
      postId: string;
      authorId: string;
      userId: string;
      content: string;
    }) => addFeedback(postId, authorId, userId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS_COUNT, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO],
      });
    },
  });
};

// Use-Delete-Feedback
export const useDeleteFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      feedbackId,
      postId,
    }: {
      feedbackId: string;
      postId: string;
    }) => deleteFeedback(feedbackId, postId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS_COUNT, postId],
      });
    },
  });
};

// *** COMMENT-REPLY-QUERIES ***

// Use-Get-Post-Replies-Count
export const useGetPostRepliesCount = (postId?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES_COUNT, postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');
      return getPostRepliesCount(postId);
    },
    enabled: !!postId,
  });
};

// Get-Comment-Replies
export const useGetCommentReplies = (commentId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES, commentId],
    queryFn: () => getCommentReplies(commentId),
    enabled: !!commentId,
  });
};

// Add-Comment-Reply
export const useAddCommentReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parentId,
      authorId,
      userId,
      content,
      postId,
    }: {
      parentId: string;
      authorId: string;
      userId: string;
      content: string;
      postAuthorId: string;
      postId: string;
    }) => addCommentReply(parentId, authorId, userId, content, postId),
    onSuccess: (_, { parentId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES, parentId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO],
      });
    },
  });
};

// Delete-Comment-Reply
export const useDeleteCommentReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentReplyId,
      commentId,
    }: {
      commentReplyId: string;
      commentId: string;
    }) => deleteCommentReply(commentReplyId, commentId),
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES, commentId],
      });
    },
  });
};

// *** FEEDBACK-REPLY-QUERIES ***

// Get-Feedback-Replies
export const useGetFeedbackReplies = (feedbackId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FEEDBACK_REPLIES, feedbackId],
    queryFn: () => getFeedbackReplies(feedbackId),
    enabled: !!feedbackId,
  });
};

// Add-Feedback-Reply
export const useAddFeedbackReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postAuthorId,
      parentId,
      authorId,
      userId,
      content,
      postId
    }: {
      parentId: string;
      authorId: string;
      userId: string;
      content: string;
      postAuthorId: string;
      postId: string;
    }) => addFeedbackReply(parentId, postAuthorId, authorId, userId, content, postId),
    onSuccess: (_, { parentId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FEEDBACK_REPLIES, parentId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO],
      });
    },
  });
};

// Delete-Feedback-Reply
export const useDeleteFeedbackReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      feedbackReplyId,
      feedbackId,
    }: {
      feedbackReplyId: string;
      feedbackId: string;
    }) => deleteFeedbackReply(feedbackReplyId, feedbackId),
    onSuccess: (_, { feedbackId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_FEEDBACK_REPLIES, feedbackId],
      });
    },
  });
};
