import { useState, useMemo, useRef, useEffect } from 'react';
import Loader from '@/components/shared/Loader';
import { Models } from 'appwrite';
import { useUserContext } from '@/context/AuthContext';
import CommunityCard from '@/components/shared/community/CommunityCard';
import DiscussionCard from '@/components/shared/community/DiscussionCard';
import {
  useGetUserCommunities,
  useGetUserDiscussions,
  useGetUserSavedDiscussions,
} from '@/lib/tanstack-queries/communityQueries';

const tabs = [
  { name: 'circles', label: 'Circles' },
  { name: 'discussions', label: 'Discussions' },
  { name: 'saved', label: 'Saved' },
];

const Community = () => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState('circles');

  // Query hooks
  const {
    data: communitiesPages,
    fetchNextPage: fetchNextCommunitiesPage,
    hasNextPage: hasNextCommunitiesPage,
    isFetchingNextPage: isFetchingNextCommunitiesPage,
    isLoading: isCommunitiesLoading,
  } = useGetUserCommunities(user.id);

  const {
    data: discussionsPages,
    fetchNextPage: fetchNextDiscussionsPage,
    hasNextPage: hasNextDiscussionsPage,
    isFetchingNextPage: isFetchingNextDiscussionsPage,
    isLoading: isDiscussionsLoading,
  } = useGetUserDiscussions(user.id);

  const {
    data: savedDiscussionsPages,
    fetchNextPage: fetchNextSavedPage,
    hasNextPage: hasNextSavedPage,
    isFetchingNextPage: isFetchingNextSavedPage,
    isLoading: isSavedLoading,
  } = useGetUserSavedDiscussions(user.id);

  // Refs for infinite scroll
  const communitiesRef = useRef<HTMLDivElement>(null);
  const discussionsRef = useRef<HTMLDivElement>(null);
  const savedDiscussionsRef = useRef<HTMLDivElement>(null);

  // Flatten data from all pages
  const communities = useMemo(() => {
    return communitiesPages?.pages.flatMap((page) => page.documents) || [];
  }, [communitiesPages]);

  const discussions = useMemo(() => {
    return discussionsPages?.pages.flatMap((page) => page.documents) || [];
  }, [discussionsPages]);

  const savedDiscussions = useMemo(() => {
    return savedDiscussionsPages?.pages.flatMap((page) => page.documents) || [];
  }, [savedDiscussionsPages]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef =
      activeTab === 'circles'
        ? communitiesRef
        : activeTab === 'discussions'
        ? discussionsRef
        : savedDiscussionsRef;

    const hasNext =
      activeTab === 'circles'
        ? hasNextCommunitiesPage
        : activeTab === 'discussions'
        ? hasNextDiscussionsPage
        : hasNextSavedPage;

    const isFetching =
      activeTab === 'circles'
        ? isFetchingNextCommunitiesPage
        : activeTab === 'discussions'
        ? isFetchingNextDiscussionsPage
        : isFetchingNextSavedPage;

    const fetchNext =
      activeTab === 'circles'
        ? fetchNextCommunitiesPage
        : activeTab === 'discussions'
        ? fetchNextDiscussionsPage
        : fetchNextSavedPage;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNext && !isFetching) {
          fetchNext();
        }
      },
      { threshold: 0.1 }
    );

    if (currentRef.current) {
      observer.observe(currentRef.current);
    }

    return () => observer.disconnect();
  }, [
    activeTab,
    hasNextCommunitiesPage,
    hasNextDiscussionsPage,
    hasNextSavedPage,
    isFetchingNextCommunitiesPage,
    isFetchingNextDiscussionsPage,
    isFetchingNextSavedPage,
    fetchNextCommunitiesPage,
    fetchNextDiscussionsPage,
    fetchNextSavedPage,
  ]);

  const renderContent = () => {
    switch (activeTab) {
      case 'circles':
        if (isCommunitiesLoading) {
          return <Loader />;
        }
        return (
          <div className="w-full">
            {!communities || communities.length === 0 ? (
              <p className="text-light-4 text-center md:text-start md:pl-5">
                No circles joined yet
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-9 mb-16">
                  {communities
                    .filter(
                      (
                        community
                      ): community is Models.Document & {
                        membersCount: number;
                      } => community !== null && 'membersCount' in community
                    )
                    .map((community) => (
                      <CommunityCard
                        key={community.$id}
                        community={community}
                      />
                    ))}
                </div>
                <div ref={communitiesRef} className="h-10" />
                {isFetchingNextCommunitiesPage && <Loader />}
              </>
            )}
          </div>
        );

      case 'discussions':
        if (isDiscussionsLoading) {
          return <Loader />;
        }
        return (
          <div className="flex flex-col gap-9 w-full">
            {!discussions || discussions.length === 0 ? (
              <p className="text-light-4 text-center md:text-start md:pl-5">
                No discussions created yet
              </p>
            ) : (
              <>
                {discussions.map((discussion: Models.Document) => (
                  <DiscussionCard
                    key={discussion.$id}
                    discussion={
                      discussion as Models.Document & {
                        type: 'Discussion' | 'Help' | 'Poll';
                      }
                    }
                  />
                ))}
                <div ref={discussionsRef} className="h-10" />
                {isFetchingNextDiscussionsPage && <Loader />}
              </>
            )}
          </div>
        );

      case 'saved':
        if (isSavedLoading) {
          return <Loader />;
        }
        return (
          <div className="flex flex-col gap-9 w-full">
            {!savedDiscussions || savedDiscussions.length === 0 ? (
              <p className="text-light-4 text-center md:text-start md:pl-5">
                No saved discussions yet
              </p>
            ) : (
              <>
                {savedDiscussions.map((discussion) => (
                  <DiscussionCard
                    key={discussion.$id}
                    discussion={
                      {
                        ...discussion,
                        type: 'Discussion',
                      } as Models.Document & {
                        type: 'Discussion' | 'Help' | 'Poll';
                      }
                    }
                  />
                ))}
                <div ref={savedDiscussionsRef} className="h-10" />
                {isFetchingNextSavedPage && <Loader />}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-col flex-1 flex-center overflow-scroll py-10 px-6 md:p-14 custom-scrollbar">
      <div className="max-w-3xl flex flex-col w-full h-full gap-6 md:gap-9">
        <h2 className="h3-bold md:h2-bold w-full mt-16 lg:mt-0">
          My Circle
        </h2>

        {/* Tabs */}
        <div className="flex-start w-full">
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

        {/* Content */}
        <div className="flex flex-col flex-1 gap-9 w-full pb-7">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Community;
