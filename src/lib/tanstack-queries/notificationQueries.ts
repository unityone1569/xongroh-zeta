import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  deleteCommunityNotification,
  deleteNotification,
  getCommunityNotifications,
  getUserNotifications,
  markCommunityNotificationAsRead,
  markNotificationAsRead,
} from '../appwrite-apis/notification';
import { QUERY_KEYS } from './queryKeys';
import { useEffect, useMemo } from 'react';
import { appwriteConfig, client } from '../appwrite-apis/config';

// Collections
const db = {
  notificationsId: appwriteConfig.databases.notifications.databaseId,
};

// Collections
const cl = {
  userNotificationId:
    appwriteConfig.databases.notifications.collections.userNotification,
  communityNotificationId:
    appwriteConfig.databases.notifications.collections.communityNotification,
};

// Use-Get-User-Notifications
export const useGetUserNotifications = (receiverId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_USER_NOTIFICATIONS, receiverId],
    queryFn: ({ pageParam }) => getUserNotifications({ pageParam, receiverId }),
    getNextPageParam: (lastPage: any) => {
      // Stop pagination if no more notifications
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last notification as cursor
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: !!receiverId,
  });
};

// Use-Mark-Notification-As-Read
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_USER_NOTIFICATIONS],
      });
    },
  });
};

// use-Unread-Notifications
export const useUnreadNotifications = (accountId: string) => {
  const { data: userNotifications } = useGetUserNotifications(accountId);
  const { data: communityNotifications } =
    useGetCommunityNotifications(accountId);

  const hasUnreadNotifications = useMemo(() => {
    if (!accountId) return false;

    const hasUserUnread = userNotifications?.pages?.some((page) =>
      page.documents.some((notification) => !notification.isRead)
    );

    const hasCommunityUnread = communityNotifications?.pages?.some((page) =>
      page.documents.some((notification) => !notification.isRead)
    );

    return hasUserUnread || hasCommunityUnread;
  }, [accountId, userNotifications, communityNotifications]);

  const unreadCounts = useMemo(() => {
    let user = 0;
    let community = 0;

    userNotifications?.pages?.forEach((page) => {
      user += page.documents.filter((doc) => !doc.isRead).length;
    });

    communityNotifications?.pages?.forEach((page) => {
      community += page.documents.filter((doc) => !doc.isRead).length;
    });

    return { user, community };
  }, [userNotifications, communityNotifications]);

  return {
    hasUnreadNotifications,
    unreadCounts,
  };
};

// Use-Delete-Notification
export const useDeleteNotification = (type: 'user' | 'community') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      type === 'user'
        ? deleteNotification(notificationId)
        : deleteCommunityNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          type === 'user'
            ? QUERY_KEYS.GET_USER_NOTIFICATIONS
            : QUERY_KEYS.GET_COMMUNITY_NOTIFICATIONS,
        ],
      });
    },
  });
};

// Use-Get-Community-Notifications
export const useGetCommunityNotifications = (receiverId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_COMMUNITY_NOTIFICATIONS, receiverId],
    queryFn: ({ pageParam }) =>
      getCommunityNotifications({ pageParam, receiverId }),
    getNextPageParam: (lastPage: any) => {
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: !!receiverId,
  });
};

// Community notification hooks
export const useCommunityMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markCommunityNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_COMMUNITY_NOTIFICATIONS],
      });
    },
  });
};

export const useUnreadCommunityNotifications = (userId: string) => {
  const queryClient = useQueryClient();
  const { data: notifications } = useGetCommunityNotifications(userId);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = client.subscribe(
      `databases.${db.notificationsId}.collections.${cl.communityNotificationId}.documents`,
      (response) => {
        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.create'
          ) ||
          response.events.includes(
            'databases.*.collections.*.documents.*.update'
          )
        ) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.GET_COMMUNITY_NOTIFICATIONS, userId],
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);

  const hasUnreadCommunityNotifications = useMemo(() => {
    return notifications?.pages?.some((page) =>
      page.documents.some(
        (notification) =>
          notification.receiverId === userId && !notification.isRead
      )
    );
  }, [notifications, userId]);

  return { hasUnreadCommunityNotifications };
};
