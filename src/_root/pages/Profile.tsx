import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useGetUserInfo, useGetUserPosts } from '@/lib/react-query/queries';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';
import { useUserContext } from '@/context/AuthContext';

interface ProfileCardItemProps {
  name: string;
  cover: string;
  dp: string;
  creations: string;
  supporting: string;
  bio: string;
  isCurrentUser: boolean;
  userId: string;
}

const ProfileCardItem = ({
  name,
  cover,
  dp,
  creations,
  supporting,
  bio,
  isCurrentUser,
  userId,
}: ProfileCardItemProps) => {
  const [buttonText, setButtonText] = useState('Support');

  const handleButtonClick = () => {
    setButtonText((prev) => (prev === 'Support' ? 'Supporting' : 'Support'));
  };

  return (
    <div className="overflow-hidden">
      <div className="pb-4 pt-10 md:pt-0 shadow-lg">
        <img
          src={cover}
          className="lg:h-72 w-full h-52 object-cover rounded-t-xl"
          alt="Cover"
        />
        <div className="flex flex-col justify-start items-start pb-6 px-3 sm:px-6 lg:pl-14">
          <div className="lg:pl-2 w-full">
            <div className="flex justify-between gap-10 ">
              <img
                src={dp}
                className="h-24 w-24 lg:h-32 lg:w-32 rounded-full bottom-9 lg:bottom-11 relative"
                alt="Profile"
              />
              <div className="flex gap-6 lg:gap-20 pt-2 lg:pt-4">
                <div className="text-center">
                  <div className="small-medium lg:base-medium">{creations}</div>
                  <div className="small-regular lg:base-regular pt-1">
                    Creations
                  </div>
                </div>
                <div className="text-center">
                  <div className="small-medium lg:base-medium">
                    {supporting}
                  </div>
                  <div className="small-regular lg:base-regular pt-1">
                    Supporting
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xl font-bold lg:text-2xl">{name}</div>
            <p className="pt-3 max-w-xl text-pretty small-regular font-light">
              {bio}
            </p>
            <div className="flex gap-2 pt-6 justify-start items-center">
              <img
                src="/assets/icons/profession.svg"
                alt="profession"
                className="w-6 md:w-7"
              />
              <p className="text-sm lg:text-base font-light">Guitarist</p>
            </div>
            <div className="flex gap-2 pt-3 justify-start items-center">
              <img
                src="/assets/icons/hometown.svg"
                alt="hometown"
                className="w-6 md:w-7"
              />
              <p className="text-sm lg:text-base font-light">
                Dibrugarh, Assam 🇮🇳
              </p>
            </div>
            <div className="flex w-full justify-start gap-6 pt-9 lg:pt-12">
              {isCurrentUser ? (
                <Link to={`/edit-profile/${userId}`}>
                  <Button className="font-semibold shad-button_dark_4">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <Button
                  className={`font-semibold ${
                    buttonText === 'Support'
                      ? 'shad-button_primary'
                      : 'shad-button_dark_4'
                  }`}
                  onClick={handleButtonClick}
                >
                  {buttonText}
                </Button>
              )}
              <Link to="/portfolio">
                <Button className="font-semibold shad-button_dark_4">
                  Portfolio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfileFeed = ({ userId }: { userId: string }) => {
  const [activeTab, setActiveTab] = useState('creation');

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
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (!posts) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'creation') {
      return (
        <div>
          <div className="w-full max-w-5xl">
            {posts.pages.every((page) => page.documents.length === 0) ? (
              <div className="pt-6 items-start justify-start text-start">
                <p className="text-sm">"The best is yet to come..."</p>
              </div>
            ) : (
              posts.pages.map((page, pageIndex) =>
                page.documents.map((post) => (
                  <div
                    key={`${post.$id}-${pageIndex}`}
                    className="flex flex-col items-start pb-8"
                  >
                    <PostCard key={post.$id} post={post} />
                  </div>
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
    }
    return (
      <div className="pt-6">
        <p className="text-sm">"Coming soon..."</p>
      </div>
    );
  };

  return (
    <>
      <div className="flex-start lg:mt-8 lg:mb-10 whitespace-nowrap pl-1 sm:pl-3 lg:pl-14 lg:overflow-hidden">
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
      <div className="mx-3 mt-8 mb-20 pl-1 sm:pl-3 lg:pl-14">
        {renderContent()}
      </div>
    </>
  );
};

const Profile = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const { data: profileUser } = useGetUserInfo(id || '');

  const isCurrentUser = user?.id === id;

  const data = useMemo(
    () => ({
      name: profileUser?.name || 'Unknown User',
      cover: profileUser?.cover || '/assets/icons/cover-placeholder.png',
      dp: profileUser?.dp || '/assets/icons/profile-placeholder.svg',
      creations: '19',
      supporting: '65',
      bio: profileUser?.bio || '',
    }),
    [profileUser]
  );

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        <ProfileCardItem
          {...data}
          isCurrentUser={isCurrentUser}
          userId={id || ''}
        />
        <ProfileFeed userId={id || ''} />
      </div>
    </div>
  );
};

export default Profile;
