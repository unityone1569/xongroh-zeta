import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';
import { useUserContext } from '@/context/AuthContext';
import UserSupport from '@/components/shared/UserSupport';
import LazyImage from '@/components/shared/LazyImage';
import { useCreateConversation } from '@/lib/tanstack-queries/conversationsQueries';
import { useGetUserCreations } from '@/lib/tanstack-queries/postsQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';

interface ProfileCardItemProps {
  creatorId: string;
  name: string;
  cover: string;
  dp: string;
  supportingCount: number;
  bio: string;
  hometown: string;
  profession: string;
  creationsCount: string;
  isVerified: boolean;
  badges: string[];
  isCurrentUser: boolean;
  userId: string;
}

const ProfileCardItem = ({
  creatorId,
  name,
  cover,
  dp,
  supportingCount,
  bio,
  hometown,
  profession,
  isVerified,
  badges,
  creationsCount,
  isCurrentUser,
  userId,
}: ProfileCardItemProps) => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const {
    mutateAsync: createConversation,
    isPending: createConversationPending,
  } = useCreateConversation();

  const { id } = useParams();
  const profileId: string = id || '';
  const handleMessageClick = async () => {
    const participants = [user.id, profileId];

    try {
      const conversation = await createConversation(participants);

      // Navigate to the chat page with the conversation ID
      navigate(`/chat/${conversation.$id}`);
    } catch (error) {
      console.error('Error initiating conversation:', error);
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="pb-4 pt-10 md:pt-0 shadow-lg">
        <LazyImage
          src={cover || '/assets/icons/cover-placeholder.png'}
          className="lg:h-72 w-full h-52 object-cover rounded-t-xl"
          alt="Cover"
        />
        <div className="flex flex-col justify-start items-start pb-6 px-3 sm:px-6 lg:pl-9">
          <div className="w-full">
            <div className="flex justify-between gap-10 ">
              <div className="flex-shrink-0">
                <LazyImage
                  src={dp}
                  className="h-24 w-24  lg:h-32 lg:w-32 object-cover rounded-full bottom-9 lg:bottom-11 relative"
                  alt="Profile"
                />
              </div>

              <div className="flex gap-6 lg:gap-20 pt-2 lg:pt-4">
                <div className="text-center">
                  <div className="small-medium lg:base-medium">
                    {creationsCount}
                  </div>
                  <div className="small-regular lg:base-regular pt-1">
                    Creations
                  </div>
                </div>
                <div className="text-center">
                  <div className="small-medium lg:base-medium">
                    {supportingCount}
                  </div>
                  <div className="small-regular lg:base-regular pt-1">
                    Supporting
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xl font-bold lg:text-2xl flex items-center gap-1.5">
              {name}
              {isVerified && (
                <img
                  src="/assets/icons/verified.svg"
                  alt="verified"
                  className="w-4 h-4"
                />
              )}
            </div>
            <p className="pt-3 max-w-xl text-pretty small-regular font-light">
              {bio}
            </p>

            <div className="pt-3">
              {profession && (
                <div className="flex gap-2 pt-3 justify-start items-center">
                  <img
                    src="/assets/icons/profession.svg"
                    alt="profession"
                    className="w-5 h-5 md:w-6 md:h-6 opacity-65"
                  />
                  <p className="text-sm lg:text-base font-light">
                    {profession}
                  </p>
                </div>
              )}
              {hometown && (
                <div className="flex gap-2 pt-3 justify-start items-center">
                  <img
                    src="/assets/icons/hometown.svg"
                    alt="hometown"
                    className="w-5 h-5 md:w-6 md:h-6 opacity-65"
                  />
                  <p className="text-sm lg:text-base font-light">{hometown}</p>
                </div>
              )}
              {badges && badges.length > 0 && (
                <div className="flex flex-col gap-3.5 pt-9 pl-0.5">
                  <div className="flex gap-2 justify-start items-center">
                    <h2 className="base-bold lg:body-bold text-light-3">
                      BADGES
                    </h2>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-3 min-w-max">
                      {badges.map((badgeCode, index) => (
                        <Link key={index} to={`/badges/${badgeCode}`}>
                          <img
                            src={`/assets/icons/${badgeCode}.svg`}
                            alt={`Badge ${index + 1}`}
                            className="w-11 h-11 md:w-14 md:h-14 object-contain"
                            loading="lazy"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex w-full justify-start gap-3.5 lg:gap-6 pt-9 lg:pt-12">
              {isCurrentUser ? (
                <Link to={`/update-profile/${userId}`}>
                  <Button className="font-semibold shad-button_dark_4">
                    Edit Profile
                  </Button>
                </Link>
              ) : (
                <>
                  <UserSupport creatorId={creatorId} supportingId={userId} />
                </>
              )}
              <Link to={`/portfolio/${userId}`}>
                <Button className="font-semibold shad-button_dark_4">
                  Portfolio
                </Button>
              </Link>

              {isCurrentUser ? null : (
                <Button
                  className="font-semibold shad-button_dark_4"
                  onClick={handleMessageClick}
                >
                  {createConversationPending ? (
                    <>
                      <Loader />
                    </>
                  ) : (
                    'Chat'
                  )}
                </Button>
              )}
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
  const {
    data: posts,
    fetchNextPage,
    hasNextPage,
  } = useGetUserCreations(userId);

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
      <div className="flex-start lg:mt-8 lg:mb-10 whitespace-nowrap pl-1 sm:pl-3 lg:pl-9 lg:overflow-hidden">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`p-2 px-3 font-semibold ${
              activeTab === tab.name
                ? 'underline text-primary-500 underline-offset-8'
                : 'hover:text-primary-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mx-3 mt-8 mb-20 pl-1 sm:pl-3 lg:pl-9">
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
      creationsCount: profileUser?.creationsCount || '0',
      bio: profileUser?.bio,
      hometown: profileUser?.hometown,
      profession: profileUser?.profession,
      supportingCount: profileUser?.supportingCount || '0',
      isVerified: profileUser?.verifiedUser || false,
      badges: profileUser?.badges || [],
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
          creatorId={user?.id}
        />
        <ProfileFeed userId={id || ''} />
      </div>
    </div>
  );
};

export default Profile;
