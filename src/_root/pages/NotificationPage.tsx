import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import { useInView } from 'react-intersection-observer';
import { useUserContext } from '@/context/AuthContext';
import { client, appwriteConfig } from '@/lib/appwrite-apis/config';
import {
  useGetUserNotifications,
  useMarkNotificationAsRead,
  useGetCommunityNotifications,
  useCommunityMarkNotificationAsRead,
} from '@/lib/tanstack-queries/notificationQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';
import Loader from '@/components/shared/Loader';
import { multiFormatDateString } from '@/lib/utils/utils';
import { getUserAccountId } from '@/lib/appwrite-apis/users';
import { DeleteNotification } from '@/components/shared/DeleteItems';

// Move constants outside component
const TABS = [
  { name: 'user', label: 'User' },
  { name: 'community', label: 'Community' },
] as const;

type TabType = (typeof TABS)[number]['name'];

// Optimized NotificationItem component
const NotificationItem = React.memo(
  ({
    notification,
    onMarkRead,
    type,
  }: {
    notification: Models.Document;
    onMarkRead: (id: string) => void;
    type: TabType;
  }) => {
    const { data: senderInfo } = useGetUserInfo(notification.senderId);
    const { ref, inView } = useInView({
      threshold: 0.5,
      triggerOnce: true,
    });

    useEffect(() => {
      if (inView && !notification.isRead) {
        onMarkRead(notification.$id);
      }
    }, [inView, notification.isRead, notification.$id, onMarkRead]);

    const firstName = senderInfo?.name?.split(' ')[0] || 'User';
    const isUnread = !notification.isRead;

    return (
      <div className="flex items-center gap-2">
        <Link
          ref={ref}
          to={`/${type === 'community' ? 'discussions' : 'creations'}/${
            notification.resourceId
          }`}
          className={`flex items-center gap-3 p-3 sm:p-4 hover:bg-dark-4 rounded-lg transition-all flex-grow ${
            isUnread ? 'bg-dark-3' : ''
          }`}
        >
          <img
            src={senderInfo?.dp || '/assets/icons/profile-placeholder.svg'}
            alt={`${firstName}'s profile`}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className="small-regular sm:base-medium text-light-3 line-clamp-2 sm:line-clamp-1">
              <span className="flex items-center gap-1.5">
                {firstName}
                {senderInfo?.verifiedUser && (
                  <img
                    src="/assets/icons/verified.svg"
                    alt="verified"
                    className="w-4 h-4"
                  />
                )}{' '}
                {notification.message}
              </span>
            </span>
            <time className="subtle-normal text-light-4 pt-1.5 block">
              {multiFormatDateString(notification.$createdAt)}
            </time>
          </div>
          {isUnread && (
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
          )}
        </Link>
        <DeleteNotification notificationId={notification.$id} type={type} />
      </div>
    );
  }
);

NotificationItem.displayName = 'NotificationItem';

// Add these helper functions before the NotificationPage component
const countUnreadNotifications = (notifications: any) => {
  if (!notifications?.pages) return 0;
  return notifications.pages.reduce((count: number, page: any) => {
    return count + page.documents.filter((doc: any) => !doc.isRead).length;
  }, 0);
};

// Main NotificationPage component
const NotificationPage = () => {
  const { user } = useUserContext();
  const [accountId, setAccountId] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const containerRef = useRef<HTMLDivElement>(null);
  const [unreadCounts, setUnreadCounts] = useState({
    user: 0,
    community: 0,
  });

  // Fetch account ID
  useEffect(() => {
    getUserAccountId(user.id).then(setAccountId);
  }, [user.id]);

  // Notifications queries
  const {
    data: userNotifications,
    isLoading: loadingUser,
    fetchNextPage: fetchMoreUser,
    hasNextPage: hasMoreUser,
    refetch: refetchUser,
  } = useGetUserNotifications(accountId);

  const {
    data: communityNotifications,
    isLoading: loadingCommunity,
    fetchNextPage: fetchMoreCommunity,
    hasNextPage: hasMoreCommunity,
    refetch: refetchCommunity,
  } = useGetCommunityNotifications(accountId);

  // Mark as read mutations
  const { mutate: markUserRead } = useMarkNotificationAsRead();
  const { mutate: markCommunityRead } = useCommunityMarkNotificationAsRead();

  // Handle mark as read based on type
  const handleMarkRead = useCallback(
    (id: string) => {
      if (activeTab === 'user') {
        markUserRead(id);
      } else {
        markCommunityRead(id);
      }
    },
    [activeTab, markUserRead, markCommunityRead]
  );

  // Real-time updates
  useEffect(() => {
    const unsubscribe = client.subscribe(
      [
        `databases.${appwriteConfig.databases.notifications.databaseId}.collections.${appwriteConfig.databases.notifications.collections.userNotification}.documents`,
        `databases.${appwriteConfig.databases.notifications.databaseId}.collections.${appwriteConfig.databases.notifications.collections.communityNotification}.documents`,
      ],
      (response) => {
        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.create'
          )
        ) {
          activeTab === 'user' ? refetchUser() : refetchCommunity();
        }
      }
    );

    return () => unsubscribe();
  }, [activeTab, refetchUser, refetchCommunity]);

  // Add effect to update unread counts
  useEffect(() => {
    setUnreadCounts({
      user: countUnreadNotifications(userNotifications),
      community: countUnreadNotifications(communityNotifications),
    });
  }, [userNotifications, communityNotifications]);

  const currentNotifications =
    activeTab === 'user' ? userNotifications : communityNotifications;
  const isLoading = activeTab === 'user' ? loadingUser : loadingCommunity;
  const hasMore = activeTab === 'user' ? hasMoreUser : hasMoreCommunity;
  const fetchMore = activeTab === 'user' ? fetchMoreUser : fetchMoreCommunity;

  if (!accountId) return <Loader />;

  return (
    <div className="common-container">
      <h2 className="h3-bold md:h2-bold w-full max-w-5xl mt-0 md:mt-16 lg:mt-0">
        Notifications
      </h2>

      <div
        ref={containerRef}
        className="flex flex-col w-full max-w-5xl rounded-xl"
      >
        {/* Tabs */}
        <div className="flex-start w-full mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`py-2 px-3 font-semibold relative ${
                activeTab === tab.name
                  ? 'underline text-primary-500 underline-offset-8'
                  : 'hover:text-primary-500'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.label}
                {unreadCounts[tab.name] > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-purple-400" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <Loader />
        ) : !currentNotifications?.pages[0]?.documents.length ? (
          <p className="text-light-4 text-center md:text-start md:pl-5">
            No {activeTab} notifications yet
          </p>
        ) : (
          <NotificationsList
            notifications={currentNotifications}
            hasNextPage={hasMore}
            fetchNextPage={fetchMore}
            onMarkRead={handleMarkRead}
            type={activeTab}
            userId={user.id}
          />
        )}
      </div>
    </div>
  );
};

// Optimized NotificationsList component
interface NotificationsListProps {
  notifications: {
    pages: { documents: Models.Document[] }[];
  };
  hasNextPage?: boolean;
  fetchNextPage: () => void;
  onMarkRead: (id: string) => void;
  type: TabType;
  userId: string;
}

const NotificationsList = ({
  notifications,
  hasNextPage,
  fetchNextPage,
  onMarkRead,
  type,
}: NotificationsListProps) => {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col w-full gap-2">
      {notifications.pages.map((page, i) => (
        <div key={i} className="flex flex-col gap-2">
          {page.documents.map((notification) => (
            <NotificationItem
              key={notification.$id}
              notification={notification}
              onMarkRead={onMarkRead}
              type={type}
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

export default NotificationPage;
