import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from './queryKeys';
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
  addInterestedEvent,
  deleteInterestedEvent,
  getUserInterestedEvents,
  getInterestedEventsUsersById,
  checkUserInterestedEvent,
  getUserEvents,
} from '../appwrite-apis/events';
import { INewEvent, IUpdateEvent } from '@/types';

// Use-Get-Events
export const useGetEvents = (filter: string, userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_EVENTS, filter],
    queryFn: ({ pageParam }) => getEvents({ pageParam, filter, userId }),
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.documents || lastPage.documents.length === 0) {
        return null;
      }
      const lastId = lastPage.documents[lastPage.documents.length - 1].$id;
      return lastId;
    },
    // staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    // gcTime: 30 * 60 * 1000, // Cache retained for 30 minutes
  });
};

// Use-Get-Event-By-Id
export const useGetEventById = (eventId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_EVENT_BY_ID, eventId],
    queryFn: () => getEventById(eventId),
    enabled: !!eventId,
    // staleTime: 5 * 60 * 1000,
    // gcTime: 30 * 60 * 1000,
  });
};

// Use-Create-Event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: INewEvent) => createEvent(event),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENT_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_EVENTS],
      });
    },
  });
};

// Use-Update-Event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: IUpdateEvent) => updateEvent(event),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENT_BY_ID, data?.$id],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_EVENTS],
      });
    },
  });
};

// Use-Delete-Event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, mediaId }: { eventId: string; mediaId: string }) =>
      deleteEvent(eventId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_EVENTS],
      });
    },
  });
};

// Use-Add-Interested-Event
export const useAddInterestedEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      addInterestedEvent(eventId, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [
          QUERY_KEYS.CHECK_USER_INTERESTED_EVENT,
          data.eventId,
          data.userId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INTERESTED_EVENTS_USERS, data.eventId],
      });
    },
  });
};

// Use-Delete-Interested-Event
export const useDeleteInterestedEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (interestedEventId: string) =>
      deleteInterestedEvent(interestedEventId),
    onSuccess: (eventId, userId) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_EVENTS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_USER_INTERESTED_EVENT, eventId, userId],
      });
    },
  });
};

// Use-Get-User-Interested-Events
export const useGetUserInterestedEvents = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_USER_INTERESTED_EVENTS, userId],
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      getUserInterestedEvents(userId, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastId : null),
    enabled: !!userId,
  });
};

// Use-Get-Interested-Events-Users
export const useGetInterestedEventsUsers = (eventId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_INTERESTED_EVENTS_USERS, eventId],
    queryFn: () => getInterestedEventsUsersById(eventId),
    enabled: !!eventId,
  });
};

// Use-Check-User-Interested-Event
export const useCheckUserInterestedEvent = (
  eventId: string,
  userId: string
) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_USER_INTERESTED_EVENT, eventId, userId],
    queryFn: () => checkUserInterestedEvent(eventId, userId),
    enabled: !!(eventId && userId),
  });
};

// Use-Get-User-Events
export const useGetUserEvents = (userId: string) => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_USER_EVENTS, userId],
    queryFn: ({ pageParam }) => getUserEvents(userId, pageParam),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? null : undefined),
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      documents: data.pages.reduce<any[]>((acc, page) => {
        // Filter out duplicates based on $id
        const uniqueEvents = page.documents.filter(
          (event) => !acc.some((e) => e.$id === event.$id)
        );
        return [...acc, ...uniqueEvents];
      }, []),
    }),
  });
};
