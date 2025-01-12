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

    const getFirstName = (fullName?: string) => {
      if (!fullName) return 'User';
      return fullName.split(' ')[0];
    };
    useEffect(() => {
      if (inView && !notification.isRead) {
        markAsRead(notification.$id);
      }
    }, [inView, notification.$id, notification.isRead, markAsRead]);

    return (
      <Link
        ref={ref}
        to={`/creations/${notification.resourceId}`}
        className={`flex items-center gap-3 p-3 sm:p-4 hover:bg-dark-4 rounded-lg transition-all ${
          !notification.isRead ? 'bg-dark-3' : ''
        }`}
      >
        <img
          src={senderInfo?.dp || '/assets/icons/profile-placeholder.svg'}
          alt="profile"
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex sm:items-center gap-1 sm:gap-1.5">
            <span className="small-regular sm:base-medium text-light-3 line-clamp-2 sm:line-clamp-1">
              <span className="text-light-2 small-medium sm:base-medium">
                {getFirstName(senderInfo?.name) || 'User'}
              </span>{' '}
              {notification.message}
            </span>
          </div>
          <span className="subtle-normal text-light-4 pt-1.5 block">
            {multiFormatDateString(notification.$createdAt)}
          </span>
        </div>
        {!notification.isRead && (
          <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
        )}
      </Link>
    );
  }
);

NotificationItem.displayName = 'NotificationItem';

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

  // Add useEffect for scroll management
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [notificationsData]);

  return (
    <div className="common-container">
      <div className="flex-between w-full max-w-5xl">
        <h2 className="h3-bold md:h2-bold mt-0 md:mt-16 lg:mt-0 w-full">
          Notifications
        </h2>
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
