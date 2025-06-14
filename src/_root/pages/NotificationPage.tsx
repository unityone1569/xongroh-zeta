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
  { name: 'circle', label: 'Circle' },
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
          to={`/${type === 'circle' ? 'discussions' : 'creations'}/${
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

const messageGroups = () => (
  <div className="max-w-3xl bg-dark-4 rounded-xl p-6 border border-dark-4 relative">
    {/* New Badge with gradient and animation */}
    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-primary-600 to-primary-500 text-light-1 text-xs font-bold px-3.5 py-1.5 rounded-full">
      <span className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-light-1 rounded-full animate-ping mb-0.5"></span>
        <span className="subtle-semibold">NEW!</span>
      </span>
    </div>

    <div className="flex flex-col gap-4">
      <h3 className="text-light-1 h4-bold lg:h3-bold">
        Join the Xongroh - Founding Creators Groups
      </h3>

      <p className="text-light-3 small-regular lg:base-regular text-pretty">
        Stay connected with us! Get instant updates, share your valuable
        feedback, and play a key role in shaping the future of our
        creator-focused platform.{' '}
        <span className="text-primary-500">
          Limited Spots Available - Exclusive to Founding Creators Only!
        </span>
      </p>

      <div className="flex flex-col sm:flex-row gap-5 sm:gap-3 mt-3">
        <a
          href="https://chat.whatsapp.com/BbkvBnvxf83Ht7u4tgai7H"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-light-1 text-sm sm:text-md font-semibold py-2.5 px-6 rounded-lg transition-all duration-300"
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 448 512"
            className="w-5 h-5"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
          Join WhatsApp Fam
        </a>

        <a
          href="https://t.me/+dyY1LMM3NRUzOTg1"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#229ED9] hover:to-[#2AABEE] text-light-1 text-sm sm:text-md font-semibold py-2.5 px-6 rounded-lg transition-all duration-300"
        >
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 496 512"
            className="w-5 h-5"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z" />
          </svg>
          Join Telegram Gang
        </a>
      </div>
    </div>
  </div>
);
// Main NotificationPage component
const NotificationPage = () => {
  const { user } = useUserContext();
  const [accountId, setAccountId] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const containerRef = useRef<HTMLDivElement>(null);
  const [unreadCounts, setUnreadCounts] = useState({
    user: 0,
    circle: 0,
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
      circle: countUnreadNotifications(communityNotifications),
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
      <h2 className="h3-bold md:h2-bold w-full max-w-3xl mt-0 md:mt-16 lg:mt-0">
        Notifications
      </h2>

      {user?.badges?.includes('B9001') && messageGroups()}
      
      <div
        ref={containerRef}
        className="flex flex-col w-full max-w-3xl rounded-xl"
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
