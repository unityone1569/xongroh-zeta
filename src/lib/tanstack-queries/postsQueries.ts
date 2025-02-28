import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from './queryKeys';
import {
  addCreation,
  addProject,
  deleteCreation,
  deleteProject,
  getAuthorById,
  getCreationById,
  getInfiniteCreations,
  getProjectById,
  getRecentCreations,
  getSavedCreations,
  getSearchCreations,
  getSupportingCreations,
  updateCreation,
  updateProject,
} from '../appwrite-apis/posts';
import { getUserCreations, getUserProjects } from '../appwrite-apis/users';
import {
  INewCreation,
  INewProject,
  IUpdateCreation,
  IUpdateProject,
} from '@/types';

// *** CREATION QUERIES ***

// Use-Get-Recent-Creations
export const useGetRecentCreations = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_RECENT_CREATIONS],
    queryFn: getRecentCreations as any,
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

// Use-Get-Creation-By-Id
export const useGetCreationById = (CreationId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, CreationId],
    queryFn: () => getCreationById(CreationId),
    enabled: !!CreationId,

    // Add caching configuration
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    gcTime: 19 * 60 * 1000, // Cache retained for 30 minutes
  });
};

// Use-Get-User-Creations
export const useGetUserCreations = (authorId: string) => {
  9;
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_USER_CREATIONS, authorId], // Unique key per user
    queryFn: ({ pageParam }) => getUserCreations({ pageParam, authorId }), // Pass userId to getUserCreations
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null; // No more pages if no data
      }

      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};

// Use-Get-Saved-Creations
export const useGetSavedCreations = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_SAVED_CREATIONS, userId],
    queryFn: ({ pageParam }) => getSavedCreations({ pageParam, userId }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.documents || lastPage.documents.length === 0) {
        return null;
      }
      // Use the saveId (saves collection document $id) for cursor
      const lastSaveId =
        lastPage.documents[lastPage.documents.length - 1].saveId;
      return lastSaveId;
    },
    enabled: !!userId,
  });
};

// Use-Add-Creation
export const useAddCreation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (creation: INewCreation) => addCreation(creation),
    onSuccess: (_, { authorId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SUPPORTING_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_CREATIONS, authorId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INFINITE_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SEARCH_CREATIONS],
      });
    },
  });
};

// Use-Update-Creation
export const useUpdateCreation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (creation: IUpdateCreation) => updateCreation(creation),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_CREATIONS, data?.authorId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [[QUERY_KEYS.GET_SUPPORTING_CREATIONS]],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INFINITE_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SEARCH_CREATIONS],
      });
    },
  });
};

// Use-Delete-Creation
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      creationId,
      mediaId,
      authorId,
    }: {
      creationId: string;
      mediaId: string;
      authorId: string;
    }) => deleteCreation(creationId, mediaId, authorId),
    onSuccess: (_, { authorId }) => {
      queryClient.invalidateQueries({
        queryKey: [[QUERY_KEYS.GET_SUPPORTING_CREATIONS]],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_CREATIONS, authorId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INFINITE_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SEARCH_CREATIONS],
      });
    },
  });
};

// use-Get-Following-Creations
export const useGetSupportingCreations = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_SUPPORTING_CREATIONS, userId],
    queryFn: ({ pageParam }) => getSupportingCreations({ pageParam, userId }),
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
    enabled: !!userId,
  });
};

// * CREATION SEARCH QUERIES *

// Use-Get-Infinite-Creations
export const useGetInfiniteCreations = () => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_INFINITE_CREATIONS],
    queryFn: getInfiniteCreations as any,
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

// Use-Get-Search-Creations
export const useGetSearchCreations = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SEARCH_CREATIONS, searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        // Return an empty result if the search term is blank
        return { documents: [] };
      }
      return getSearchCreations(searchTerm);
    },
    enabled: searchTerm.length >= 2, // Only search with 3+ characters
    staleTime: 2 * 60 * 1000, // Cache search results
  });
};

// *** PROJECT QUERIES ***

// Use-Get-Project-By-Id
export const useGetProjectById = (projectId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, projectId],
    queryFn: () => getProjectById(projectId),
    enabled: !!projectId,
  });
};

// Use-Get-User-Projects
export const useGetUserProjects = (authorId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_USER_PROJECTS, authorId],
    queryFn: ({ pageParam }) => getUserProjects({ pageParam, authorId }),
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};

// Use-Add-Project
export const useAddProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (project: INewProject) => addProject(project),
    onSuccess: (_, { authorId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_PROJECTS, authorId],
      });
    },
  });
};

// Use-Update-Project
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: IUpdateProject) => updateProject(project),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_PROJECTS, data?.authorId],
      });
    },
  });
};

// Use-Delete-Project
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      mediaId,
      authorId,
    }: {
      projectId: string;
      mediaId: string;
      authorId: string;
    }) => deleteProject(projectId, mediaId, authorId),
    onSuccess: (_, { authorId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_PROJECTS, authorId],
      });
    },
  });
};

// *** HELPER ***

// Use-Get-Author-By-Id
export const useGetAuthorById = (creatorId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, creatorId],
    queryFn: () => getAuthorById(creatorId),
    enabled: !!creatorId,
  });
};
