import { Link, NavLink, useLocation } from 'react-router-dom';
import { INavLink } from '@/types';
import Loader from './Loader';

import { useUserContext } from '@/context/AuthContext';
import { sidebarLinks } from '@/constants';

const LeftSidebar = () => {
  const { pathname } = useLocation();
  const { user, isLoading } = useUserContext();

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

          {/* Profile Section inside UL with is-active status */}
          {isLoading || !user.email ? (
            <li className="h-14">
              <Loader />
            </li>
          ) : (
            <li
              className={`leftsidebar-link group ${
                pathname === `/profile/${user?.id}` &&
                'bg-gradient-to-r from-violet-600 to-indigo-600'
              }`}
            >
              <NavLink
                to={`/profile/${user?.id}`}
                className="flex gap-4 items-center p-3"
              >
                <img
                  src={user?.dpUrl || '/assets/icons/profile-placeholder.svg'}
                  alt="profile"
                  className="w-7 h-7 object-cover rounded-full ml-0.5 "
                />
                <div className="flex flex-col">
                  <p>Profile</p>
                </div>
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default LeftSidebar;
