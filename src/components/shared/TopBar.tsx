import { Link } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import { useUnreadMessages } from '@/lib/tanstack-queries/conversationsQueries';
import { useUnreadNotifications } from '@/lib/tanstack-queries/notificationQueries';
import { getUserAccountId } from '@/lib/appwrite-apis/users';
import { useEffect, useState } from 'react';

const Topbar = () => {
  const { user } = useUserContext();
  const [accountId, setAccountId] = useState<string>('');

  useEffect(() => {
    const fetchAccountId = async () => {
      const id = await getUserAccountId(user?.id);
      setAccountId(id);
    };
    fetchAccountId();
  }, [user?.id]);

  const { hasUnreadMessages } = useUnreadMessages(user?.id);
  const { hasUnreadNotifications } = useUnreadNotifications(accountId);

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img src="/assets/icons/logo.svg" alt="logo" width={36} />
          <h3 className="h3-bold md:h3-bold">xongroh</h3>
        </Link>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Link to={'/messages'}>
              <img
                src={'/assets/icons/message.svg'}
                alt="messages"
                className="h-7 w-7"
              />
              {hasUnreadMessages && (
                <span className="absolute -top-1 -right-[1px] w-3 h-3 bg-purple-500 rounded-full" />
              )}
            </Link>
          </div>
          <div className="relative">
            <Link to={'/notifications'}>
              <img
                src={'/assets/icons/notification.svg'}
                alt="notifications"
                className="h-7 w-7"
              />
              {hasUnreadNotifications && (
                <span className="absolute -top-1 -right-[1px] w-3 h-3 bg-purple-500 rounded-full" />
              )}
            </Link>
          </div>
          <div>
            <Link to={`/profile/${user.id}`}>
              <img
                src={user.dpUrl || '/assets/icons/profile-placeholder.svg'}
                alt="profile"
                className="h-11 object-cover w-11 rounded-full"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Topbar;
