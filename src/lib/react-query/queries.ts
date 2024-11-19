import {
  INewPost,
  INewProject,
  INewUser,
  IUpdatePost,
  IUpdateProject,
  IUpdateUser,
} from '@/types';
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
  addProject,
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
  updateProject,
  getProjectById,
  getUserProjects,
  updateProfile,
  getUserById,
  checkItemLike,
  likeItem,
  unlikeItem,
  support,
  checkSupportingUser,
  unsupport,
  deleteComment,
  deleteCommentReply,
  deleteFeedback,
  deleteFeedbackReply,
  deleteProject,
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
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
};

export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: IUpdateUser) => updateProfile(user),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_BY_ID],
      });
    },
  });
};

// ***** POSTS, PROJECTS & DISCUSSIONS *****

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

export const useAddProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: INewProject) => addProject(project),
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

export const useGetPostById = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });
};

export const useGetProjectById = (projectId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
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

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: IUpdateProject) => updateProject(project),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, data?.$id],
      });
    },
  });
};

// *** DELETE ****
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      mediaId,
      creatorId,
    }: {
      postId: string;
      mediaId: string;
      creatorId: string;
    }) => deletePost(postId, mediaId, creatorId),
    onSuccess: (_, { creatorId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_POSTS, creatorId],
      });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      postId,
      mediaId,
      creatorId,
    }: {
      postId: string;
      mediaId: string;
      creatorId: string;
    }) => deleteProject(postId, mediaId, creatorId),
    onSuccess: (_, { creatorId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_PROJECTS, creatorId],
      });
    },
  });
};

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
    },
  });
};

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
    },
  });
};

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

export const useGetUserProjects = (userId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_USER_PROJECTS, userId],
    queryFn: ({ pageParam }) => getUserProjects({ pageParam, userId }),
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

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

export const useLikeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      userId,
      itemType,
    }: {
      itemId: string;
      userId: string;
      itemType: string;
    }) => likeItem(itemId, userId, itemType),
    onSuccess: (_, { itemId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
      });
    },
  });
};
export const useUnlikeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      userId,
      itemType,
    }: {
      itemId: string;
      userId: string;
      itemType: string;
    }) => unlikeItem(itemId, userId, itemType),
    onSuccess: (_, { itemId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
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

export const useSupport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      creatorId,
      supportingId,
    }: {
      creatorId: string;
      supportingId: string;
    }) => support(creatorId, supportingId),
    onSuccess: (_, { creatorId, supportingId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_SUPPORTING_USER, creatorId, supportingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO, creatorId],
      });
    },
  });
};

export const useUnSupport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      creatorId,
      supportingId,
    }: {
      creatorId: string;
      supportingId: string;
    }) => unsupport(creatorId, supportingId),
    onSuccess: (_, { creatorId, supportingId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_SUPPORTING_USER, creatorId, supportingId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_INFO, creatorId],
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

export const useCheckItemLike = (itemId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
    queryFn: () => checkItemLike(itemId, userId),
  });
};

export const useCheckPostSave = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_SAVE, postId, userId],
    queryFn: () => checkPostSave(postId, userId),
  });
};

export const useCheckSupportingUser = (
  creatorId: string,
  supportingId: string
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_SUPPORTING_USER, creatorId, supportingId],
    queryFn: () => checkSupportingUser(creatorId, supportingId),
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

export const useGetFeedbacks = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_FEEDBACKS, postId],
    queryFn: () => getFeedbacks(postId),
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
