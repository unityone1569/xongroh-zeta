import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import VideoPlayer from '@/components/shared/VideoPlayer';
import Loader from '@/components/shared/Loader';
import LazyImage from './LazyImage';
import UserSupport from '@/components/shared/UserSupport';
import { useUserContext } from '@/context/AuthContext';
import EventCard from './EventCard';
import { IEvent } from '@/types';

type GridSearchListProps = {
  items: Models.Document[];
  type: 'post' | 'user' | 'circle' | 'event'; // Add 'event'
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
            className=" w-full h-auto object-contain object-center"
          />
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
        <div className="w-full h-full p-5 pt-6 flex items-center justify-center">
          <p className="w-full whitespace-pre-line small-regular line-clamp-[11] text-pretty text-light-2">
            {post?.content}
          </p>
        </div>
      );
  }
};

const GridSearchList = ({ items, type }: GridSearchListProps) => {
  const { user } = useUserContext(); // Add this hook

  if (type === 'post') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-9">
        {items.map((post) => (
          <div
            key={post?.$id}
            className="rounded-xl border border-light-4 border-opacity-50 bg-dark-3 overflow-hidden flex flex-col h-[320px]"
          >
            <Link
              to={`/creations/${post?.$id}`}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 min-h-0">
                <GridPostMedia post={post} />
              </div>

              <div className="p-3.5 mt-auto z-10 ">
                <div className="inline-flex items-center gap-2 shadow-md p-2 pl-3.5 pr-4 rounded-full bg-dark-4 bg-opacity-60  ">
                  <LazyImage
                    src={
                      post?.author?.dpUrl ||
                      '/assets/icons/profile-placeholder.svg'
                    }
                    alt={post?.author?.name || 'Creator'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <p className="line-clamp-1 small-medium flex items-center gap-1.5">
                    {post?.author?.name || 'Creator'}
                    {post?.author?.verifiedUser && (
                      <img
                        src="/assets/icons/verified.svg"
                        alt="verified"
                        className="w-4 h-4"
                      />
                    )}
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
    // Sort users: verified first, then by creationsCount
    const sortedUsers = [...items].sort((a, b) => {
      // First priority: verified status
      if (a.verifiedUser && !b.verifiedUser) return -1;
      if (!a.verifiedUser && b.verifiedUser) return 1;

      // Second priority: creationsCount (only if verification status is the same)
      return (b.creationsCount || 0) - (a.creationsCount || 0);
    });

    return (
      <ul className="grid-container overflow-hidden">
        {sortedUsers.map((listUser) => (
          <li
            key={listUser.$id}
            className="user-card flex flex-start bg-dark-3"
          >
            <div className="flex-shrink-0">
              <Link to={`/profile/${listUser.$id}`}>
                <LazyImage
                  src={
                    listUser.dpUrl || '/assets/icons/profile-placeholder.svg'
                  }
                  alt={listUser.name || 'User'}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full"
                />
              </Link>
            </div>
            <div className="w-full flex-col">
              <div className="flex justify-between items-center w-full">
                <div className="flex-1">
                  <Link to={`/profile/${listUser.$id}`}>
                    {listUser?.verifiedUser ? (
                      // Verified user version
                      <div className="flex items-center gap-1.5">
                        <p className="small-semibold lg:body-bold text-light-1 truncate">
                          {listUser.name || 'Unknown User'}
                        </p>
                        <div className="flex-shrink-0">
                          <img
                            src="/assets/icons/verified.svg"
                            alt="verified"
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                    ) : (
                      // Non-verified user version
                      <div className="flex items-center gap-1.5">
                        <p className="small-semibold lg:body-normal text-light-2 line-clamp-1">
                          {listUser.name || 'Unknown User'}
                        </p>
                      </div>
                    )}
                  </Link>

                  <div className="flex gap-2 pt-2 justify-start items-center">
                    <div className="flex-shrink-0 w-4">
                      <LazyImage
                        src="/assets/icons/profession.svg"
                        alt="profession"
                        className="w-4 h-4"
                      />
                    </div>
                    <p className="subtle-normal line-clamp-1 lg:subtle-comment overflow-hidden text-ellipsis text-light-2">
                      {listUser?.profession || 'Creator'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1 justify-start items-center">
                    <div className="flex-shrink-0 w-4">
                      <LazyImage
                        src="/assets/icons/hometown.svg"
                        alt="hometown"
                        className="w-4 h-4"
                      />
                    </div>
                    <p className="subtle-normal line-clamp-1 lg:subtle-comment text-light-2">
                      {listUser?.hometown || 'Earth'}
                    </p>
                  </div>
                </div>

                {/* Support Button moved to the right */}
                {user.id !== listUser.$id && (
                  <div className="flex-shrink-0">
                    <UserSupport
                      creatorId={user.id}
                      supportingId={listUser.$id}
                      variant="small"
                    />
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (type === 'circle') {
    // Sort communities by membersCount in ascending order
    const sortedCommunities = [...items].sort(
      (a, b) => (a.membersCount || 0) - (b.membersCount || 0)
    );

    return (
      <ul className="w-full grid grid-cols-1 sm:grid-cols-2 gap-7 max-w-5xl pb-6 overflow-hidden">
        {sortedCommunities.map((community) => (
          <li
            key={community.$id}
            className="user-card flex flex-start gap-4 bg-dark-3"
          >
            <div className="flex-shrink-0">
              <Link to={`/circles/${community.$id}`}>
                <LazyImage
                  src={
                    community.imageUrl ||
                    '/assets/icons/community-placeholder.svg'
                  }
                  alt={community.name}
                  className="w-12 h-12 object-cover rounded-full"
                />
              </Link>
            </div>
            <div className="w-full flex-col">
              <Link to={`/circles/${community.$id}`}>
                <h3 className="base-bold line-clamp-1">{community.name}</h3>
              </Link>
              <div className="flex gap-2 pt-1 justify-start items-center">
                <p className="subtle-normal line-clamp-1 lg:subtle-comment text-light-3">
                  Members: {community.membersCount || 0}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (type === 'event') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-6 lg:gap-9">
        {items.map((event) => (
          <EventCard key={event.$id} event={event as unknown as IEvent} />
        ))}
      </div>
    );
  }

  return null;
};

export default GridSearchList;
