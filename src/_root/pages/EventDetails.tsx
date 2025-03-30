import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { format } from 'date-fns';
import { ChevronDownIcon } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import LazyImage from '@/components/shared/LazyImage';
import { getUserAccountId, getUserInfo } from '@/lib/appwrite-apis/users';
import {
  useGetEventById,
  useGetInterestedEventsUsers,
} from '@/lib/tanstack-queries/eventsQueries';
import { Button } from '@/components/ui/button';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { data: event, isPending } = useGetEventById(id || '');
  const { data: interestedUsers } = useGetInterestedEventsUsers(id || '');
  const [_accountId, setAccountId] = useState<string>('');
  const creatorId = event?.creatorId;
  const [creatorInfo, setCreatorInfo] = useState<any>(null);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);

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
    const fetchCreatorInfo = async () => {
      if (creatorId) {
        try {
          const info = await getUserInfo(creatorId);
          setCreatorInfo(info);
        } catch (error) {
          console.error('Error fetching creator info:', error);
        }
      }
    };

    fetchCreatorInfo();
  }, [creatorId]);

  return (
    <div className="post_details-container">
      {isPending ? (
        <Loader />
      ) : (
        <div className="post_details-card pb-9">
          <div className="flex-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 p-2 mt-3 mb-5 text-light-2 subtle-semibold"
            >
              <img
                src="/assets/icons/back.svg"
                alt="back"
                className="w-5 h-5 lg:w-6 lg:h-6"
              />
              <p className="pt-1 lg:small-medium">Back</p>
            </button>
            <div className="px-3.5 py-1 mr-3.5 rounded-full text-light-1 text-xs font-medium bg-violet-500">
              {event?.type || 'Event'}
            </div>
          </div>

          {/* Event Image */}
          <div className="relative w-full">
            <LazyImage
              src={event?.imageUrl || '/assets/icons/cover-placeholder.png'}
              alt={event?.title}
              className="w-full aspect-auto object-cover"
            />

            {/* Date Badge */}
            <div className="absolute top-0 left-5 bg-violet-600 px-3 py-2 rounded-b-md flex flex-col items-center">
              <span className="text-light-1 body-bold xl:h3-bold">
                {format(new Date(event?.dateTime || ''), 'dd')}
              </span>
              <span className="text-light-1 subtle-comment xl:small-medium uppercase">
                {format(new Date(event?.dateTime || ''), 'MMM')}
              </span>
            </div>
          </div>

          {/* Event Details */}
          <div className="mt-8 px-5 lg:px-9">
            <h1 className="h3-bold md:h2-bold text-light-2">{event?.title}</h1>

            {/* Event Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-6 mt-11">
              {/* Creator Card */}
              <div className="bg-dark-2 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <LazyImage
                    src={
                      creatorInfo?.dp || '/assets/icons/profile-placeholder.svg'
                    }
                    alt="creator"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <Link
                      to={`/profile/${event?.creatorId}`}
                      className="small-medium text-light-1 flex items-center gap-2"
                    >
                      {creatorInfo?.name}
                      {creatorInfo?.verifiedUser && (
                        <img
                          src="/assets/icons/verified.svg"
                          alt="verified"
                          className="w-4 h-4"
                        />
                      )}
                    </Link>
                    <p className="subtle-normal text-light-3 pt-1">
                      Event Creator
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-dark-2 p-4 rounded-xl">
                <div className="flex items-center gap-0.5 mb-2">
                  <img
                    src="/assets/icons/organizer.svg"
                    alt="organizer"
                    className="w-6 h-6"
                  />
                  <p className="small-bold text-light-3">Organizer</p>
                </div>
                <p className="subtle-comment text-light-2 ml-2">
                  {event?.organiser}
                </p>
              </div>

              <div className="bg-dark-2 p-4 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <img
                    src="/assets/icons/time.svg"
                    alt="time"
                    className="w-5 h-5"
                  />
                  <p className="small-bold text-light-3">Date & Time</p>
                </div>
                <p className="subtle-comment text-light-2 ml-2">
                  {format(
                    new Date(event?.dateTime || ''),
                    'EEEE, MMMM dd, yyyy'
                  )}{' '}
                  at {format(new Date(event?.dateTime || ''), 'hh:mm a')}
                </p>
              </div>

              <div className="bg-dark-2 p-4 rounded-xl">
                <div className="flex items-center gap-1 mb-2">
                  <img
                    src="/assets/icons/hometown.svg"
                    alt="venue"
                    className="w-5 h-5"
                  />
                  <p className="small-bold text-light-3">Venue</p>
                </div>
                <p className="subtle-comment text-light-2 ml-2">
                  {event?.venue}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-11">
              <h3 className="h4-bold text-light-2 mb-4">About Event</h3>
              <p className="text-light-2 whitespace-pre-line px-1 small-regular text-pretty">
                {event?.description}
              </p>
            </div>

            {/* Interested Users */}
            <div className="flex items-center gap-2 mt-11 px-1 pl-1">
              {(interestedUsers?.totalCount || 0) > 0 && (
                <>
                  <div className="flex -space-x-5">
                    {interestedUsers?.documents
                      .slice(0, 5)
                      .map((user, index) => (
                        <LazyImage
                          key={index}
                          src={
                            user.dpUrl ||
                            '/assets/icons/profile-placeholder.svg'
                          }
                          alt={`interested-user-${index}`}
                          className="w-11 h-11 lg:w-14 lg:h-14 rounded-full border-2 border-dark-2 object-cover"
                        />
                      ))}
                  </div>
                  {(interestedUsers?.totalCount || 0) > 5 && (
                    <div className="flex items-center gap-1">
                      <span className="text-light-4 small-semibold lg:base-semibold text-nowrap">
                        +{(interestedUsers?.totalCount || 0) - 5}
                      </span>
                      <span className="text-light-4 small-semibold lg:base-semibold line-clamp-1">
                        {(interestedUsers?.totalCount || 0) - 5 === 1
                          ? 'other are interested.'
                          : 'others are interested.'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-11">
              {event?.bookingLink && (
                <Button
                  className="shad-button_primary flex-1"
                  onClick={() => window.open(event.bookingLink, '_blank')}
                  disabled={new Date(event?.dateTime) < new Date()}
                >
                  {new Date(event?.dateTime) < new Date()
                    ? 'Event Ended'
                    : 'Book Now'}
                </Button>
              )}
              {user?.id === event?.creatorId && (
                <Link to={`/update-event/${event?.$id}`} className="flex-1">
                  <Button className="shad-button_dark_4 w-full">
                    Edit Event
                  </Button>
                </Link>
              )}
            </div>

            {/* Disclaimer Dropdown */}
            <div className="mt-11">
              <button
                onClick={() => setIsDisclaimerOpen(!isDisclaimerOpen)}
                className="w-full p-3 px-5 bg-dark-4 rounded-xl flex items-center justify-between"
              >
                <span className="small-semibold text-light-2">Disclaimer</span>
                <ChevronDownIcon
                  className={`w-5 h-5 transition-transform text-light-2 ${
                    isDisclaimerOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDisclaimerOpen && (
                <div className="mt-2 p-4 bg-dark-4 rounded-xl">
                  <p className="text-light-3 subtle-comment text-justify">
                    The events listed on our platform are provided on an "as-is"
                    basis by users. We do not verify, endorse, or guarantee the
                    accuracy, reliability, or legitimacy of any event.
                    Participation in any listed event is at your own risk. Our
                    platform is not responsible for any losses, damages,
                    injuries, or disputes arising from event participation,
                    cancellations, or misrepresentations. By using this
                    platform, you acknowledge and agree that we bear no
                    liability for any direct or indirect consequences related to
                    these events. Always exercise due diligence before engaging
                    with any event.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
