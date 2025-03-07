import GridSearchList from '@/components/shared/GridSearchList';
import Loader from '@/components/shared/Loader';
import SearchResult from '@/components/shared/SearchResult';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import {
  useGetInfiniteCreations,
  useGetSearchCreations,
} from '@/lib/tanstack-queries/postsQueries';
import {
  useGetUsers,
  useSearchUsers,
} from '@/lib/tanstack-queries/usersQueries';
import {
  useGetCommunities,
  useGetSearchCommunities,
} from '@/lib/tanstack-queries/communityQueries';
import {
  useGetUpcomingEvents,
  useSearchEvents,
} from '@/lib/tanstack-queries/eventsQueries';

import { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import EventCard from '@/components/shared/EventCard';
import { IEvent } from '@/types';

const Explore = () => {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState<
    'post' | 'user' | 'circle' | 'event'
  >('post');

  const tabs = useMemo(
    () => [
      { name: 'post', label: 'Creations' },
      { name: 'user', label: 'Creators' },
      { name: 'circle', label: 'Circles' },
      { name: 'event', label: 'Events' }, // Add events tab
    ],
    []
  );

  const debouncedValue = useDebounce(searchValue, 500);

  const { ref: loadMoreRef, inView: loadMoreInView } = useInView();

  // Fetch posts
  const {
    data: posts,
    fetchNextPage: fetchNextPosts,
    hasNextPage: hasMorePosts,
  } = useGetInfiniteCreations();

  // Fetch users
  const {
    data: users,
    fetchNextPage: fetchNextUsers,
    hasNextPage: hasMoreUsers,
  } = useGetUsers();

  // Fetch communities
  const {
    data: communities,
    fetchNextPage: fetchNextCommunities,
    hasNextPage: hasMoreCommunities,
  } = useGetCommunities();

  // Fetch events
  const {
    data: events,
    fetchNextPage: fetchNextEvents,
    hasNextPage: hasMoreEvents,
  } = useGetUpcomingEvents();

  // Search posts
  const { data: searchedPosts, isFetching: isSearchFetchingPosts } =
    useGetSearchCreations(debouncedValue);

  // Search users
  const { data: searchedUsers, isFetching: isSearchFetchingUsers } =
    useSearchUsers(debouncedValue);

  // Search communities
  const { data: searchedCommunities, isFetching: isSearchFetchingCommunities } =
    useGetSearchCommunities(debouncedValue);

  // Search events
  const { data: searchedEvents, isFetching: isSearchFetchingEvents } =
    useSearchEvents(debouncedValue);

  useEffect(() => {
    if (loadMoreInView && !searchValue) {
      if (activeTab === 'post') fetchNextPosts();
      if (activeTab === 'user') fetchNextUsers();
      if (activeTab === 'circle') fetchNextCommunities();
      if (activeTab === 'event') fetchNextEvents();
    }
  }, [
    loadMoreInView,
    searchValue,
    activeTab,
    fetchNextPosts,
    fetchNextUsers,
    fetchNextCommunities,
    fetchNextEvents,
  ]);

  const renderContent = () => {
    if (activeTab === 'post') {
      const isSearchActive = searchValue.trim() !== '';
      const noPosts =
        !isSearchActive &&
        posts?.pages.every((page) => page.documents.length === 0);

      return (
        <div className="flex flex-wrap gap-9 w-full mt-4">
          {isSearchActive ? (
            <SearchResult
              isSearchFetching={isSearchFetchingPosts}
              searchedItems={searchedPosts}
              type="post"
            />
          ) : noPosts ? (
            <p className="text-light-4 text-center pl-1 w-full">
              End of the results...
            </p>
          ) : (
            posts?.pages.map((page, index) => (
              <GridSearchList
                key={`page-${index}`}
                items={page.documents}
                type="post"
              />
            ))
          )}
          {hasMorePosts && !searchValue && (
            <div ref={loadMoreRef} className="mt-10 w-full">
              <Loader />
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'user') {
      const isSearchActive = searchValue.trim() !== '';
      const noUsers =
        !isSearchActive &&
        users?.pages.every((page) => page.documents.length === 0);

      return (
        <div className="flex flex-wrap w-full mt-4">
          {isSearchActive ? (
            <SearchResult
              isSearchFetching={isSearchFetchingUsers}
              searchedItems={searchedUsers}
              type="user"
            />
          ) : noUsers ? (
            <p className="text-light-4 text-center pl-1 w-full">
              End of the results...
            </p>
          ) : (
            users?.pages.map((page, index) => (
              <GridSearchList
                key={`page-${index}`}
                items={page.documents}
                type="user"
              />
            ))
          )}
          {hasMoreUsers && !searchValue && (
            <div ref={loadMoreRef} className="mt-10 w-full">
              <Loader />
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'circle') {
      const isSearchActive = searchValue.trim() !== '';
      const noCommunities =
        !isSearchActive &&
        communities?.pages.every((page) => page.documents.length === 0);

      return (
        <div className="flex flex-wrap w-full mt-4">
          {isSearchActive ? (
            <SearchResult
              isSearchFetching={isSearchFetchingCommunities}
              searchedItems={searchedCommunities}
              type="circle"
            />
          ) : noCommunities ? (
            <p className="text-light-4 text-center pl-1 w-full">
              End of the results...
            </p>
          ) : (
            communities?.pages.map((page, index) => (
              <GridSearchList
                key={`page-${index}`}
                items={page.documents}
                type="circle"
              />
            ))
          )}
          {hasMoreCommunities && !searchValue && (
            <div ref={loadMoreRef} className="mt-10 w-full">
              <Loader />
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'event') {
      const isSearchActive = searchValue.trim() !== '';
      const noEvents =
        !isSearchActive &&
        events?.pages.every((page) => page.documents.length === 0);

      return (
        <div className="flex flex-wrap w-full mt-4 mb-10 ">
          {isSearchActive ? (
            <SearchResult
              isSearchFetching={isSearchFetchingEvents}
              searchedItems={searchedEvents}
              type="event"
            />
          ) : noEvents ? (
            <p className="text-light-4 text-center pl-1 w-full">
              No upcoming events found...
            </p>
          ) : (
            events?.pages.map((page, index) => (
              <div
                key={`page-${index}`}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-6 lg:gap-9"
              >
                {page.documents.map((event) => (
                  <EventCard
                    key={event.$id}
                    event={event as unknown as IEvent}
                  />
                ))}
              </div>
            ))
          )}
          {hasMoreEvents && !searchValue && (
            <div ref={loadMoreRef} className="mt-10 w-full">
              <Loader />
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="explore-container">
      {/* Header */}
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold mt-16 lg:mt-0 w-full">Explore</h2>

        {/* Search Bar */}
        <div className="flex items-center gap-2 px-4 w-full rounded-lg bg-dark-4 border border-light-4 border-opacity-50 ">
          <img src="/assets/icons/search.svg" width={24} alt="search" />
          <Input
            type="text"
            placeholder="Search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex-start w-full mt-4 whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() =>
                setActiveTab(tab.name as 'post' | 'user' | 'circle' | 'event')
              }
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
      </div>

      {/* Content */}
      <div className="mx-3 mt-4 lg:mt-6 mb-20 max-w-5xl w-full pl-1 lg:pl-3">
        {renderContent()}
      </div>
    </div>
  );
};

export default Explore;
