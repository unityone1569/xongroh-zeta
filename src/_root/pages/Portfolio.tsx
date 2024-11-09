import { Button } from '@/components/ui/button';
import { useUserContext } from '@/context/AuthContext';
import { useGetUserInfo, useGetUserProjects } from '@/lib/react-query/queries';
import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import Loader from '@/components/shared/Loader';
import ProjectCard from '@/components/shared/ProjectCard';

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
}: PortfolioCardItemProps) => (
  <div className="overflow-hidden max-w-2xl">
    <Link
      to={`/profile/${userId}`}
      className="flex gap-6 lg:gap-9 items-center pb-4"
    >
      <img
        src={dp}
        className="h-20 w-20 lg:h-32 lg:w-32 rounded-full"
        alt="Profile"
      />
      <div>
        <p className="text-xl body-bold lg:h3-bold">{name}</p>
        <p className="small-regular lg:base-regular pt-1">
          Projects: <span className="small-medium lg:base-medium">19</span>
        </p>
      </div>
    </Link>
    <p className="pt-5 pl-1 text-pretty md:text-balance small-regular">
      {about}
    </p>
    <hr className="h-px mx-2 md:hidden mt-6 bg-light-4 border-0 "></hr>
    {isCurrentUser && (
      <div className="pt-6">
        <Link to={`/add-project/`}>
          <Button className="font-semibold shad-button_dark_4">
            Add Project
          </Button>
        </Link>
      </div>
    )}
  </div>
);

const ProjectFeed = ({ userId }: { userId: string }) => {
  const { ref, inView } = useInView();
  const {
    data: projects,
    fetchNextPage,
    hasNextPage,
  } = useGetUserProjects(userId);

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  if (!projects) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl py-9 md:pt-16">
      {projects.pages.some((page) => page.documents.length > 0) ? (
        projects.pages.map((page, pageIndex) =>
          page.documents.map((project) => (
            <div
              key={`${project.$id}-${pageIndex}`}
              className="flex flex-col items-start pb-8"
            >
              <ProjectCard project={project} />
            </div>
          ))
        )
      ) : (
        <p className="text-sm text-center pt-6">No projects available...</p>
      )}
      {hasNextPage && (
        <div ref={ref} className="mt-10">
          <Loader />
        </div>
      )}
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
        <ProjectFeed userId={id || ''} />
      </div>
    </div>
  );
};

export default Portfolio;
