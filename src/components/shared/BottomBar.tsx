import { bottombarLinks } from '@/constants';
import { Link, useLocation } from 'react-router-dom';

const BottomBar = () => {
  const { pathname } = useLocation();

  // Check if current path matches bottombar routes or any profile route
  const shouldShowBottomBar = bottombarLinks.some(
    (link) =>
      link.route === pathname ||
      pathname.startsWith('/profile') ||
      pathname === '/messages'
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
            className={` ${
              isActive &&
              'bg-gradient-to-r from-purple-500 to-purple-400 rounded-full'
            } flex-center flex-col gap-1 p-3 transition`}
          >
            <img
              src={link.imgURL}
              alt={link.label}
              width={28}
              className={`group-hover:invert-white ${
                isActive && 'invert-white'
              }`}
            />
          </Link>
        );
      })}
    </section>
  );
};

export default BottomBar;
