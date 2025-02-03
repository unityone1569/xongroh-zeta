import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import LazyImage from '../LazyImage';
import { useGetCommunityPings } from '@/lib/tanstack-queries/communityQueries';
import { useUserContext } from '@/context/AuthContext';

type CommunityCardProps = {
  community: Models.Document & { membersCount?: number };
};

const CommunityCard = ({ community }: CommunityCardProps) => {
  const { user } = useUserContext();
  const { data: pingCount = 0 } = useGetCommunityPings(community.$id, user.id);

  return (
    <div className="user-card flex flex-start gap-4 bg-dark-2">
      <div className="flex-shrink-0">
        <Link to={`/communities/${community.$id}`}>
          <LazyImage
            src={community.imageUrl || '/assets/icons/profile-placeholder.svg'}
            alt={community.name}
            className="w-12 h-12 object-cover rounded-full"
          />
        </Link>
      </div>

      <div className="w-full flex-col">
        <Link to={`/communities/${community.$id}`}>
          <div className="flex items-center gap-2">
            <h3 className="base-medium line-clamp-1">{community.name}</h3>
          </div>
        </Link>

        <div className="flex gap-2 pt-1 justify-start items-center">
          <p className="subtle-normal line-clamp-1 lg:subtle-comment text-light-3">
            Members: {community.membersCount || 0}
          </p>
        </div>
      </div>

      {pingCount > 0 && (
        <div className="flex-shrink-0 pr-1.5">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full flex-shrink-0"></div>
        </div>
      )}
    </div>
  );
};

export default CommunityCard;
