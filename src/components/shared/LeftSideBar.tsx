import { Link, NavLink, useLocation } from 'react-router-dom';
import { INavLink, IUser } from '@/types';
import { memo, useMemo, useEffect } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { sidebarLinks } from '@/constants';
import { useGetUserPings } from '@/lib/tanstack-queries/communityQueries';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';
import { appwriteConfig, client } from '@/lib/appwrite-apis/config';

const ProfileSection = memo(
  ({
    user,
    pathname,
  }: {
    user: IUser | null;

    pathname: string;
  }) => {
    const profileClassName = useMemo(() => {
      return `leftsidebar-link group ${
        pathname === `/profile/${user?.id}`
          ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
          : ''
      }`;
    }, [pathname, user?.id]);

    if (!user) {
      return <li className="h-14">User not found</li>;
    }

    return (
      <li className={profileClassName}>
        <NavLink
          to={`/profile/${user.id}`}
          className="flex gap-4 items-center p-3"
        >
          <img
            src={user.dpUrl || '/assets/icons/profile-placeholder.svg'}
            alt="profile"
            className="w-7 h-7 object-cover rounded-full ml-0.5"
          />
          <div className="flex flex-col">
            <p>Profile</p>
          </div>
        </NavLink>
      </li>
    );
  }
);

const LeftSidebar = () => {
  const { pathname } = useLocation();
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const { data: pingCount = 0 } = useGetUserPings(user?.id);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databases.communities.databaseId}.collections.${appwriteConfig.databases.communities.collections.ping}.documents`,
      (response) => {
        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.create'
          ) ||
          response.events.includes(
            'databases.*.collections.*.documents.*.update'
          ) ||
          response.events.includes(
            'databases.*.collections.*.documents.*.delete'
          )
        ) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.GET_USER_PINGS, user.id],
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, queryClient]);

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link to="/" className="flex gap-1 items-center pl-1.5">
          <img src="/assets/icons/logo.svg" alt="logo" className="h-9 w-9" />
          <h3 className="text-[26px] font-bold leading-[140%] tracking-wider">
            ongroh
          </h3>
        </Link>

        <ul className="flex flex-col gap-6 mt-8">
          {sidebarLinks.map((link: INavLink) => {
            const isActive = pathname === link.route;

            return (
              <li
                key={link.label}
                className={`leftsidebar-link group ${
                  isActive && 'bg-gradient-to-r from-violet-600 to-indigo-600'
                }`}
              >
                <NavLink
                  to={link.route}
                  className="flex gap-4 items-center p-3"
                >
                  <img
                    src={link.imgURL}
                    alt={link.label}
                    className={`group-hover:invert-white w-7 ${
                      isActive && 'invert-white'
                    }`}
                  />
                  {link.label}

                  {link.label === 'Circle' && pingCount > 0 && (
                    <span className=" -top-1 -right-[1px] w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" />
                  )}
                </NavLink>
              </li>
            );
          })}

          <ProfileSection user={user} pathname={pathname} />
        </ul>
      </div>
    </nav>
  );
};

export default LeftSidebar;
