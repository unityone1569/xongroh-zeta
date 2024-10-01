import { INewUser } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUserAccount,
  createUserAccountWithGoogle,
  loginWithGoogle,
  signInAccount,
  signOutAccount,
} from '../appwrite/api';

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
