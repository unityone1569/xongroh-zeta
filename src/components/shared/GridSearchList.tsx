import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import AudioPlayer from '@/components/shared/AudioPlayer';
import VideoPlayer from '@/components/shared/VideoPlayer';
import Loader from '@/components/shared/Loader';

type GridSearchListProps = {
  items: Models.Document[];
  type: 'post' | 'user';
};

const GridPostMedia = ({ post }: { post: Models.Document }) => {
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

  if (isMediaLoading) {
    return (
      <div className="h-full w-full flex-center">
        <Loader />
      </div>
    );
  }

  switch (mediaType) {
    case 'image':
      return (
        <img
          src={post?.mediaUrl}
          alt="post"
          className="h-full w-full object-cover"
        />
      );
    case 'audio':
      return (
        <div className="h-full w-full flex-center">
          <AudioPlayer audioUrl={post?.mediaUrl} />
        </div>
      );
    case 'video':
      return (
        <div className="h-full w-full flex-center">
          <VideoPlayer videoUrl={post?.mediaUrl[0]} />
        </div>
      );
    default:
      return (
        <div className="p-5 pt-6">
          <p className="pl-0.5 whitespace-pre-line small-regular line-clamp-[11] text-pretty">
            {post?.content}
          </p>
        </div>
      );
  }
};

const GridSearchList = ({ items, type }: GridSearchListProps) => {
  if (type === 'post') {
    return (
      <ul className="grid-container">
        {items.map((post) => (
          <li key={post.$id} className="relative min-w-80 h-80">
            <Link to={`/posts/${post.$id}`} className="grid-post_link">
              {post?.mediaUrl?.length > 0 ? (
                <GridPostMedia post={post} />
              ) : (
                <div className="p-5 pt-6">
                  <p className="pl-0.5 whitespace-pre-line small-regular line-clamp-[11] text-pretty">
                    {post?.content}
                  </p>
                </div>
              )}
           
            <div className="grid-post_user">
              <div className="flex items-center gap-2">
                <img
                  src={
                    post?.author?.dpUrl ||
                    '/assets/icons/profile-placeholder.svg'
                  }
                  alt={post?.author?.name || 'creator'}
                  className="w-8 h-8 rounded-full"
                />
                <p className="line-clamp-1">
                  {post?.author?.name || 'Unknown'}
                </p>
              </div>
            </div>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (type === 'user') {
    return (
      <ul className="grid-container">
        {items.map((user) => (
          <li key={user.$id} className="user-card flex flex-start gap-4">
            <div className="w-28">
              <Link to={`/profile/${user.$id}`}>
                <img
                  src={user.dpUrl || '/assets/icons/profile-placeholder.svg'}
                  alt={user.name || 'User'}
                  className="w-20 h-20 object-cover rounded-full"
                />
              </Link>
            </div>
            <div className="w-full flex-col">
              <Link to={`/profile/${user.$id}`}>
                <h3 className="base-bold">{user.name || 'Unknown User'}</h3>
              </Link>

              {user?.profession && (
                <div className="flex gap-2 pt-2 justify-start items-center">
                  <img
                    src="/assets/icons/profession.svg"
                    alt="profession"
                    className="w-4 h-4 "
                  />
                  <p className="subtle-normal lg:subtle-comment">
                    {user?.profession}
                  </p>
                </div>
              )}
              {user?.hometown && (
                <div className="flex gap-2 pt-1 justify-start items-center">
                  <img
                    src="/assets/icons/hometown.svg"
                    alt="hometown"
                    className="w-4 h-4 "
                  />
                  <p className="subtle-normal lg:subtle-comment">
                    {user?.hometown}
                  </p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return null;
};

export default GridSearchList;
