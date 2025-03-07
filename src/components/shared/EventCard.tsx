import { IEvent } from '@/types';
import LazyImage from './LazyImage';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getUserAccountId } from '@/lib/appwrite-apis/users';
import { useUserContext } from '@/context/AuthContext';
import {
  useAddInterestedEvent,
  useDeleteInterestedEvent,
  useCheckUserInterestedEvent,
  useGetInterestedEventsUsers,
} from '@/lib/tanstack-queries/eventsQueries';

type EventCardProps = {
  event: IEvent;
  creator?: {
    name: string;
    dpUrl: string | null;
    verifiedUser: boolean;
  };
};

const EventCard = ({ event, creator }: EventCardProps) => {
  const { user } = useUserContext();
  const creatorId = event?.creatorId;
  const [_accountId, setAccountId] = useState<string>('');
  const [isInterested, setIsInterested] = useState(false);
  const [interestedEventId, setInterestedEventId] = useState('');

  // Interest mutations
  const { mutate: addInterest } = useAddInterestedEvent();
  const { mutate: removeInterest } = useDeleteInterestedEvent();

  // Check if user is interested
  const { data: interestCheck } = useCheckUserInterestedEvent(
    event.$id,
    user?.id || ''
  );

  // Get interested users
  const { data: interestedUsers } = useGetInterestedEventsUsers(event.$id);

  useEffect(() => {
    const getAccountId = async () => {
      if (creatorId) {
        const id = await getUserAccountId(creatorId);
        setAccountId(id);
      }
    };
    getAccountId();
  }, [creatorId]);

  useEffect(() => {
    if (interestCheck) {
      setIsInterested(interestCheck.interested);
      setInterestedEventId(interestCheck.interestedEventId || '');
    }
  }, [interestCheck]);

  // Handle interest click
  const handleInterestClick = () => {
    if (!user) {
      // Handle not logged in case - maybe redirect to login
      window.location.href = '/sign-in';
      return;
    }

    if (isInterested && interestedEventId) {
      removeInterest(interestedEventId);
      setIsInterested(false);
      setInterestedEventId('');
    } else {
      addInterest({ eventId: event.$id, userId: user.id });
      setIsInterested(true);
    }
  };

  if (!event.creatorId) return null;

  // Use passed creator data if available, fallback to event.creator
  const displayCreator = creator || event?.creator;

  return (
    <div className="bg-dark-2 rounded-2xl border  border-light-4 border-opacity-50 px-3 py-5 lg:p-7 w-full max-w-screen-sm;">
      {/* Image Container with Badges */}
      <div className="relative">
        <LazyImage
          src={
            (event.imageUrl instanceof URL
              ? event.imageUrl.toString()
              : event.imageUrl) || '/assets/icons/cover-placeholder.png'
          }
          alt={event.title}
          className="w-full aspect-video object-cover"
        />

        {/* Event Type Badge - Top Left */}
        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
          {event.type || 'Event'}
        </div>

        {/* Date Badge - Top Right */}
        <div className="absolute top-0 left-4 bg-violet-600 px-3 py-2 rounded-b-md flex flex-col items-center">
          <span className="text-light-1 body-bold xl:h3-bold">
            {format(new Date(event?.dateTime), 'dd')}
          </span>
          <span className="text-light-1 subtle-comment xl:small-medium uppercase">
            {format(new Date(event?.dateTime), 'MMM')}
          </span>
        </div>

        {/* Creator Badge - Bottom Left */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-dark-1/60 backdrop-blur-sm rounded-lg ">
          <LazyImage
            src={
              displayCreator?.dpUrl || '/assets/icons/profile-placeholder.svg'
            }
            alt="creator"
            className="w-6 h-6 lg:w-9 lg:h-9 rounded-full object-cover"
          />
          <p className="text-light-1 subtle-normal lg:base-regular flex items-center gap-1">
            {displayCreator?.name || 'Anonymous'}
            {displayCreator?.verifiedUser && (
              <img
                src="/assets/icons/verified.svg"
                alt="verified"
                className="w-[15px] h-[15px]"
              />
            )}
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-5 px-1.5 space-y-3">
        {/* Title */}
        <h3 className="text-light-2 body-bold lg:h4-bold font-bold line-clamp-2 pl-1.5">
          {event.title}
        </h3>

        {/* Organizer */}
        <div className="flex items-center gap-2 pt-3 pl-1">
          <img
            src={'/assets/icons/organizer.svg'}
            alt="organizer"
            className="w-5 h-5"
          />
          <p className="text-stone-300 subtle-comment md:small-regular">
            {event?.organiser}
          </p>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2 pl-1.5">
          <img
            src="/assets/icons/hometown.svg"
            alt="location"
            className="w-4 h-4"
          />
          <p className="text-stone-300 subtle-comment md:small-regular line-clamp-1">
            {event.venue}
          </p>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 pl-[7.5px]">
          <img src="/assets/icons/time.svg" alt="time" className="w-4 h-4" />
          <p className="text-stone-300 subtle-comment md:small-regular">
            {format(new Date(event?.dateTime), 'hh:mm a')}
          </p>
        </div>

        {/* Interested Users */}
        <div className="flex items-center gap-2 pl-2 pt-3">
          {(interestedUsers?.totalCount || 0) > 0 && (
            <>
              <div className="flex -space-x-3.5">
                {interestedUsers?.documents.slice(0, 5).map((user, index) => (
                  <LazyImage
                    key={index}
                    src={user.dpUrl || '/assets/icons/profile-placeholder.svg'}
                    alt={`interested-user-${index}`}
                    className="w-7 h-7 lg:w-9 lg:h-9 rounded-full border-2 border-dark-2 object-cover"
                  />
                ))}
              </div>
              {(interestedUsers?.totalCount || 0) > 5 && (
                <div className="flex items-center gap-1">
                  <span className="text-light-3 subtle-semibold md:small-semibold">
                    + {(interestedUsers?.totalCount || 0) - 5}
                  </span>
                  <span className="text-light-3 subtle-semibold md:small-semibold">
                    {(interestedUsers?.totalCount || 0) - 5 === 1
                      ? 'other'
                      : 'others'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <button
            onClick={() => (window.location.href = `/events/${event?.$id}`)}
            className="flex-1 px-4 py-2 bg-dark-4 rounded-lg text-white tiny-normal-mutate lg:subtle-normal text-center items-center hover:bg-dark-3 transition border border-opacity-50 border-light-4"
          >
            Details
          </button>
          <button
            onClick={handleInterestClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 ${
              isInterested
                ? 'bg-dark-4 hover:bg-dark-3'
                : 'bg-violet-800 hover:bg-violet-700'
            } rounded-lg text-light-1 tiny-normal-mutate lg:subtle-normal transition border border-opacity-50 border-light-4`}
          >
            <img
              src={
                isInterested
                  ? '/assets/icons/liked-1.svg'
                  : '/assets/icons/like-1.svg'
              }
              alt="like"
              className={
                isInterested ? 'w-3.5 h-3.5 ' : 'w-3.5 h-3.5 invert-white'
              }
            />
            {isInterested ? 'Interested' : 'Interest'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
