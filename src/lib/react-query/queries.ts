import { INewPost, INewUser, IUpdatePost } from '@/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  addComment,
  addCommentReply,
  addFeedback,
  addFeedbackReply,
  checkPostLike,
  checkPostSave,
  createPost,
  createUserAccount,
  createUserAccountWithGoogle,
  deletePost,
  getAuthorById,
  getCommentReplies,
  getComments,
  getCurrentUser,
  getFeedbackReplies,
  getFeedbacks,
  getInfinitePosts,
  getPostById,
  getRecentPosts,
  getUserInfo,
  getUserPosts,
  likePost,
  loginWithGoogle,
  savePost,
  searchPosts,
  signInAccount,
  signOutAccount,
  unlikePost,
  unsavePost,
  updatePost,
} from '../appwrite/api';
import { QUERY_KEYS } from './queryKeys';

// ***** AUTHENTICATION *****

export const useCreateUserAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
    onSuccess: () => {
      // Invalidate queries related to authentication after successful account creation
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useCreateUserAccountWithGoogle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: any) => createUserAccountWithGoogle(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useLoginWithGoogle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useSignInAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useSignOutAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: signOutAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

export const useGetUserInfo = (accountId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_INFO, accountId],
    queryFn: () => getUserInfo(accountId),
    enabled: !!accountId,
  });
}

// ***** POSTS *****

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (post: INewPost) => createPost(post),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetRecentPosts = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts,
  });
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetPostById = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useGetAuthorById = (creatorId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, creatorId],
    queryFn: () => getAuthorById(creatorId),
    enabled: !!creatorId,
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: IUpdatePost) => updatePost(post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id],
      });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, mediaId }: { postId?: string; mediaId: string }) =>
      deletePost(postId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
    },
  });
};

export const useGetPosts = () => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_INFINITE_POSTS],
    queryFn: getInfinitePosts as any,
    getNextPageParam: (lastPage: any) => {
      // If there's no data, there are no more pages.
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last document as the cursor.
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};

export const useSearchPosts = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_POSTS, searchTerm],
    queryFn: () => searchPosts(searchTerm),
    enabled: !!searchTerm,
  });
};

export const useGetUserPosts = (userId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId], // Unique key per user
    queryFn: ({ pageParam }) => getUserPosts({ pageParam, userId }), // Pass userId to getUserPosts
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null; // No more pages if no data
      }

      // Use the $id of the last document as the cursor for the next page
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};


// ***** LIKE & SAVE *****
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      postType,
    }: {
      postId: string;
      userId: string;
      postType: string;
    }) => likePost(postId, userId, postType),
    onSuccess: (_, { postId, postType }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_LIKE],
      });
     

    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      postType,
    }: {
      postId: string;
      userId: string;
      postType: string;
    }) => unlikePost(postId, userId, postType),
    onSuccess: (_, { postId, postType }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_LIKE],
      });
    },
  });
};

export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      postType,
    }: {
      postId: string;
      userId: string;
      postType: string;
    }) => savePost(postId, userId, postType),
    onSuccess: (_, { postId, postType }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
    },
  });
};

export const useUnsavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      postType,
    }: {
      postId: string;
      userId: string;
      postType: string;
    }) => unsavePost(postId, userId, postType),
    onSuccess: (_, { postId, postType }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
    },
  });
};

export const useCheckPostLike = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_LIKE, postId, userId],
    queryFn: () => checkPostLike(postId, userId),
  });
};
export const useCheckPostSave = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_SAVE, postId, userId],
    queryFn: () => checkPostSave(postId, userId),
  });
};

// ***** COMMENT, FEEDBACK & REPLIES *****

export const useGetComments = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_COMMENTS, postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });
};
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      content,
    }: {
      postId: string;
      userId: string;
      content: string;
    }) => addComment(postId, userId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_COMMENTS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO], 
      });
    },
  });
};

export const useGetFeedbacks = (postId: string, ) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS, postId, ],
    queryFn: () => getFeedbacks(postId,),
    enabled: !!postId,
  });
};
export const useAddFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      userId,
      content,
    }: {
      postId: string;
      userId: string;
      content: string;
    }) => addFeedback(postId, userId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS, postId], 
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO], 
      });

    },
  });
};

export const useGetCommentReplies = (commentId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMENT_REPLIES, commentId],
    queryFn: () => getCommentReplies(commentId),
    enabled: !!commentId,
  });
};
export const useAddCommentReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parentId,
      userId,
      content,
    }: {
      parentId: string;
      userId: string;
      content: string;
    }) => addCommentReply(parentId, userId, content),
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

export const useGetFeedbackReplies = (feedbackId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_FEEDBACK_REPLIES, feedbackId],
    queryFn: () => getFeedbackReplies(feedbackId),
    enabled: !!feedbackId,
  });
};
export const useAddFeedbackReply = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      parentId,
      userId,
      content,
    }: {
      parentId: string;
      userId: string;
      content: string;
    }) => addFeedbackReply(parentId, userId, content),
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
