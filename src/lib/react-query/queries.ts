import { INewPost, INewUser, IUpdatePost } from '@/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  checkPostLike,
  checkPostSave,
  createPost,
  createUserAccount,
  createUserAccountWithGoogle,
  deletePost,
  getAuthorById,
  getCurrentUser,
  getInfinitePosts,
  getPostById,
  getRecentPosts,
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
