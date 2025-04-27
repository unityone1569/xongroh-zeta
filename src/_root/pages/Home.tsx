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

  const renderWhatsAppGroup = () => (
    <div className="w-full bg-dark-4 rounded-xl p-6 border border-dark-4 relative">
      {/* New Badge */}
      <div className="absolute -top-2 -right-2 bg-primary-600 text-light-1 text-xs font-bold px-3.5 py-1 lg:py-1.5 rounded-full">
        New!
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-light-1 h4-bold lg:h3-bold">
          Join the Xongroh - Founding Creators Groups
        </h3>

        <p className="text-light-3 small-regular lg:base-regular text-pretty">
          Stay connected with us! Get instant updates, share your valuable
          feedback, and play a key role in shaping the future of our
          creator-focused platform.
        </p>
        <p className="text-primary-500 base-semibold">
          Limited Spots Available - Exclusive to Founding Creators Only!
        </p>

        <div className="flex flex-col sm:flex-row gap-5 sm:gap-3 mt-3">
          <a
            href="https://chat.whatsapp.com/BbkvBnvxf83Ht7u4tgai7H"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#25D366] text-light-1 text-sm sm:text-md font-semibold py-2.5 px-6 rounded-lg transition-all duration-300"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 448 512"
              className="w-5 h-5"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
            </svg>
            Join WhatsApp Fam
          </a>

          <a
            href="https://t.me/+dyY1LMM3NRUzOTg1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#0088cc] to-[#0055aa] hover:from-[#0055aa] hover:to-[#0088cc] text-dark-1 text-sm sm:text-md font-semibold py-2.5 px-6 rounded-lg transition-all duration-300"
          >
            <svg
              stroke="currentColor"
              fill="currentColor"
              strokeWidth="0"
              viewBox="0 0 496 512"
              className="w-5 h-5"
              height="1em"
              width="1em"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm121.8 169.9l-40.7 191.8c-3 13.6-11.1 16.9-22.4 10.5l-62-45.7-29.9 28.8c-3.3 3.3-6.1 6.1-12.5 6.1l4.4-63.1 114.9-103.8c5-4.4-1.1-6.9-7.7-2.5l-142 89.4-61.2-19.1c-13.3-4.2-13.6-13.3 2.8-19.7l239.1-92.2c11.1-4 20.8 2.7 17.2 19.5z"/>
            </svg>
            Join Telegram Gang
          </a>
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
            {renderWhatsAppGroup()}

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
                <Link to="/add-creation" className="w-1/2">
                  <Button className="shad-button_primary px-5 w-full">
                    Submit Creation
                  </Button>
                </Link>
                <Link to="/creations/67e3e111003cf0d33591" className="w-1/2">
                  <Button className="px-6 shad-button_dark_4 w-full ">
                    Know More
                  </Button>
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
