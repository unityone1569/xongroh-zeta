import { Link, NavLink } from 'react-router-dom';
import { Models } from 'appwrite';
import Loader from './Loader';
import { rightbarLinks } from '@/constants';
import { INavLink } from '@/types';
import { useUserContext } from '@/context/AuthContext';
import { useGetTopCreators } from '@/lib/tanstack-queries/usersQueries';
import { useUnreadMessages } from '@/lib/tanstack-queries/conversationsQueries';

const RightSideBar = () => {
  const { data: creators, isLoading } = useGetTopCreators();
  const { user } = useUserContext();
  const { hasUnreadMessages } = useUnreadMessages(user?.id);

  return (
    <div className="rightsidebar">
      {/* Message Navigation Section */}

      <ul className="flex flex-col gap-6">
        {rightbarLinks.map((link: INavLink) => (
          <li key={link.label} className="rightsidebar-link group">
            <NavLink
              to={link.route}
              className="flex gap-3 items-center pl-0 p-3 relative"
            >
              <div className="relative">
                <img
                  src={link.imgURL}
                  alt={link.label}
                  className="group-hover:invert-white w-7"
                />
                {link.label === 'Messages' && hasUnreadMessages && (
                  <span className="absolute -top-1 -right-[1px] w-3 h-3 bg-green-500 rounded-full" />
                )}
              </div>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Top Creators Section */}
      <div>
        <h3 className="h3-bold text-light-1 mb-7">Top Creators</h3>
        {isLoading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {creators?.documents.map((creator) => (
              <CreatorCard key={creator.$id} creator={creator} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// CreatorCard component remains the same
const CreatorCard = ({ creator }: { creator: Models.Document }) => {
  return (
    <Link
      to={`/profile/${creator.$id}`}
      className="creator-card flex-col items-center text-center"
    >
      <img
        src={creator.dpUrl || '/assets/icons/profile-placeholder.svg'}
        alt="creator"
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="mt-2 w-full">
        <p className="small-bold text-light-1 line-clamp-1">{creator.name}</p>
        <p className="subtle-normal text-light-3 pt-1 line-clamp-1">
          {creator.profession || 'Creator'}
        </p>
      </div>
    </Link>
  );
};

export default RightSideBar;
