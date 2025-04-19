import { bottombarLinks } from '@/constants';
import { Link, useLocation } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import { useGetUserPings } from '@/lib/tanstack-queries/communityQueries';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';
import { appwriteConfig, client } from '@/lib/appwrite-apis/config';
import { useGetUpcomingEventsCount } from '@/lib/tanstack-queries/eventsQueries';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const BottomBar = () => {
  const { pathname } = useLocation();
  const { user } = useUserContext();
  const queryClient = useQueryClient();
  const { data: pingCount = 0 } = useGetUserPings(user?.id);
  const { data: upcomingEventsData } = useGetUpcomingEventsCount();
  const scrollDirection = useScrollDirection();

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

  // Check if current path matches bottombar routes or any profile route
  const shouldShowBottomBar = bottombarLinks.some(
    (link) =>
      link.route === pathname ||
      pathname.startsWith('/profile') ||
      pathname === '/messages' ||
      pathname.startsWith('/circles')
  );

  if (!shouldShowBottomBar) return null;

  return (
    <section
      className={`bottom-bar transition-transform duration-300 ${
        scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      {bottombarLinks.map((link) => {
        const isActive = pathname === link.route;
        const hasEvents =
          link.label === 'Events' && upcomingEventsData?.hasUpcomingEvents;

        return (
          <div className="flex flex-col items-center" key={link.label}>
            <Link
              to={link.route}
              className={`relative ${
                isActive &&
                'bg-gradient-to-r from-light-4 to-dark-4 transition rounded-full'
              } flex-center flex-col gap-1 p-2 transition`}
            >
              <div className="relative">
                <img
                  src={link.imgURL}
                  alt={link.label}
                  width={28}
                  className={`group-hover:invert-white ${
                    isActive && 'invert-white'
                  }`}
                />
                {link.label === 'Circle' && pingCount > 0 && (
                  <span className="absolute -top-1.5 -right-[6px] w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" />
                )}
                {hasEvents && (
                  <span className="absolute -top-1.5 -right-[6px] w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" />
                )}
              </div>
            </Link>
            <p
              className={`tiny-normal mt-1 sm:subtle-comment ${
                isActive ? 'text-light-2' : 'text-light-3'
              }`}
            >
              {link.label}
            </p>
          </div>
        );
      })}
    </section>
  );
};

export default BottomBar;
