import { useUserContext } from '@/context/AuthContext';
import { multiFormatDateString } from '@/lib/utils/utils';
import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import PostStats from './PostStats';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
import { useState, useEffect } from 'react';
import Loader from './Loader';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';

type PostCardProps = {
  post: Models.Document;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  useEffect(() => {
    if (post?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(post.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [post?.mediaUrl]);

  if (!post.creatorId) return;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post?.creatorId}`}>
            <img
              src={
                post?.creator?.dpUrl || '/assets/icons/profile-placeholder.svg'
              }
              alt="creator"
              className="rounded-full object-cover w-10 h-10 lg:w-14 lg:h-14"
            />
          </Link>
          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post?.creator?.name}
            </p>
            <div className="flex-start text-light-3 pt-0.5">
              <p className="subtle-semibold lg:small-regular ">
                {multiFormatDateString(post?.$createdAt)}
              </p>
            </div>
          </div>
        </div>
        <Link
          to={`/update-post/${post?.$id}`}
          className={`${user.id !== post?.creatorId && 'hidden'}`}
        >
          <img src="/assets/icons/edit.svg" alt="edit" width={20} />
        </Link>
      </div>

      <Link to={`/posts/${post?.$id}`}>
        <div className="small-medium lg:base-medium ">
          {post?.mediaUrl?.length > 0 ? (
            <p className="pl-0.5 whitespace-pre-line pt-5 pb-4 small-regular line-clamp-5 text-pretty">
              {post?.content}
            </p>
          ) : (
            <p className="pl-0.5 whitespace-pre-line small-regular pt-5 line-clamp-[11] text-pretty">
              {post?.content}
            </p>
          )}
        </div>
      </Link>
      {post?.mediaUrl?.length > 0 && (
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
                    <Link to={`/posts/${post?.$id}`}>
                      <img
                        src={post?.mediaUrl}
                        alt="post image"
                        className="post-card_img"
                      />
                    </Link>
                  );
                case 'audio':
                  return (
                    <div className="post-card_audio ">
                      <AudioPlayer audioUrl={post?.mediaUrl} />
                    </div>
                  );
                case 'video':
                  return (
                    <div className="post-card_video">
                      <VideoPlayer videoUrl={post?.mediaUrl[0]} />
                    </div>
                  );
                default:
                  return null;
              }
            })()
          )}
        </>
      )}
      {post?.tags &&
        Array.isArray(post?.tags) &&
        post?.tags.filter((tag: string) => tag.trim() !== '').length > 0 && (
          <Link to={`/posts/${post?.$id}`}>
            <ul className="flex py-1.5 flex-wrap gap-3.5 mt-3.5 mb-0.5 overflow-x-hidden">
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
          </Link>
        )}

      <div className="mt-5">
        <PostStats post={post} userId={user.id} />
      </div>
    </div>
  );
};

export default PostCard;
