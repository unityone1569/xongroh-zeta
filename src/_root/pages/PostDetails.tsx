import AudioPlayer from '@/components/shared/AudioPlayer';
import { DeleteCreation } from '@/components/shared/DeleteItems';
import Loader from '@/components/shared/Loader';
import PostComments from '@/components/shared/PostComments';
import PostStats from '@/components/shared/PostStats';
import VideoPlayer from '@/components/shared/VideoPlayer';
import { useUserContext } from '@/context/AuthContext';
import { useGetAuthorById, useGetPostById } from '@/lib/react-query/queries';
import { formatDateString } from '@/lib/utils/utils';
import { Models } from 'appwrite';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';

const PostDetails = () => {
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const { id } = useParams();
  const { data: post, isPending } = useGetPostById(id || '');

  useEffect(() => {
    if (post?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(post.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [post?.mediaUrl]);
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(post?.creatorId);
  const postId = id || '';
  const mediaId = post?.mediaId[0];
  const creatorId = post?.creatorId;
  const navigate = useNavigate();

  return (
    <div className="post_details-container">
      {isPending ? (
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
                        <img
                          src={post.mediaUrl}
                          alt="post"
                          className="post-card_img"
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
                to={`/profile/${post?.creatorId}`}
                className="flex items-center gap-3"
              >
                <img
                  src={author?.dpUrl || '/assets/icons/profile-placeholder.svg'}
                  alt="creator"
                  className="rounded-full object-cover w-10 h-10 lg:w-14 lg:h-14"
                />

                <div className="flex flex-col ">
                  <p className="base-medium lg:body-bold text-light-1">
                    {author?.name}
                  </p>
                  <div className="flex-start pt-1 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">
                      {formatDateString(post?.$createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex-center gap-5">
                <div className={`${user?.id !== post?.creatorId && 'hidden'}`}>
                  <Link to={`/update-post/${post?.$id}`}>
                    <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                  </Link>
                </div>

                <div className={`${user?.id !== post?.creatorId && 'hidden'}`}>
                  <DeleteCreation
                    postId={postId}
                    mediaId={mediaId}
                    creatorId={creatorId}
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
                userId={user?.id}
              />
              <PostComments
                postId={post?.$id ?? ''}
                userId={user.id}
                authorId={creatorId}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
