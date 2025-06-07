import { INewUser, IUpdateUser } from '@/types';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  checkSupportingUser,
  createUserAccount,
  createUserAccountWithGoogle,
  getCurrentUser,
  getInfiniteUsers,
  getTopCreators,
  getUserById,
  getUserInfo,
  getUsersWithCreatorBadge,
  loginWithGoogle,
  searchUsers,
  signInAccount,
  signOutAccount,
  support,
  unsupport,
  updateProfile,
  updateWelcomeStatus,
} from '../appwrite-apis/users';
import { QUERY_KEYS } from './queryKeys';

// *** SUPPORT QUERIES ***

// Use-Check-Supporting-User
export const useCheckSupportingUser = (
  creatorId: string,
  supportingId: string
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_SUPPORTING_USER, creatorId, supportingId],
    queryFn: () => checkSupportingUser(creatorId, supportingId),
  });
};

// Use-Support
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

// Use-UnSupport
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

// *** AUTH QUERIES ***

// Use-Create-User-Account
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

// Use-Create-User-Account-With-Google
export const useCreateUserAccountWithGoogle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (session: any) => createUserAccountWithGoogle(session),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

// Use-Sign-In-Account
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

// Use-Login-With-Google
export const useLoginWithGoogle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

// Use-Sign-Out
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

// *** USER QUERIES ***

// Use-Get-User-Info
export const useGetUserInfo = (accountId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_INFO, accountId],
    queryFn: () => getUserInfo(accountId),
    enabled: !!accountId,
  });
};

// Use-Get-Current-User
export const useGetCurrentUser = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CURRENT_USER],
    queryFn: getCurrentUser,
  });
};

//  Use-Get-User-By-Id
export const useGetUserById = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_BY_ID, userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
};

// Use-Upadte-Profile
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

// Use-Get-Top-Creators
export const useGetTopCreators = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TOP_CREATORS],
    queryFn: () => getTopCreators(),
  });
};

export const useGetUsersWithCreatorBadge = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TOP_CREATORS],
    queryFn: () => getUsersWithCreatorBadge(),
  });
};

// * USER SEARCH QUERIES *

// Use-Get-Users
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

// Use-Search-Users
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

// Use-Update-Welcome-Status
export const useUpdateWelcomeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => updateWelcomeStatus(userId),
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
