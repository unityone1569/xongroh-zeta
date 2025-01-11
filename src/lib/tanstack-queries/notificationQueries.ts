import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getUserNotifications,
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
  notificationId:
    appwriteConfig.databases.notifications.collections.notification,
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


export const useUnreadNotifications = (userId: string) => {
  const queryClient = useQueryClient();
  const { data: notifications } = useGetUserNotifications(userId);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to notifications collection
    const unsubscribe = client.subscribe(
      `databases.${db.notificationsId}.collections.${cl.notificationId}.documents`,
      (response) => {
        // When notifications are created or updated
        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.create'
          ) ||
          response.events.includes(
            'databases.*.collections.*.documents.*.update'
          )
        ) {
          // Invalidate and refetch notifications query
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.GET_USER_NOTIFICATIONS, userId],
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);

  const hasUnreadNotifications = useMemo(() => {
    return notifications?.pages?.some((page) =>
      page.documents.some(
        (notification) =>
          (notification as any).receiverId === userId && !(notification as any).isRead
      )
    );
  }, [notifications, userId]);

  return { hasUnreadNotifications };
};
