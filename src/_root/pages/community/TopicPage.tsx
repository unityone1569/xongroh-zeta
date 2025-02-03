import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader';
import DiscussionCard from '@/components/shared/community/DiscussionCard';
import {
  useGetDiscussions,
  useGetTopicsById,
  useMarkPingAsRead,
  useGetTopicPings,
} from '@/lib/tanstack-queries/communityQueries';
import { useUserContext } from '@/context/AuthContext';
import { getCommunityIdFromTopicId } from '@/lib/appwrite-apis/community';

// Move constants outside component to prevent recreation
const FILTER_TABS = [
  { name: 'new', label: 'New' },
  { name: 'popular', label: 'Popular' },
  { name: 'discussion', label: 'Discussion' },
  { name: 'help', label: 'Help' },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]['name'];

// Update type for discussion document
type DiscussionDocument = Models.Document & {
  type: 'Discussion' | 'Help' | 'Poll';
  likesCount: number;
  author: {
    name: string;
    dpUrl: any;
    verifiedUser: string;
  };
};

// Separate filter logic for better maintainability
const filterDiscussions = (
  discussions: DiscussionDocument[],
  filter: FilterTab
) => {
  switch (filter) {
    case 'new':
      return [...discussions].sort(
        (a, b) =>
          new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
      );
    case 'popular':
      return [...discussions].sort((a, b) => b.likesCount - a.likesCount);
    case 'discussion':
      return discussions.filter((disc) => disc.type === 'Discussion');
    case 'help':
      return discussions.filter((disc) => disc.type === 'Help');
    default:
      return discussions;
  }
};

// Update FilterTabButton component
const FilterTabButton = ({
  label,
  isActive,
  onClick,
  notificationCount,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  notificationCount?: number;
}) => (
  <button
    onClick={onClick}
    className={`py-2 px-3 font-semibold relative ${
      isActive
        ? 'underline text-primary-500 underline-offset-8'
        : 'hover:text-primary-500'
    }`}
  >
    {label}
    {(notificationCount ?? 0) > 0 && (
      <span className="absolute right-0.5 bg-gradient-to-r from-purple-500 to-purple-400 w-2 h-2 rounded-full" />
    )}
  </button>
);

const TopicPage = () => {
  const { id } = useParams();
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState<FilterTab>('popular');
  const [communityId, setCommunityId] = useState<string>('');
  const { ref, inView } = useInView();
  const { data: topic, isLoading: isTopicLoading } = useGetTopicsById(id || '');

  const {
    data: discussionsPages,
    hasNextPage,
    fetchNextPage,
    isLoading: isDiscussionsLoading,
  } = useGetDiscussions(id || '');

  // Get topic pings count
  const { data: pingCount = 0 } = useGetTopicPings(id || '', user.id);
  const { mutate: markPingAsRead } = useMarkPingAsRead();

  // Get communityId for the topic
  useEffect(() => {
    const fetchCommunityId = async () => {
      if (id) {
        const cid = await getCommunityIdFromTopicId(id);
        setCommunityId(cid || '');
      }
    };
    fetchCommunityId();
  }, [id]);

  // Handle infinite scroll
  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  // Memoize flattened discussions
  const discussions = useMemo(
    () =>
      (discussionsPages?.pages.flatMap((page) => page.documents) ||
        []) as DiscussionDocument[],
    [discussionsPages]
  );

  // Memoize filtered discussions with ping count limit for 'new' tab
  const filteredDiscussions = useMemo(() => {
    if (!discussions.length) return [];

    let filtered = filterDiscussions(discussions, activeTab);

    // Return empty array if pingCount is 0 and activeTab is 'new'
    if (activeTab === 'new' && pingCount === 0) {
      return [];
    }

    // Show only pingCount number of latest discussions for 'new' tab
    if (activeTab === 'new') {
      filtered = filtered.slice(0, pingCount);
    }

    return filtered;
  }, [activeTab, discussions, pingCount]);

  // Handle discussion click
  const handleDiscussionClick = useCallback(
    (_discussion: DiscussionDocument) => {
      if (activeTab === 'new' && communityId) {
        markPingAsRead({
          userId: user.id,
          communityId: communityId,
          topicId: id || '',
        });
      }
    },
    [activeTab, communityId, id, user.id, markPingAsRead]
  );

  if (isTopicLoading || isDiscussionsLoading) {
    return (
      <div className="flex-center w-full h-full">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex-col flex-1 flex-center overflow-scroll py-10 px-6 md:p-14 custom-scrollbar relative">
      <div className="max-w-3xl flex flex-col w-full h-full gap-6 md:gap-9">
        {/* Header - remove Add button */}
        <div className="w-full mt-16 lg:mt-0">
          <div className="flex flex-col gap-4">
            <Link
              to={`/communities/${communityId}`}
              className="flex items-center gap-1 p-1 mb-5 text-light-3 subtle-semibold hover:text-primary-500"
            >
              <img
                src="/assets/icons/back.svg"
                alt="back"
                className="w-5 h-5 lg:w-6 lg:h-6"
              />
              <p className="pt-1 lg:small-medium">Back</p>
            </Link>
            <h2 className="h3-bold md:h2-bold">
              {topic?.topicName || 'Topic'}
            </h2>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex-start w-full">
          {FILTER_TABS.map((tab) => (
            <FilterTabButton
              key={tab.name}
              label={tab.label}
              isActive={activeTab === tab.name}
              onClick={() => setActiveTab(tab.name)}
              notificationCount={tab.name === 'new' ? pingCount : undefined}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 gap-9 w-full pb-7">
          {filteredDiscussions.length === 0 ? (
            <p className="text-light-4 text-center md:text-start md:pl-5">
              No discussions yet
            </p>
          ) : (
            <>
              {filteredDiscussions.map((discussion: DiscussionDocument) => (
                <div
                  key={discussion.$id}
                  onClick={() => handleDiscussionClick(discussion)}
                >
                  <DiscussionCard discussion={discussion} />
                </div>
              ))}
              {hasNextPage && activeTab !== 'new' && (
                <div ref={ref} className="h-10">
                  <Loader />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link to={`/topics/${id}/add-discussion`}>
        <Button
          className="fixed bottom-6 right-6 lg:right-[calc(1.5rem+220px)] xl:right-[calc(1.5rem+390px)] w-14 h-14 rounded-full bg-gradient-to-r from-light-4 to-dark-4 hover:from-dark-4 hover:to-light-4 transition-all shadow-lg flex items-center justify-center p-0 z-50"
          size="icon"
        >
          <img className="w-6 h-6 invert-white" src="/assets/icons/add-2.svg" />
        </Button>
      </Link>
    </div>
  );
};

export default TopicPage;
