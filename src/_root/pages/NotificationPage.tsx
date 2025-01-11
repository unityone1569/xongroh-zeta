import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import { useInView } from 'react-intersection-observer';
import { useUserContext } from '@/context/AuthContext';
import { client, appwriteConfig } from '@/lib/appwrite-apis/config';
import {
  useGetUserNotifications,
  useMarkNotificationAsRead,
} from '@/lib/tanstack-queries/notificationQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';
import Loader from '@/components/shared/Loader';
import { multiFormatDateString } from '@/lib/utils/utils';
import { getUserAccountId } from '@/lib/appwrite-apis/users';

// Database config
const db = {
  notificationsId: appwriteConfig.databases.notifications.databaseId,
};

const cl = {
  notificationId:
    appwriteConfig.databases.notifications.collections.notification,
};

interface NotificationsListProps {
  notifications: {
    pages: {
      documents: Models.Document[];
    }[];
  };
  fetchNextPage: () => void;
  hasNextPage: boolean;
  userId: string; // Add userId prop
}

const NotificationItem = React.memo(
  ({ notification }: { notification: Models.Document }) => {
    const { mutate: markAsRead } = useMarkNotificationAsRead();
    const { data: senderInfo } = useGetUserInfo(notification.senderId);
    const { ref, inView } = useInView({
      threshold: 0.5,
      triggerOnce: true,
    });

    useEffect(() => {
      if (inView && !notification.isRead) {
        markAsRead(notification.$id);
      }
    }, [inView, notification.$id, notification.isRead, markAsRead]);

    return (
      <Link
        ref={ref}
        to={`/creations/${notification.resourceId}`}
        className={`flex items-center gap-4 p-4 hover:bg-dark-4 rounded-lg transition-all ${
          !notification.isRead ? 'bg-dark-3' : ''
        }`}
      >
        <img
          src={senderInfo?.dp || '/assets/icons/profile-placeholder.svg'}
          alt="profile"
          className="w-11 h-11 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <p className="base-medium text-light-2">
              {senderInfo?.name || 'User'}
            </p>
            <p className="base-medium text-light-3">{notification.message}</p>
          </div>
          <p className="subtle-semibold text-light-4 pt-1">
            {multiFormatDateString(notification.$createdAt)}
          </p>
        </div>
        {!notification.isRead && (
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
        )}
      </Link>
    );
  }
);

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  fetchNextPage,
  hasNextPage,
  userId,
}) => {
  const { ref, inView } = useInView();
  const { mutate: markAsRead } = useMarkNotificationAsRead();

  // Effect to mark notifications as read
  useEffect(() => {
    notifications.pages.forEach((page) => {
      page.documents.forEach((notification) => {
        if (notification.receiverId === userId && !notification.isRead) {
          markAsRead(notification.$id);
        }
      });
    });
  }, [notifications.pages, userId, markAsRead]);

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col w-full gap-2">
      {notifications.pages.map((page, pageIndex) => (
        <div key={pageIndex} className="flex flex-col gap-2">
          {page.documents.map((notification) => (
            <NotificationItem
              key={notification.$id}
              notification={notification}
            />
          ))}
        </div>
      ))}

      {hasNextPage && (
        <div ref={ref} className="flex justify-center py-2">
          <Loader />
        </div>
      )}
    </div>
  );
};

const NotificationPage = () => {
  const { user } = useUserContext();
  const notificationsContainerRef = useRef<HTMLDivElement>(null);
  const [accountId, setAccountId] = React.useState<string>('');

  useEffect(() => {
    const fetchAccountId = async () => {
      const id = await getUserAccountId(user.id);
      setAccountId(id);
    };
    fetchAccountId();
  }, [user.id]);

  const {
    data: notificationsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    refetch: refetchNotifications,
  } = useGetUserNotifications(accountId);

  // Real-time updates subscription
  useEffect(() => {
    const unsubscribe = client.subscribe(
      `databases.${db.notificationsId}.collections.${cl.notificationId}.documents`,
      (response) => {
        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.create'
          )
        ) {
          refetchNotifications();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [refetchNotifications]);

  return (
    <div className="common-container">
      <div className="flex-between w-full max-w-5xl">
        <h2 className="h3-bold md:h2-bold w-full">Notifications</h2>
      </div>

      <div
        ref={notificationsContainerRef}
        className="flex flex-col flex-1 w-full max-w-5xl rounded-xl"
      >
        {isLoading ? (
          <Loader />
        ) : notificationsData?.pages[0].documents.length === 0 ? (
          <div className="text-light-4 flex-start">
            <p>No notifications yet</p>
          </div>
        ) : (
          <NotificationsList
            notifications={notificationsData || { pages: [] }}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage ?? false}
            userId={user.id} // Pass userId to NotificationsList
          />
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
