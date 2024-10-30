import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useGetUserInfo, useGetUserPosts } from '@/lib/react-query/queries';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';

interface ProfileCardItemProps {
  name: string;
  cover: string;
  dp: string;
  creations: string;
  supporting: string;
  bio: string;
}

const ProfileCardItem = ({
  name,
  cover,
  dp,
  creations,
  supporting,
  bio,
}: ProfileCardItemProps) => {
  const [buttonText, setButtonText] = useState('Support');

  const handleButtonClick = () => {
    setButtonText((prev) => (prev === 'Support' ? 'Supporting' : 'Support'));
  };

  return (
    <div className="overflow-hidden">
      <div className="mb-6 pb-4 shadow-lg">
        <img
          src={cover}
          className="lg:h-72 w-full h-52 object-cover"
          alt="Cover"
        />
        <div className="flex flex-col items-center pb-6 pt-5">
          <div className="flex justify-around w-full -mb-10">
            <div className="text-center">
              <div className="font-bold">{creations}</div>
              <div className="text-muted-foreground text-sm lg:text-base">
                Creations
              </div>
            </div>
            <img
              src={dp}
              className="h-24 w-24 lg:h-28 lg:w-28 rounded-full bottom-16 relative"
              alt="Profile"
            />
            <div className="text-center">
              <div className="font-bold">{supporting}</div>
              <div className="text-muted-foreground text-sm lg:text-base">
                Supporting
              </div>
            </div>
          </div>
          <div className="pt-6 text-xl font-bold lg:text-2xl">{name}</div>
          <p className="px-5 pt-3 max-w-xl text-center text-sm lg:text-base font-light">
            {bio}
          </p>
          <div className="flex w-full justify-center gap-9 sm:space-x-16 pt-10 lg:pt-12">
            <Button
              className={`font-semibold ${
                buttonText === 'Support'
                  ? 'shad-button_primary'
                  : 'shad-button_dark_4 text-secondary-foreground'
              }`}
              onClick={handleButtonClick}
            >
              {buttonText}
            </Button>
            <Link to="/portfolio">
              <Button className="font-semibold shad-button_dark_4 text-secondary-foreground">
                Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileFeed = ({ userId }: { userId: string }) => {
  const [activeTab, setActiveTab] = useState<string>('creation');

  const tabs = useMemo(
    () => [
      { name: 'creation', label: 'Creations' },
      { name: 'tribe', label: 'Tribe' },
      { name: 'store', label: 'Store' },
      { name: 'event', label: 'Events' },
    ],
    []
  );

  const { ref, inView } = useInView();
  const { data: posts, fetchNextPage, hasNextPage } = useGetUserPosts(userId);

  useEffect(() => {
    if (inView) fetchNextPage();
  }, [inView]);

  if (!posts) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  const shouldShowPosts = posts.pages.every(
    (page) => page.documents.length === 0
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'creation':
        return (
          <div>
            <div className="flex flex-col items-center gap-9 w-full max-w-5xl">
              {shouldShowPosts ? (
                <div className="flex-center pt-6">
                <p className="text-sm">"The best is yet to come..."</p>
              </div>
              ) : (
                posts.pages.map((page) =>
                  page.documents.map((post) => (
                    <PostCard key={post.$id} post={post} />
                  ))
                )
              )}
            </div>

            {hasNextPage && (
              <div ref={ref} className="mt-10">
                <Loader />
              </div>
            )}
          </div>
        );
      case 'tribe':
        return (
          <div className="flex-center pt-6">
            <p className="text-sm">coming soon...</p>
          </div>
        );
      case 'store':
        return (
          <div className="flex-center pt-6">
            <p className="text-sm">coming soon...</p>
          </div>
        );
      case 'event':
        return (
          <div className="flex-center pt-6">
            <p className="text-sm">coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="flex-center pt-6">
            <p>Content not available</p>
          </div>
        );
    }
  };

  return (
    <>
      <div className="flex-center lg:mt-8 lg:mb-10 whitespace-nowrap lg:overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`p-2 px-3 font-semibold ${
              activeTab === tab.name
                ? 'underline text-primary-500 underline-offset-8'
                : ''
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mx-3 mt-8 mb-20 lg:mb-12 text-lg font-normal ">
        {renderContent()}
      </div>
    </>
  );
};

const Profile = () => {
  const { id } = useParams();

  const { data: profileUser } = useGetUserInfo(id || '');

  const data = useMemo(
    () => ({
      name: profileUser?.name || 'Unknown User',
      cover: profileUser?.cover || '/assets/icons/cover-placeholder.png',
      dp: profileUser?.dp || '/assets/icons/profile-placeholder.svg',
      creations: '9',
      supporting: '6',
      bio: profileUser?.bio || '',
    }),
    [profileUser]
  );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <ProfileCardItem {...data} />
        <div>
          <ProfileFeed userId={id || ''} />
        </div>
      </div>
    </div>
  );
};

export default Profile;
