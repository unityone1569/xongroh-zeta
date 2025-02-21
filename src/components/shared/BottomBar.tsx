import { bottombarLinks } from '@/constants';
import { Link, useLocation } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import { useGetUserPings } from '@/lib/tanstack-queries/communityQueries';

const BottomBar = () => {
  const { pathname } = useLocation();
  const { user } = useUserContext();

  // Get community pings for current user
  const { data: pingCount = 0 } = useGetUserPings(user?.id);

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
    <section className="bottom-bar">
      {bottombarLinks.map((link) => {
        const isActive = pathname === link.route;

        return (
          <Link
            to={link.route}
            key={link.label}
            className={`relative ${
              isActive &&
              'bg-gradient-to-r from-light-4 to-dark-4 transition rounded-full'
            } flex-center flex-col gap-1 p-3 transition`}
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
                <span className="absolute -top-2.5 -right-[6px] w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full" />
              )}
            </div>
          </Link>
        );
      })}
    </section>
  );
};

export default BottomBar;
