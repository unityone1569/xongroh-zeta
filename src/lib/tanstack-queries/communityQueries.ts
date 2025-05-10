import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from './queryKeys';
import {
  getCommunities,
  getCommunityById,
  getCommunityMembers,
  getCommunityTopics,
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  getSearchDiscussions,
  createPing,
  markAsReadPing,
  getTopicPings,
  getCommunityPings,
  getUserCommunities,
  getUserDiscussions,
  getUserSavedDiscussions,
  getTopicById,
  getSearchCommunities,
  joinCommunity,
  leaveCommunity,
  checkMembershipStatus,
  getUserPings,
  markAllPingsAsRead,
  getAllDiscussions,
} from '../appwrite-apis/community';

// *** COMMUNITIES QUERIES ***

// use-Get-Communities
export const useGetCommunities = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_COMMUNITIES],
    queryFn: getCommunities as any,
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};

// use-Get-Community-By-Id
export const useGetCommunityById = (communityId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMUNITY_BY_ID, communityId],
    queryFn: () => getCommunityById(communityId),
    enabled: !!communityId,
  });
};

// use-Get-User-Communities
export const useGetUserCommunities = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_USER_COMMUNITIES, userId],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      getUserCommunities({ pageParam, userId }),
    initialPageParam: null,
    enabled: !!userId,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.documents?.length) return null;

      // Get the last membership document's ID
      const lastMembership =
        lastPage.memberships?.[lastPage.memberships.length - 1];
      return lastMembership?.$id || null;
    },
  });
};

// use-Get-Community-Topics
export const useGetCommunityTopics = (communityId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_COMMUNITY_TOPICS, communityId],
    queryFn: ({ pageParam }) => getCommunityTopics({ communityId, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) return null;
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: !!communityId,
  });
};

// use-Get-Community-Members
export const useGetCommunityMembers = (communityId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_COMMUNITY_MEMBERS, communityId],
    queryFn: ({ pageParam }) => getCommunityMembers({ communityId, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) return null;
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: !!communityId,
  });
};

// use-Get-Search-Communities
export const useGetSearchCommunities = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SEARCH_COMMUNITIES, searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { documents: [] };
      }
      return getSearchCommunities(searchTerm);
    },
    enabled: !!searchTerm,
  });
};

// use-Join-Community
export const useJoinCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      communityId,
    }: {
      userId: string;
      communityId: string;
    }) => joinCommunity(userId, communityId),
    onSuccess: (_, { communityId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMUNITY_MEMBERS, communityId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_COMMUNITIES],
      });
    },
  });
};

// use-Leave-Community
export const useLeaveCommunity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      communityId,
    }: {
      userId: string;
      communityId: string;
    }) => leaveCommunity(userId, communityId),
    onSuccess: (_, { communityId }) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMUNITY_MEMBERS, communityId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_COMMUNITIES],
      });
    },
  });
};

// use-Check-Membership-Status
export const useCheckMembershipStatus = (
  userId: string,
  communityId: string
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_MEMBERSHIP_STATUS, userId, communityId],
    queryFn: () => checkMembershipStatus(userId, communityId),
    enabled: !!(userId && communityId),
  });
};

// TODO: Add query-functions for communities - add, delete, update, etc.

// *** TOPICS QUERIES ***

// use-get-topics-by-id
export const useGetTopicsById = (topicId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TOPIC_BY_ID, topicId],
    queryFn: () => getTopicById(topicId),
    enabled: !!topicId,
  });
};

// TODO: Add query-functions for topics - add, delete, update, etc.

// *** DISCUSSIONS QUERIES ***

// use-Get-All-Discussions
export const useGetAllDiscussions = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_ALL_DISCUSSIONS],
    queryFn: ({ pageParam }) => getAllDiscussions({ pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) return null;
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
  });
};

// use-Get-Discussions
export const useGetDiscussions = (topicId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_DISCUSSIONS, topicId],
    queryFn: ({ pageParam }) => getDiscussions({ topicId, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) return null;
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: !!topicId,
  });
};

// use-Get-Discussion-By-Id
export const useGetDiscussionById = (discussionId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_DISCUSSION_BY_ID, discussionId],
    queryFn: () => getDiscussionById(discussionId),
    enabled: !!discussionId,
  });
};

// use-Get-User-Discussions
export const useGetUserDiscussions = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_USER_DISCUSSIONS, userId],
    queryFn: ({ pageParam }) => getUserDiscussions({ userId, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) return null;
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: !!userId,
  });
};

// use-Get-User-Saved-Discussions
export const useGetUserSavedDiscussions = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_USER_SAVED_DISCUSSIONS, userId],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      getUserSavedDiscussions({ userId, pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      if (!lastPage?.savedPosts?.length) return null;
      const lastSave = lastPage.savedPosts[lastPage.savedPosts.length - 1];
      return lastSave?.$id || null;
    },
    enabled: !!userId,
  });
};

// use-Create-Discussion
export const useCreateDiscussion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discussion,
      communityId,
    }: {
      discussion: any;
      communityId: string;
    }) => createDiscussion(discussion, communityId),
    onSuccess: (_, { discussion }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DISCUSSIONS, discussion.topicId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_SAVED_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_DISCUSSIONS, discussion?.authorId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SEARCH_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ALL_DISCUSSIONS],
      });
    },
  });
};

// use-Update-Discussion
export const useUpdateDiscussion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discussion: any) => updateDiscussion(discussion),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DISCUSSION_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_SAVED_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_DISCUSSIONS, data?.authorId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SEARCH_DISCUSSIONS],
      });
    },
  });
};

// use-Delete-Discussion
export const useDeleteDiscussion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discussionId,
      mediaId,
      authorId,
    }: {
      discussionId: string;
      mediaId: string;
      authorId: string;
    }) => deleteDiscussion(discussionId, mediaId, authorId),
    onSuccess: (_, { authorId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_DISCUSSIONS, authorId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_SAVED_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SEARCH_DISCUSSIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ALL_DISCUSSIONS],
      });
    },
  });
};

// use-Get-Search-Discussions
export const useGetSearchDiscussions = (searchTerm: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_SEARCH_DISCUSSIONS, searchTerm],
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { documents: [] };
      }
      return getSearchDiscussions(searchTerm);
    },
    enabled: !!searchTerm,
  });
};

// *** PINGS QUERIES ***

// use-Create-Ping
export const useCreatePing = () => {
  return useMutation({
    mutationFn: ({
      communityId,
      topicId,
      authorId,
    }: {
      communityId: string;
      topicId: string;
      authorId: string;
    }) => createPing({ communityId, topicId, authorId }),
  });
};

// use-Mark-Ping-As-Read
export const useMarkPingAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      communityId,
      topicId,
    }: {
      userId: string;
      communityId: string;
      topicId: string;
    }) => markAsReadPing({ userId, communityId, topicId }),
    onSuccess: (_, { topicId, communityId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_TOPIC_PINGS, topicId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMUNITY_PINGS, communityId],
      });
    },
  });
};

// use-Get-Topic-Pings
export const useGetTopicPings = (topicId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_TOPIC_PINGS, topicId, userId],
    queryFn: () => getTopicPings({ topicId, userId }),
    enabled: !!(topicId && userId),
  });
};

// use-Get-Community-Pings
export const useGetCommunityPings = (communityId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_COMMUNITY_PINGS, communityId, userId],
    queryFn: () => getCommunityPings({ communityId, userId }),
    enabled: !!(communityId && userId),
  });
};

// use-Get-User-Pings
export const useGetUserPings = (userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_USER_PINGS, userId],
    queryFn: () => getUserPings(userId),
    enabled: !!userId,
  });
};

export const useMarkAllPingsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      communityId,
      topicId,
    }: {
      userId: string;
      communityId: string;
      topicId: string;
    }) => markAllPingsAsRead({ userId, communityId, topicId }),
    onSuccess: (_, { topicId, communityId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_TOPIC_PINGS, topicId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMUNITY_PINGS, communityId],
      });
    },
  });
};
