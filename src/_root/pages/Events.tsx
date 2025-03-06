import EventCard from '@/components/shared/EventCard';
import Loader from '@/components/shared/Loader';
import { Button } from '@/components/ui/button';
import {
  useGetEvents,
  useGetUserInterestedEvents,
} from '@/lib/tanstack-queries/eventsQueries';
import { IEvent } from '@/types';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';

const EventGrid = ({ events }: { events: IEvent[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-6 lg:gap-9">
      {events.map((event) => (
        <EventCard key={event.$id} event={event} />
      ))}
    </div>
  );
};

const Events = () => {
  const [filter, setFilter] = useState('upcoming');
  const { user } = useUserContext();
  const creatorId = user?.id;
  const { data: events, isPending } = useGetEvents(filter, creatorId);
  const { data: interestedEvents, isPending: isInterestedPending } =
    useGetUserInterestedEvents(user?.id || '');

  const filters = [
    { label: 'Live', value: 'live' },
    { label: 'Up Next', value: 'upcoming' },
    { label: 'Archived', value: 'archived' },
    // Only show My Events tab to verified users
    ...(user?.verifiedUser ? [{ label: 'My Events', value: 'my-events' }] : []),
    { label: 'Interested', value: 'interested' },
  ];

  const getDisplayedEvents = () => {
    if (filter === 'interested') {
      return interestedEvents?.pages[0]?.documents || [];
    }
    return events?.pages[0]?.documents || [];
  };

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full mt-16 lg:mt-0">Events</h2>

        {/* Tabs with horizontal scroll */}
        <div className="w-full mt-4 overflow-x-auto custom-scrollbar pb-1">
          <div className="flex gap-2 min-w-max pb-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`p-2 px-3 font-semibold whitespace-nowrap ${
                  filter === f.value
                    ? 'underline text-primary-500 underline-offset-8'
                    : 'hover:text-primary-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-3 mt-4 lg:mt-6 mb-20 max-w-5xl w-full pl-1 lg:pl-3">
        {isPending || (filter === 'interested' && isInterestedPending) ? (
          <div className="h-full mt-36 w-full items-center justify-center flex">
            <Loader />
          </div>
        ) : (
          <EventGrid events={getDisplayedEvents() as unknown as IEvent[]} />
        )}
      </div>

      {/* Floating Action Button - Only show for verified users */}
      {user?.verifiedUser && (
        <Link to="/add-event">
          <Button
            className="fixed bottom-6 right-6 lg:right-[calc(1.5rem+220px)] xl:right-[calc(1.5rem+390px)] w-14 h-14 rounded-full bg-gradient-to-r from-light-4 to-dark-4 hover:from-dark-4 hover:to-light-4 transition-all shadow-lg flex items-center justify-center p-0 z-50"
            size="icon"
          >
            <img
              className="w-6 h-6 invert-white"
              src="/assets/icons/add-2.svg"
            />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default Events;
