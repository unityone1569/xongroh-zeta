import { INewPost, INewUser, IUpdatePost } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPost,
  createUserAccount,
  createUserAccountWithGoogle,
  loginWithGoogle,
  signInAccount,
  signOutAccount,
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



// POSTS

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