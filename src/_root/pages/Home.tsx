import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';
import { WelcomeDialog } from '@/components/shared/WelcomeDialog';
import { useUserContext } from '@/context/AuthContext';
import {
  useGetSavedCreations,
  useGetSupportingCreations,
} from '@/lib/tanstack-queries/postsQueries';
import { useUpdateWelcomeStatus } from '@/lib/tanstack-queries/usersQueries';
import COTMCarousel from '@/components/shared/COTMPostCard';
import {
  useGetAllDiscussions,
  useGetCommunities,
} from '@/lib/tanstack-queries/communityQueries';
import DiscussionCard from '@/components/shared/community/DiscussionCard';

const TABS = [
  { name: 'creation', label: 'Creations' },
  { name: 'discussion', label: 'Discussions' }, // Add new tab
  { name: 'saved', label: 'Saved' },
] as const;

type TabType = (typeof TABS)[number]['name'];

const Home = () => {
  const { user, setUser } = useUserContext();
  const [activeTab, setActiveTab] = useState<TabType>('creation');
  const [showWelcome, setShowWelcome] = useState(false);
  const updateWelcomeMutation = useUpdateWelcomeStatus();
  const [activeCommunity] = useState<string>('');

  const savedPostsRef = useRef<HTMLDivElement>(null);
  const followingPostsRef = useRef<HTMLDivElement>(null);
  const discussionsRef = useRef<HTMLDivElement>(null);

  // Query hooks
  const {
    data: savedPostsPages,
    fetchNextPage: fetchNextSavedPage,
    hasNextPage: hasNextSavedPage,
    isFetchingNextPage: isFetchingNextSavedPage,
    isLoading: isSavedLoading,
  } = useGetSavedCreations(user.id);

  const {
    data: followingPostsPages,
    fetchNextPage: fetchNextFollowingPage,
    hasNextPage: hasNextFollowingPage,
    isFetchingNextPage: isFetchingNextFollowingPage,
    isLoading: isFollowingLoading,
  } = useGetSupportingCreations(user.id);

  const {
    data: discussionsPages,
    fetchNextPage: fetchNextDiscussionsPage,
    hasNextPage: hasNextDiscussionsPage,
    isFetchingNextPage: isFetchingNextDiscussionsPage,
    isLoading: isDiscussionsLoading,
  } = useGetAllDiscussions();

  const { data: communitiesPages, isLoading: isCommunitiesLoading } =
    useGetCommunities();

  // Memoized posts
  const savedPosts = useMemo(
    () => savedPostsPages?.pages.flatMap((page) => page.documents) || [],
    [savedPostsPages]
  );

  const followingPosts = useMemo(
    () => followingPostsPages?.pages.flatMap((page) => page.documents) || [],
    [followingPostsPages]
  );

  const discussions = useMemo(
    () => discussionsPages?.pages.flatMap((page) => page.documents) || [],
    [discussionsPages]
  );

  const communities = useMemo(
    () => communitiesPages?.pages.flatMap((page) => page.documents) || [],
    [communitiesPages]
  );

  // Welcome dialog effect
  useEffect(() => {
    if (user && !user.hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [user]);

  // Intersection Observer effect
  useEffect(() => {
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const isIntersecting = entries[0].isIntersecting;
      if (!isIntersecting) return;

      if (
        activeTab === 'creation' &&
        hasNextFollowingPage &&
        !isFetchingNextFollowingPage
      ) {
        fetchNextFollowingPage();
      } else if (
        activeTab === 'discussion' &&
        hasNextDiscussionsPage &&
        !isFetchingNextDiscussionsPage
      ) {
        fetchNextDiscussionsPage();
      } else if (
        activeTab === 'saved' &&
        hasNextSavedPage &&
        !isFetchingNextSavedPage
      ) {
        fetchNextSavedPage();
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.1,
    });

    const currentRef =
      activeTab === 'creation'
        ? followingPostsRef.current
        : activeTab === 'discussion'
        ? discussionsRef.current
        : savedPostsRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => observer.disconnect();
  }, [
    activeTab,
    hasNextSavedPage,
    hasNextFollowingPage,
    hasNextDiscussionsPage,
    isFetchingNextSavedPage,
    isFetchingNextFollowingPage,
    isFetchingNextDiscussionsPage,
    fetchNextSavedPage,
    fetchNextFollowingPage,
    fetchNextDiscussionsPage,
  ]);

  const handleWelcomeChange = async (open: boolean) => {
    if (!open && user) {
      try {
        await updateWelcomeMutation.mutateAsync(user.id);
        setUser({ ...user, hasSeenWelcome: true });
      } catch (error) {
        console.error('Error updating welcome status:', error);
      }
    }
    setShowWelcome(open);
  };

  const renderExploreButton = () => (
    <Link to="/explore" className="pt-6 lg:pt-9">
      <Button className="shad-button_dark_4 px-8">Explore</Button>
    </Link>
  );

  const renderLoader = () => (
    <div className="p-10">
      <Loader />
    </div>
  );

  const renderEmptyState = (message: string) => (
    <div className="flex flex-col items-center justify-center gap-4 pt-16 pb-10">
      <p className="text-light-3 text-center">{message}</p>
      {renderExploreButton()}
    </div>
  );

  const renderPosts = (
    posts: Models.Document[],
    ref: React.RefObject<HTMLDivElement>,
    isFetching: boolean
  ) => (
    <ul className="flex flex-col flex-1 gap-9 w-full">
      {posts.map((post) => (
        <PostCard post={post} key={post.$id} />
      ))}
      <div ref={ref} className="h-10" />
      {isFetching && renderLoader()}
      {!isFetching && posts.length > 0 && !hasNextFollowingPage && (
        <div className="flex flex-col items-center justify-center gap-4 py-10">
          <p className="text-light-3">You've reached the end!</p>
          {renderExploreButton()}
        </div>
      )}
    </ul>
  );

  const renderCommunityCircles = () => (
    <div className="relative w-full">
      <div className="w-full overflow-x-scroll lg:custom-scrollbar">
        <div className="flex gap-3 py-2 px-4 min-w-max">
          {isCommunitiesLoading ? (
            <div className="flex items-center justify-center w-16">
              <Loader />
            </div>
          ) : (
            communities.map((community) => (
              <Link
                key={community.$id}
                to={`/circles/${community.$id}`}
                className="flex flex-col items-center justify-center min-w-[80px] gap-1 hover:opacity-75 transition-opacity"
              >
                <div
                  className={`
                  h-11 w-11 rounded-full 
                  flex items-center justify-center
                  bg-cover bg-center
                  transition-all duration-300
                  ${
                    activeCommunity === community.$id
                      ? 'ring-2 ring-primary-500'
                      : 'hover:ring-2 hover:ring-primary-500/50'
                  }
                `}
                  style={{
                    backgroundImage: `url(${
                      community.imageUrl ||
                      '/assets/icons/profile-placeholder.svg'
                    })`,
                  }}
                />
                <span className="text-light-3 subtle-medium truncate w-20 text-center pt-1.5 pb-3">
                  {community.name}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
      <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-dark-1 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-dark-1 to-transparent pointer-events-none" />
    </div>
  );

  const renderContent = () => {
    if (activeTab === 'creation') {
      if (isFollowingLoading) return renderLoader();
      if (!followingPosts?.length) {
        return renderEmptyState(
          'Support Creators to see their Creations in your feed!'
        );
      }
      return renderPosts(
        followingPosts,
        followingPostsRef,
        isFetchingNextFollowingPage
      );
    }

    if (activeTab === 'discussion') {
      if (isDiscussionsLoading) return renderLoader();
      if (!discussions?.length) {
        return renderEmptyState('No discussions yet!');
      }
      return (
        <div className="flex flex-col gap-9 w-full">
          {discussions.map((discussion) => (
            <DiscussionCard
              key={discussion.$id}
              discussion={{ ...discussion, type: 'Discussion' }}
            />
          ))}
          <div ref={discussionsRef} className="h-10" />
          {isFetchingNextDiscussionsPage && <Loader />}
        </div>
      );
    }

    if (activeTab === 'saved') {
      if (isSavedLoading) return renderLoader();
      if (!savedPosts?.length) {
        return <p className="text-light-4 pl-3.5">No saved posts yet</p>;
      }
      const validSavedPosts = savedPosts.filter(
        (post) =>
          post &&
          typeof post.$id === 'string' &&
          typeof post.$collectionId === 'string' &&
          typeof post.$createdAt === 'string' &&
          typeof post.$updatedAt === 'string'
      ) as Models.Document[];
      return renderPosts(
        validSavedPosts,
        savedPostsRef,
        isFetchingNextSavedPage
      );
    }
  };

  return (
    <div className="home-container">
      <div className="home-posts">
        <div className="flex flex-col gap-9 w-full">
          <div className="flex flex-col gap-4 mt-16 lg:mt-5">
            <div className="flex flex-col gap-4 mt-1">
              <COTMCarousel />

              {/* Winner info and countdown section */}
              {/* <div className="flex flex-col sm:flex-row lg:flex-col lg:gap-5 2xl:flex-row justify-between items-center text-center bg-dark-4 rounded-xl p-4 mt-2">
                <div className="flex flex-col sm:flex-row lg:flex-col text-center 2xl:flex-row items-center gap-1.5 mb-5 sm:mb-0">
                  <p className="text-light-2 base-medium">
                    The Most Voted Creation Wins!{' '}
                    <span className="text-xl">🏆</span>
                  </p>
                  <p className=" text-light-3 small-bold flex items-center gap-1">
                    "
                    <img
                      src="/assets/icons/liked.svg"
                      alt="likes"
                      className="w-6 h-6"
                    />
                    <span>= 1 Vote "</span>
                  </p>
                </div>

                <div className="flex gap-4">
                  {Object.entries(
                    useCountdown(new Date('2025-05-07T18:30:00Z'))
                  ).map(([unit, value]) => (
                    <div key={unit} className="flex flex-col items-center">
                      <span className="text-primary-500 h4-bold">
                        {value.toString().padStart(2, '0')}
                      </span>
                      <span className="text-light-3 tiny-medium">{unit}</span>
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
            <h3 className="text-light-1 h3-bold mb-3 pl-1 mt-9">Circles</h3>
            {renderCommunityCircles()}

            <div className="flex-start mt-6">
              {TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`py-2 px-3 font-semibold relative ${
                    activeTab === tab.name
                      ? 'underline text-primary-500 underline-offset-8'
                      : 'hover:text-primary-500'
                  }`}
                >
                  {tab.label}
                  {tab.name === 'discussion' && (
                    <span className="absolute top-1 -right-0 w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col flex-1 gap-9 w-full max-w-5xl pb-7">
            {renderContent()}
          </div>
        </div>
      </div>
      <WelcomeDialog open={showWelcome} onOpenChange={handleWelcomeChange} />
    </div>
  );
};

export default Home;
