import { Link, NavLink, useLocation } from 'react-router-dom';
import { INavLink, IUser } from '@/types';
import { memo, useMemo } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { sidebarLinks } from '@/constants';

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

  return (
    <nav className="leftsidebar">
      <div className="flex flex-col gap-11">
        <Link to="/" className="flex gap-3 items-center">
          <img src="/assets/icons/logo.svg" alt="logo" width={48} />
          <h3 className="h3-bold md:h3-bold">xongroh</h3>
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
