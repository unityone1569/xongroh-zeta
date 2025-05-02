import { useEffect, useState } from 'react';
import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import VideoPlayer from './VideoPlayer';
import Loader from './Loader';
import LazyImage from './LazyImage';
import {
  useGetCreationById,
  useGetAuthorById,
} from '@/lib/tanstack-queries/postsQueries';

// Array of featured COTM post IDs and the banner image
const COTM_POSTS = {
  banner: {
    id: '67e3e111003cf0d33591',
    imageUrl:
      'https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/6812f52d00085fc6235a/view?project=66e2a98a00192795ca51',
  },
  nominations: [
    {
      id: '6808e05a002d835f188a',
      isWinner: false,
    },
    {
      id: '67ed6b780021510250c7',
      isWinner: false,
    },
    {
      id: '680b738b0023f893fb05',
      isWinner: false,
    },
    {
      id: '67f8b416001c8a14cbb5',
      isWinner: false,
    },
    {
      id: '6811acc3001ebb360048',
      isWinner: false,
    },
  ],
};

const COTMPostCard = ({
  post,
  isWinner = false,
}: {
  post: Models.Document;
  isWinner?: boolean;
}) => {
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const { data: author } = useGetAuthorById(post?.authorId);

  const monthBadgeClasses = `
    absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-medium
    bg-gradient-to-r from-purple-600/90 to-purple-400/90
    text-light-2 border border-purple-500/30
    shadow-sm backdrop-blur-sm
  `;

  const statusBadgeClasses = `
    absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-xs font-medium
    ${
      isWinner
        ? 'bg-gradient-to-r from-yellow-600/90 to-yellow-500/90 border-yellow-400/30 text-yellow-100'
        : 'bg-gradient-to-r from-blue-700/90 to-blue-500/90 border-blue-400/30 text-light-2'
    }
    border shadow-sm backdrop-blur-sm
  `;

  useEffect(() => {
    if (post?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(post.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [post?.mediaUrl]);

  return (
    <div className="rounded-xl border border-light-4 border-opacity-50 bg-dark-3 overflow-hidden flex flex-col h-[320px] snap-center shrink-0 w-[260px] md:w-[320px] relative">
      {/* Top Badges */}
      <div className={monthBadgeClasses}>COTM - APR, 25</div>
      <div className={statusBadgeClasses}>
        {isWinner ? '🏆 Winner' : 'Top 5'}
      </div>

      <Link
        to={`/creations/${post?.$id}`}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex-1 min-h-0">
          {isMediaLoading ? (
            <div className="h-full w-full flex-center">
              <Loader />
            </div>
          ) : (
            <>
              {mediaType === 'image' && (
                <div className="w-full h-full flex-center flex-col">
                  <LazyImage
                    src={post?.mediaUrl}
                    alt="post"
                    className="w-full h-auto object-contain object-center"
                  />
                </div>
              )}
              {mediaType === 'video' && (
                <div className="h-full w-full flex-center">
                  <VideoPlayer videoUrl={post?.mediaUrl[0]} />
                </div>
              )}
              {mediaType === 'audio' && (
                <div className="w-full h-full flex-center flex-col">
                  <LazyImage
                    src="/assets/icons/audio.svg"
                    alt="music"
                    className="h-32 w-32 p-5"
                  />
                  <p className="w-full whitespace-pre-line px-3.5 text-center subtle-comment line-clamp-2 text-light-2 opacity-45 text-pretty">
                    {post?.content}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-3.5 mt-auto z-10">
          <div className="inline-flex items-center gap-2 shadow-md p-2 pl-3.5 pr-4 rounded-full bg-dark-4 bg-opacity-60">
            <LazyImage
              src={author?.dpUrl || '/assets/icons/profile-placeholder.svg'}
              alt={author?.name || 'Creator'}
              className="w-6 h-6 rounded-full object-cover"
            />
            <p className="line-clamp-1 small-medium flex items-center gap-1.5">
              {author?.name || 'Creator'}
              {author?.verifiedUser && (
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
  );
};

const COTMCarousel = () => {
  const cotmPosts = COTM_POSTS.nominations.map((nomination) => ({
    query: useGetCreationById(nomination.id),
    isWinner: nomination.isWinner,
  }));
  const [isLoaded, setIsLoaded] = useState(false);

  // Use useEffect to handle loading state
  useEffect(() => {
    const img = new Image();
    img.src = COTM_POSTS.banner.imageUrl;
    img.onload = () => setIsLoaded(true);
  }, []);

  const bannerCard = (
    <div className="snap-center shrink-0 w-[280px] md:w-[320px] rounded-xl border border-light-4 border-opacity-50 bg-dark-3 overflow-hidden relative group">
      <Link to={`/creations/${COTM_POSTS.banner.id}`}>
        <LazyImage
          src={COTM_POSTS.banner.imageUrl}
          alt="COTM Banner"
          className="w-full h-[320px] object-contain md:object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-3/90 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-4 left-4 right-4">
            <h4 className="text-light-1 h3-bold">Creation of the Month</h4>
            <p className="text-light-2 small-regular mt-2">
              Vote for your favorite creation
            </p>
          </div>
        </div>
      </Link>
    </div>
  );

  const postSet = cotmPosts.map(
    ({ query, isWinner }, index) =>
      query.data && (
        <COTMPostCard
          key={`post-${index}`}
          post={query.data}
          isWinner={isWinner}
        />
      )
  );

  return (
    <div className="cotm-carousel">
      <div
        className={`cotm-scroll-container ${
          isLoaded ? 'cotm-scroll-animation' : ''
        }`}
      >
        {/* First set */}
        <div className="flex gap-6">
          {bannerCard}
          {postSet}
        </div>
        {/* Duplicate set */}
        <div className="flex gap-6">
          {bannerCard}
          {postSet}
        </div>
      </div>
    </div>
  );
};

export default COTMCarousel;
