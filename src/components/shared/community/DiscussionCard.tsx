import { useUserContext } from '@/context/AuthContext';
import { multiFormatDateString } from '@/lib/utils/utils';
import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import { getUserAccountId } from '@/lib/appwrite-apis/users';
import LazyImage from '../LazyImage';
import Loader from '../Loader';
import AudioPlayer from '../AudioPlayer';
import VideoPlayer from '../VideoPlayer';
import DiscussionStats from './DiscussionStats';
import { getCommunityIdFromTopicId } from '@/lib/appwrite-apis/community';

interface DiscussionDocument extends Models.Document {
  type: 'Discussion' | 'Help' | 'Poll' | 'Collab';
}

interface DiscussionCardProps {
  discussion: DiscussionDocument;
  showNotificationDot?: boolean;
  onClick?: () => void; // Add this line to make onClick optional
}

const DiscussionCard = ({
  discussion,
  showNotificationDot = false,
  onClick,
}: DiscussionCardProps) => {
  const { user } = useUserContext();
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const creatorId = discussion?.authorId;
  const [accountId, setAccountId] = useState<string>('');
  const [communityId, setCommunityId] = useState<string>(''); // Add this state

  // Fetch accountId when author data is available
  useEffect(() => {
    const getAccountId = async () => {
      if (creatorId) {
        const id = await getUserAccountId(creatorId);
        setAccountId(id);
      }
    };
    getAccountId();
  }, [creatorId]);

  // Add effect to get communityId
  useEffect(() => {
    const fetchCommunityId = async () => {
      if (discussion?.topicId) {
        const id = await getCommunityIdFromTopicId(discussion.topicId);
        setCommunityId(id);
      }
    };
    fetchCommunityId();
  }, [discussion?.topicId]);

  useEffect(() => {
    if (discussion?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(discussion.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [discussion?.mediaUrl]);

  if (!discussion.authorId) return;

  return (
    <div className="post-card relative" onClick={onClick}>
      {/* Notification dot positioned in top-right */}
      {showNotificationDot && (
        <span className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-purple-400 w-2 h-2 rounded-full z-10" />
      )}
      <div className="flex-between">
        <div className="flex items-center gap-3 relative">
          {/* Remove the notification dot from here */}
          <Link
            to={`/profile/${discussion?.authorId}`}
            className="flex-shrink-0"
          >
            <LazyImage
              src={
                discussion?.author?.dpUrl ||
                '/assets/icons/profile-placeholder.svg'
              }
              alt="author"
              className="rounded-full object-cover w-10 h-10 lg:w-14 lg:h-14"
            />
          </Link>
          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1 line-clamp-1 flex items-center gap-1.5">
              {discussion?.author?.name}
              {discussion?.author?.verifiedUser && (
                <img
                  src="/assets/icons/verified.svg"
                  alt="verified"
                  className="w-4 h-4 flex-shrink-0"
                />
              )}
            </p>
            <div className="flex-start text-light-3 pt-0.5">
              <p className="subtle-semibold lg:small-regular line-clamp-1">
                {multiFormatDateString(discussion?.$createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {discussion?.type && (
            <div
              className={`
                px-2.5 py-1 rounded-full
                text-xs font-medium
                ${
                  discussion.type === 'Discussion'
                    ? 'bg-blue-500/20 text-blue-400'
                    : discussion.type === 'Poll'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : discussion.type === 'Help'
                    ? 'bg-lime-500/20 text-lime-400'
                    : discussion.type === 'Collab'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-green-500/20 text-green-400'
                }
              `}
            >
              {discussion.type.charAt(0).toUpperCase() +
                discussion.type.slice(1)}
            </div>
          )}
          <Link
            to={`/update-discussion/${discussion?.$id}`}
            className={`${user.id !== discussion?.authorId && 'hidden'}`}
          >
            <img src="/assets/icons/edit.svg" alt="edit" width={20} />
          </Link>
        </div>
      </div>

      <Link to={`/discussions/${discussion?.$id}`}>
        <div className="small-medium lg:base-medium">
          {discussion?.mediaUrl?.length > 0 ? (
            <p className="pl-0.5 whitespace-pre-line pt-5 mb-4 small-regular line-clamp-5 text-pretty">
              {discussion?.content}
            </p>
          ) : (
            <p className="pl-0.5 whitespace-pre-wrap small-regular pt-5 line-clamp-[11] text-pretty">
              {discussion?.content
                ?.split(/(\s+)/)
                .map((segment: string, index: number) => {
                  if (segment.startsWith('https://xongroh.com/')) {
                    // Get internal path by removing the domain
                    const internalPath = segment.replace(
                      'https://xongroh.com',
                      ''
                    );
                    const path = segment.split('xongroh.com/')[1];
                    // Take first 15 characters of the path after xongroh.com/
                    const shortPath =
                      path.length > 15 ? path.substring(0, 15) + '...' : path;

                    return (
                      <span key={index}>
                        <Link
                          to={internalPath}
                          className="text-primary-500 hover:underline"
                        >
                          {`xongroh.com/${shortPath}`}
                        </Link>
                      </span>
                    );
                  }
                  return segment;
                })}
            </p>
          )}
        </div>
      </Link>

      {discussion?.mediaUrl?.length > 0 && (
        <>
          {isMediaLoading ? (
            <div className="post-card_img flex-center">
              <Loader />
            </div>
          ) : (
            (() => {
              switch (mediaType) {
                case 'image':
                  return (
                    <Link to={`/discussions/${discussion?.$id}`}>
                      <LazyImage
                        src={discussion?.mediaUrl}
                        alt="discussion image"
                        className="post-card_img mt-5"
                      />
                    </Link>
                  );
                case 'audio':
                  return (
                    <div className="post-card_audio mt-5">
                      <AudioPlayer audioUrl={discussion?.mediaUrl} />
                    </div>
                  );
                case 'video':
                  return (
                    <div className="post-card_video mt-5">
                      <VideoPlayer videoUrl={discussion?.mediaUrl[0]} />
                    </div>
                  );
                default:
                  return null;
              }
            })()
          )}
        </>
      )}

      {discussion?.tags &&
        Array.isArray(discussion?.tags) &&
        discussion?.tags.filter((tag: string) => tag.trim() !== '').length >
          0 && (
          <Link to={`/discussions/${discussion?.$id}`}>
            <ul className="flex py-1.5 flex-wrap gap-3.5 mt-3.5 mb-0.5 overflow-x-hidden">
              {discussion?.tags
                .filter((tag: string) => tag.trim() !== '')
                .map((tag: string, index: number) => (
                  <li key={`${tag}${index}`}>
                    <span className="px-3 py-1 bg-[#2A2A2A] rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  </li>
                ))}
            </ul>
          </Link>
        )}

      <div className="mt-5">
        <DiscussionStats
          discussion={discussion ?? ({} as Models.Document)}
          userId={user.id}
          authorId={accountId}
          communityId={communityId}
        />
      </div>
    </div>
  );
};

export default DiscussionCard;
