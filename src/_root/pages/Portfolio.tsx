import { Button } from '@/components/ui/button';
import { useUserContext } from '@/context/AuthContext';
import { useGetUserInfo } from '@/lib/react-query/queries';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';

interface PortfolioCardItemProps {
  name: string;
  dp: string;
  about: string;
  userId: string;
  isCurrentUser: boolean;
}

const PortfolioCardItem = ({
  name,
  dp,
  about,
  userId,
  isCurrentUser,
}: PortfolioCardItemProps) => {
  return (
    <div className="overflow-hidden">
      <div className="pb-4  ">
        <div>
          <Link
            to={`/profile/${userId}`}
            className="lg:flex gap-6 lg:gap-9 items-center"
          >
            <div className="flex-none">
              <img
                src={dp}
                className="h-20 w-20 lg:h-32 lg:w-32 rounded-full relative"
                alt="Profile"
              />
            </div>
            <div>
              <p className="text-xl pt-6 lg:pt-0 body-bold lg:h3-bold">
                {name}
              </p>
              <p className="pt-3 max-w-xl text-pretty small-regular">{about}</p>
            </div>
          </Link>
        </div>

        {isCurrentUser && (
          <div className="pt-9">
            <Link to={`/add-project/`}>
              <Button className="font-semibold shad-button_dark_4">
                Add Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const Portfolio = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { data: profileUser } = useGetUserInfo(id || '');

  const isCurrentUser = user?.id === id;

  const data = useMemo(
    () => ({
      name: profileUser?.name || 'Unknown User',
      dp: profileUser?.dp || '/assets/icons/profile-placeholder.svg',
      about: profileUser?.about || '',
    }),
    [profileUser]
  );

  return (
    <div className="portfolio-container">
      <div className="portfolio-inner_container">
        <h2 className="h3-bold md:h2-bold text-left w-full pt-16 md:pt-0 pb-9 md:pb-16">
          Portfolio
        </h2>
        <PortfolioCardItem
          {...data}
          userId={id || ''}
          isCurrentUser={isCurrentUser}
        />
      </div>
    </div>
  );
};

export default Portfolio;
