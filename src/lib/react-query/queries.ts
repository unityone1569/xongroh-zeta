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
  getCommentReplies,
  getComments,
  getFeedbackReplies,
  getFeedbacks,
  unlikePost,
  unsavePost,
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
  likePost,
  savePost,
} from '../appwrite/interaction';
import { QUERY_KEYS } from './queryKeys';
import {
  createUserAccount,
  createUserAccountWithGoogle,
  getCurrentUser,
  getInfiniteUsers,
  getTopCreators,
  getUserById,
  getUserInfo,
  getUserPosts,
  getUserProjects,
  loginWithGoogle,
  searchUsers,
  signInAccount,
  signOutAccount,
  updateProfile,
} from '../appwrite/user';
import {
  addProject,
  createPost,
  deletePost,
  deleteProject,
  getAuthorById,
  getInfinitePosts,
  getPostById,
  getProjectById,
  getRecentPosts,
  getSavedPosts,
  searchPosts,
  updatePost,
  updateProject,
} from '../appwrite/post';

// ***** AUTH *****
// ****************

// SIGN-UP

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

// SIGN-IN

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

export const useLoginWithGoogle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

// SIGN-OUT

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

// USER-DETAILS

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

export const useGetTopCreators = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TOP_CREATORS],
    queryFn: () => getTopCreators(),
  });
};

// ***** POSTS, PROJECTS & DISCUSSIONS *****
// *****************************************

// POST

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
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
    queryFn: getRecentPosts as any,
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      // If there's no data or empty results, there are no more pages
      if (!lastPage?.documents || lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last document as the cursor
      const lastId = lastPage.documents[lastPage.documents.length - 1].$id;
      return lastId;
    },
  });
};

export const useGetPostById = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,

    // Add caching configuration
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 19 * 60 * 1000 // Cache retained for 30 minutes
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

export const useGetUserPosts = (userId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_USER_POSTS, userId], // Unique key per user
    queryFn: ({ pageParam }) => getUserPosts({ pageParam, userId }), // Pass userId to getUserPosts
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null; // No more pages if no data
      }

      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};

export const useGetSavedPosts = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
    queryFn: ({ pageParam }) => getSavedPosts({ pageParam, userId }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.documents || lastPage.documents.length === 0) {
        return null;
      }
      // Use the saveId (saves collection document $id) for cursor
      const lastSaveId = lastPage.documents[lastPage.documents.length - 1].saveId;
      return lastSaveId;
    },
    enabled: !!userId,
  });
};

// PROJECT

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

// SEARCH

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
    queryFn: async () => {
      if (!searchTerm.trim()) {
        // Return an empty result if the search term is blank
        return { documents: [] };
      }
      return searchPosts(searchTerm);
    },
    enabled: searchTerm.length >= 2, // Only search with 3+ characters
    staleTime: 2 * 60 * 1000, // Cache search results
  });
};

export const useGetUsers = () => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_INFINITE_USERS],
    queryFn: getInfiniteUsers as any,
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

export const useSearchUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_USERS, searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { documents: [] }; // Return empty result for blank search term
      }
      return searchUsers(searchTerm);
    },
    enabled: !!searchTerm, // Fetch only when a search term exists
  });
};

// ***** LIKE, SAVE & SUPPORT *****
// ********************************

// LIKE-POST

export const useCheckPostLike = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_LIKE, postId, userId],
    queryFn: () => checkPostLike(postId, userId),
  });
};

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

// LIKE-ITEM

export const useCheckItemLike = (itemId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
    queryFn: () => checkItemLike(itemId, userId),
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

// SAVE-POST

export const useCheckPostSave = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_SAVE, postId, userId],
    queryFn: () => checkPostSave(postId, userId),
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
    onSuccess: (_, { postId, userId, postType }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POST_DETAILS, postId],
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
    onSuccess: (_, { postId, userId, postType }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POSTS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POST_DETAILS, postId],
      });
    },
  });
};

// SUPPORT

export const useCheckSupportingUser = (
  creatorId: string,
  supportingId: string
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_SUPPORTING_USER, creatorId, supportingId],
    queryFn: () => checkSupportingUser(creatorId, supportingId),
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

// ***** COMMENT, FEEDBACK & REPLIES *****
// ***************************************

// COMMENT

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

// FEEDBACK

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

// COMMENT-REPLY

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

// FEEDBACK-REPLY

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
