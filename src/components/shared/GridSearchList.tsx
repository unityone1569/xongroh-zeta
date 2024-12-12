import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import VideoPlayer from '@/components/shared/VideoPlayer';
import Loader from '@/components/shared/Loader';
import LazyImage from './LazyImage';

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
        <div className=" w-full h-full flex-center flex-col">
          <LazyImage
            src={post?.mediaUrl}
            alt="post"
            className=" w-full h-auto object-cover object-center"
            
          />
          <p className="w-full whitespace-pre-line px-5 text-center small-medium line-clamp-2 text-light-3 text-pretty">
            {post?.content}
          </p>
        </div>
      );
    case 'audio':
      return (
        <div className=" w-full h-full flex-center flex-col">
          <LazyImage
            src="/assets/icons/audio.svg"
            alt="music"
            className=" h-32 w-32 p-5"
             
          />
          <p className="w-full whitespace-pre-line px-3.5 text-center subtle-comment line-clamp-2 text-light-2 opacity-45 text-pretty">
            {post?.content}
          </p>
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
        <div className="w-full h-full p-5 pt-6">
          <p className="w-full whitespace-pre-line small-regular line-clamp-[11] text-pretty text-light-2">
            {post?.content}
          </p>
        </div>
      );
  }
};

const GridSearchList = ({ items, type }: GridSearchListProps) => {
  if (type === 'post') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-9">
        {items.map((post) => (
          <div
            key={post?.$id}
            className="rounded-xl border border-dark-4 overflow-hidden flex flex-col h-[320px]"
          >
            <Link
              to={`/posts/${post?.$id}`}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 min-h-0">
                <GridPostMedia post={post} />
              </div>

              <div className="p-3.5 mt-auto">
                <div className="flex items-center gap-2">
                  <LazyImage
                    src={
                      post?.author?.dpUrl ||
                      '/assets/icons/profile-placeholder.svg'
                    }
                    alt={post?.author?.name || 'Creator'}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <p className="truncate small-medium">
                    {post?.author?.name || 'Creator'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'user') {
    return (
      <ul className="grid-container">
        {items.map((user) => (
          <li key={user.$id} className="user-card flex flex-start gap-4">
            <div className="w-28">
              <Link to={`/profile/${user.$id}`}>
                <LazyImage
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
                  <LazyImage
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
                  <LazyImage
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
