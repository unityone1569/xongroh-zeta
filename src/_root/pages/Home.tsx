import { useState, useMemo, useRef, useEffect } from 'react';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';

import { Models } from 'appwrite';
import { useUserContext } from '@/context/AuthContext';
import {
  useGetRecentCreations,
  useGetSavedCreations,
} from '@/lib/tanstack-queries/postsQueries';
import { WelcomeDialog } from "@/components/shared/WelcomeDialog";
import { useUpdateWelcomeStatus } from "@/lib/tanstack-queries/usersQueries";

const tabs = [
  { name: 'creation', label: 'Creations' },
  { name: 'saved', label: 'Saved' },
];

const Home = () => {
  const { user, setUser } = useUserContext();
  const [activeTab, setActiveTab] = useState('creation');
  const containerRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const updateWelcomeMutation = useUpdateWelcomeStatus();

  const {
    data: postsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isPostLoading,
  } = useGetRecentCreations();

  const {
    data: savedPostsPages,
    fetchNextPage: fetchNextSavedPage,
    hasNextPage: hasNextSavedPage,
    isFetchingNextPage: isFetchingNextSavedPage,
    isLoading: isSavedLoading,
  } = useGetSavedCreations(user.id);

  // Flatten posts from all pages
  const posts = useMemo(() => {
    return postsPages?.pages.flatMap((page) => page.documents) || [];
  }, [postsPages]);

  // Flatten saved posts from all pages
  const savedPosts = useMemo(() => {
    return savedPostsPages?.pages.flatMap((page) => page.documents) || [];
  }, [savedPostsPages]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    if (activeTab === 'creation') {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );

      const currentContainer = containerRef.current;
      if (currentContainer) {
        observer.observe(currentContainer);
      }
    } else if (activeTab === 'saved') {
      observer = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            hasNextSavedPage &&
            !isFetchingNextSavedPage
          ) {
            fetchNextSavedPage();
          }
        },
        { threshold: 0.1 }
      );

      const currentContainer = savedPostsRef.current;
      if (currentContainer) {
        observer.observe(currentContainer);
      }
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [
    activeTab,
    hasNextPage,
    hasNextSavedPage,
    isFetchingNextPage,
    isFetchingNextSavedPage,
    fetchNextPage,
    fetchNextSavedPage,
  ]);

  // Add ref for saved posts infinite scroll
  const savedPostsRef = useRef(null);

  useEffect(() => {
    if (user && !user.hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, [user]);

  const handleWelcomeChange = async (open: boolean) => {
    if (!open && user) {
      try {
        // Update database
        await updateWelcomeMutation.mutateAsync(user.id);
        
        // Update auth context
        setUser({
          ...user,
          hasSeenWelcome: true
        });
      } catch (error) {
        console.error('Error updating welcome status:', error);
      }
    }
    setShowWelcome(open);
  };

  const renderContent = () => {
    if (activeTab === 'creation') {
      if (isPostLoading) {
        return (
          <div className="p-10">
            <Loader />
          </div>
        );
      }

      return (
        <ul className="flex flex-col flex-1 gap-9 w-full">
          {!posts || posts.length === 0 ? (
            <p className="text-light-4 pl-3.5">No creations available yet</p>
          ) : (
            <>
              {posts.map((post: Models.Document) => (
                <PostCard post={post} key={post.$id} />
              ))}
              <div ref={containerRef} className="h-10" />
              {isFetchingNextPage && (
                <div className="p-10">
                  <Loader />
                </div>
              )}
            </>
          )}
        </ul>
      );
    }

    if (activeTab === 'saved') {
      if (isSavedLoading) {
        return (
          <div className="p-10">
            <Loader />
          </div>
        );
      }

      return (
        <ul className="flex flex-col flex-1 gap-9 w-full">
          {!savedPosts || savedPosts.length === 0 ? (
            <p className="text-light-4 pl-3.5">No saved posts yet</p>
          ) : (
            <>
              {savedPosts.map((post) => (
                <PostCard post={post as Models.Document} key={post.$id} />
              ))}
              <div ref={savedPostsRef} className="h-10" />
              {isFetchingNextSavedPage && (
                <div className="p-10">
                  <Loader />
                </div>
              )}
            </>
          )}
        </ul>
      );
    }
  };

  return (
    <div className="home-container">
      <div className="home-posts">
        <div className="flex flex-col gap-9 w-full">
          <h2 className="h3-bold mt-16 lg:mt-0 md:h2-bold text-left w-full">
            Creation Feed
          </h2>

          {/* Tabs */}
          <div className="flex-start gap-3 w-full max-w-5xl">
            {tabs.map((tab) => (
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

        {/* Content */}
        <div className="flex flex-col flex-1 gap-9 w-full max-w-5xl pb-7">
          {renderContent()}
        </div>
      </div>
      <WelcomeDialog 
        open={showWelcome} 
        onOpenChange={handleWelcomeChange}
      />
    </div>
  );
};

export default Home;
