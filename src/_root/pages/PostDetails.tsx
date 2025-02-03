import AudioPlayer from '@/components/shared/AudioPlayer';
import { DeleteCreation } from '@/components/shared/DeleteItems';
import Loader from '@/components/shared/Loader';
import PostComments from '@/components/shared/PostComments';
import PostStats from '@/components/shared/PostStats';
import VideoPlayer from '@/components/shared/VideoPlayer';
import { useUserContext } from '@/context/AuthContext';
import { formatDateString } from '@/lib/utils/utils';
import { Models } from 'appwrite';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import LazyImage from '@/components/shared/LazyImage';
import {
  useGetAuthorById,
  useGetCreationById,
} from '@/lib/tanstack-queries/postsQueries';
import { getUserAccountId } from '@/lib/appwrite-apis/users';

const PostDetails = () => {
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [accountId, setAccountId] = useState<string>('');
  const { id } = useParams();
  const { data: post, isPending } = useGetCreationById(id || '');
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(post?.authorId);
  const authorId = post?.authorId;

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

  useEffect(() => {
    if (post?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(post.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [post?.mediaUrl]);

  const postId = id || '';
  const mediaId = post?.mediaId[0];
  const navigate = useNavigate();

  return (
    <div className="post_details-container">
      {isPending || !accountId ? (
        <Loader />
      ) : (
        <div className="post_details-card">
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
          {post?.mediaUrl && (
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
                          src={post.mediaUrl}
                          alt="post"
                          className="post-card-detail_img"
                        />
                      );
                    case 'audio':
                      return (
                        <div className="post-card_audio">
                          <AudioPlayer audioUrl={post.mediaUrl} />
                        </div>
                      );
                    case 'video':
                      return (
                        <div className="post-card_video">
                          <VideoPlayer videoUrl={post.mediaUrl[0]} />
                        </div>
                      );
                    default:
                      return null;
                  }
                })()
              )}
            </>
          )}
          <div className="post_details-info mt-3">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.authorId}`}
                className="flex items-center gap-3 flex-shrink-0"
              >
                <LazyImage
                  src={author?.dpUrl || '/assets/icons/profile-placeholder.svg'}
                  alt="author"
                  className="rounded-full object-cover w-10 h-10 lg:w-14 lg:h-14"
                />

                <div className="flex flex-col ">
                  <p className="base-medium lg:body-bold text-light-1 line-clamp-1 flex items-center gap-1.5">
                    {author?.name}
                    {author?.verifiedUser && (
                      <img
                        src="/assets/icons/verified.svg"
                        alt="verified"
                        className="w-5 h-5"
                      />
                    )}
                  </p>
                  <div className="flex-start pt-1 text-light-3">
                    <p className="subtle-semibold lg:small-regular line-clamp-1">
                      {formatDateString(post?.$createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex-center gap-5">
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-violet-400">
                  Creation
                </div>
                <div className={`${user?.id !== post?.authorId && 'hidden'}`}>
                  <Link to={`/update-creation/${post?.$id}`}>
                    <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                  </Link>
                </div>

                <div className={`${user?.id !== post?.authorId && 'hidden'}`}>
                  <DeleteCreation
                    creationId={postId}
                    mediaId={mediaId}
                    authorId={authorId}
                  />
                </div>
              </div>
            </div>
            <hr className="border w-full mt-2 mb-0.5 border-dark-4/80" />
            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p className="small-regular pl-1 whitespace-pre-line text-pretty">
                {post?.content}
              </p>
              {post?.tags &&
                Array.isArray(post?.tags) &&
                post?.tags.filter((tag: string) => tag.trim() !== '').length >
                  0 && (
                  <ul className="flex py-1.5 flex-wrap gap-3.5 mt-5 overflow-x-hidden">
                    {post?.tags
                      .filter((tag: string) => tag.trim() !== '') // Filter out empty tags
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

            <div className="w-full  pt-1.5">
              <PostStats
                post={post ?? ({} as Models.Document)}
                userId={user.id}
                authorId={accountId}
              />
              <PostComments
                postId={post?.$id ?? ''}
                userId={user.id}
                authorId={accountId}
                postAuthorId={post?.authorId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
