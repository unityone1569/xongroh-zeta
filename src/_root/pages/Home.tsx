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
import {
  useUpdateWelcomeStatus,
  useGetTopCreators,
} from '@/lib/tanstack-queries/usersQueries';

const TABS = [
  { name: 'creation', label: 'Creations' },
  { name: 'saved', label: 'Saved' },
] as const;

type TabType = (typeof TABS)[number]['name'];

const Home = () => {
  const { user, setUser } = useUserContext();
  const [activeTab, setActiveTab] = useState<TabType>('creation');
  const [showWelcome, setShowWelcome] = useState(false);
  const updateWelcomeMutation = useUpdateWelcomeStatus();

  const savedPostsRef = useRef<HTMLDivElement>(null);
  const followingPostsRef = useRef<HTMLDivElement>(null);

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

  const { data: creators, isLoading: isCreatorsLoading } = useGetTopCreators();

  // Memoized posts
  const savedPosts = useMemo(
    () => savedPostsPages?.pages.flatMap((page) => page.documents) || [],
    [savedPostsPages]
  );

  const followingPosts = useMemo(
    () => followingPostsPages?.pages.flatMap((page) => page.documents) || [],
    [followingPostsPages]
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
        : savedPostsRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => observer.disconnect();
  }, [
    activeTab,
    hasNextSavedPage,
    hasNextFollowingPage,
    isFetchingNextSavedPage,
    isFetchingNextFollowingPage,
    fetchNextSavedPage,
    fetchNextFollowingPage,
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

  const renderTopCreators = () => (
    <div className="lg:hidden w-full overflow-hidden">
      <h3 className="text-light-1 h3-bold px-5 pb-6">Top Creators</h3>
      <div className="w-full overflow-hidden">
        <div className="flex gap-4 px-5">
          {/* Double the creator list for seamless scrolling */}
          <div className="flex gap-4 infinite-scroll">
            {[
              ...(creators?.documents || []),
              ...(creators?.documents || []),
            ].map((creator, index) => (
              <Link
                key={`${creator.$id}-${index}`}
                to={`/profile/${creator.$id}`}
                className="flex-shrink-0 w-[110px] bg-dark-3 rounded-xl p-4 border border-dark-4 hover:border-primary-500 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex flex-col items-center gap-3 relative z-10">
                  <div className="relative">
                    <img
                      src={
                        creator.dpUrl || '/assets/icons/profile-placeholder.svg'
                      }
                      alt="creator"
                      className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-dark-4 group-hover:ring-primary-500 transition-all duration-300"
                    />
                    {creator.verifiedUser && (
                      <div className="absolute -bottom-1 -right-1 bg-dark-3 rounded-full p-1 ring-2 ring-dark-4">
                        <img
                          src="/assets/icons/verified.svg"
                          alt="verified"
                          className="w-4 h-4"
                        />
                      </div>
                    )}
                  </div>

                  <div className="w-full text-center space-y-1">
                    <p className="subtle-medium text-light-1 line-clamp-1 group-hover:text-primary-500 transition-colors duration-300">
                      {creator.name.split(' ')[0]}
                    </p>
                    <p className="tiny-normal-mutate text-light-3 text-xs line-clamp-1">
                      {creator.profession || 'Creator'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
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
          <div className="flex flex-col gap-4 mt-16 lg:mt-0">
            {isCreatorsLoading ? (
              <div className="lg:hidden p-5">
                <Loader />
              </div>
            ) : (
              renderTopCreators()
            )}

            <Link
              to="/creations/67e3e111003cf0d33591"
              className="w-full my-5 block"
            >
              <img
                src="https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/67e7995a0009831f99db/view?project=66e2a98a00192795ca51"
                alt="Promotional Banner"
                className="w-full rounded-lg object-cover aspect-video hover:opacity-90 transition-opacity"
              />
              <div className="flex gap-3.5 sm:gap-6 mt-6 w-full justify-start">
                <Link to="/add-creation">
                  <Button className="shad-button_primary px-5">
                    Submit Creation
                  </Button>
                </Link>
                <Link to="/creations/67e3e111003cf0d33591">
                  <Button className="px-6 shad-button_dark_4">Know More</Button>
                </Link>
              </div>
            </Link>

            <div className="flex-start mt-5">
              {TABS.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`py-2 px-3 font-semibold ${
                    activeTab === tab.name
                      ? 'underline text-primary-500 underline-offset-8'
                      : 'hover:text-primary-500'
                  }`}
                >
                  {tab.label}
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
