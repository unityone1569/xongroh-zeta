import { INewUser } from '@/types';
import { useMutation } from '@tanstack/react-query';
import {
  createUserAccount,
  createUserAccountWithGoogle,
  loginWithGoogle,
  signInAccount,
  signOutAccount,
} from '../appwrite/api';



// ***** AUTHENTICATION *****

export const useCreateUserAccount = () => {
  return useMutation({
    mutationFn: (user: INewUser) => createUserAccount(user),
  });
};
export const useCreateUserAccountWithGoogle = (session: any) => {
  return useMutation({
    mutationFn: () => createUserAccountWithGoogle(session),
  });
};

export const useLoginWithGoogle = () => {
  return useMutation({
    mutationFn: () => loginWithGoogle(),
  });
};

export const useSignInAccount = () => {
  return useMutation({
    mutationFn: (user: { email: string; password: string }) =>
      signInAccount(user),
  });
};

export const useSignOutAccount = () => {
  return useMutation({
    mutationFn: signOutAccount,
  });
};
