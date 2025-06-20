import AudioPlayer from '@/components/shared/AudioPlayer';
import Loader from '@/components/shared/Loader';
import DiscussionStats from '@/components/shared/community/DiscussionStats';
import VideoPlayer from '@/components/shared/VideoPlayer';
import { useUserContext } from '@/context/AuthContext';
import { getCommunityIdFromTopicId } from '@/lib/appwrite-apis/community';
import { getUserAccountId } from '@/lib/appwrite-apis/users';
import { formatDateString } from '@/lib/utils/utils';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import { Models } from 'appwrite';
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import LazyImage from '@/components/shared/LazyImage';
import {
  useGetDiscussionById,
  useGetTopicsById,
} from '@/lib/tanstack-queries/communityQueries';
import { useGetAuthorById } from '@/lib/tanstack-queries/postsQueries';
import { DeleteDiscussion } from '@/components/shared/DeleteItems';
import DiscussionComments from '@/components/shared/community/DiscussionComments';

const DiscussionDetailsPage = () => {
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [accountId, setAccountId] = useState<string>('');
  const [communityId, setCommunityId] = useState<string>('');

  const { id } = useParams();
  const { data: discussion, isPending } = useGetDiscussionById(id || '');
  const { data: topic } = useGetTopicsById(discussion?.topicId || '');
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(discussion?.authorId);
  const authorId = discussion?.authorId;
  const topicId = discussion?.topicId;

  // Fetch accountId when author data is available
  useEffect(() => {
    const getAccountId = async () => {
      if (authorId) {
        const id = await getUserAccountId(authorId);
        setAccountId(id);
      }
    };
    getAccountId();
  }, [authorId]);

  // Get communityId from topicId
  useEffect(() => {
    const fetchCommunityId = async () => {
      if (topicId) {
        const id = await getCommunityIdFromTopicId(topicId);
        setCommunityId(id);
      }
    };
    fetchCommunityId();
  }, [topicId]);

  useEffect(() => {
    if (discussion?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(discussion.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [discussion?.mediaUrl]);

  return (
    <div className="post_details-container">
      {isPending || !accountId ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <div className="flex items-center gap-2 mt-3 mb-5">
            <Link
              to={`/topics/${discussion?.topicId}`}
              className="text-light-2 subtle-semibold hover:text-primary-500"
            >
              <p className="text-primary-500 transition-colors base-regular md:body-regular line-clamp-1 pl-3.5">
                {topic?.topicName || 'Topic'}
              </p>
            </Link>
            <span className="base-regular md:body-regular ">&gt;</span>
            <h2 className="base-regular md:body-regular text-light-1 line-clamp-1">
              {discussion?.type || 'Discussion'}
            </h2>
          </div>

          <div className="post_details-info">
            <div className="flex-between w-full">
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${discussion?.authorId}`}
                  className="flex-shrink-0"
                >
                  <LazyImage
                    src={
                      author?.dpUrl || '/assets/icons/profile-placeholder.svg'
                    }
                    alt="author"
                    className="rounded-full object-cover w-10 h-10 lg:w-14 lg:h-14 "
                  />
                </Link>
                <div className="flex flex-col">
                  <p className="base-medium lg:body-bold text-light-1 line-clamp-1 flex items-center gap-1.5">
                    {author?.name}
                    {author?.verifiedUser && (
                      <img
                        src="/assets/icons/verified.svg"
                        alt="verified"
                        className="w-4 h-4 flex-shrink-0"
                      />
                    )}
                  </p>
                  <div className="flex-start gap-2 text-light-3 pt-1">
                    <p className="subtle-semibold lg:small-regular line-clamp-1">
                      {formatDateString(discussion?.$createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-center gap-4 flex-shrink-0">
                {discussion?.type && (
                  <div
                    className={`
                        px-2.5 py-1 rounded-full text-xs font-medium
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
                        }`}
                  >
                    {discussion.type}
                  </div>
                )}
                <div
                  className={`${user?.id !== discussion?.authorId && 'hidden'}`}
                >
                  <Link to={`/update-discussion/${discussion?.$id}`}>
                    <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                  </Link>
                </div>
                <div
                  className={`${user?.id !== discussion?.authorId && 'hidden'}`}
                >
                  <DeleteDiscussion
                    discussionId={id || ''}
                    mediaId={discussion?.mediaId || ''}
                    authorId={authorId || ''}
                  />
                </div>
              </div>
            </div>

            <hr className="border w-full mt-2 mb-0.5 border-dark-4/80" />

            <p className="small-regular pl-1 pt-1 whitespace-pre-wrap text-pretty">
              {discussion?.content?.split(/(\s+)/).map((segment: string, index: number) => {
                if (segment.startsWith('https://xongroh.com/')) {
                  // Get internal path by removing the domain
                  const internalPath = segment.replace('https://xongroh.com', '');
                  const path = segment.split('xongroh.com/')[1];
                  // Take first 15 characters of the path after xongroh.com/
                  const shortPath = path.length > 15 ? path.substring(0, 15) + '...' : path;
                  
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

            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular gap-3">
              {discussion?.mediaUrl && (
                <>
                  {isMediaLoading ? (
                    <div className="flex-center p-11">
                      <Loader />
                    </div>
                  ) : (
                    (() => {
                      switch (mediaType) {
                        case 'image':
                          return (
                            <LazyImage
                              src={discussion.mediaUrl}
                              alt="discussion"
                              className="post-card-detail_img"
                            />
                          );
                        case 'audio':
                          return (
                            <div className="post-card_audio">
                              <AudioPlayer audioUrl={discussion.mediaUrl} />
                            </div>
                          );
                        case 'video':
                          return (
                            <div className="post-card_video">
                              <VideoPlayer videoUrl={discussion.mediaUrl[0]} />
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
                discussion?.tags.filter((tag: string) => tag.trim() !== '')
                  .length > 0 && (
                  <ul className="flex py-1.5 pt-6 flex-wrap gap-3.5 overflow-x-hidden">
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
                )}
            </div>

            <div className="w-full pt-1.5">
              <DiscussionStats
                discussion={discussion ?? ({} as Models.Document)}
                userId={user.id}
                authorId={accountId}
                communityId={communityId}
              />
              <DiscussionComments
                discussionId={discussion?.$id ?? ''}
                userId={user.id}
                authorId={accountId}
                communityId={communityId}
                postAuthorId={discussion?.authorId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionDetailsPage;
