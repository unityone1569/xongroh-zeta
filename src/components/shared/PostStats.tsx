import { useCallback, useState } from 'react';
import { Models } from 'appwrite';
import { useLocation, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  useCheckPostLike,
  useCheckPostSave,
  useLikePost,
  useSavePost,
  useUnlikePost,
  useUnsavePost,
  useGetPostLikesCount,
  useGetPostSavesCount,
} from '@/lib/tanstack-queries/interactionsQueries';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';
import {
  useGetPostCommentsCount,
  useGetPostFeedbacksCount,
} from '@/lib/tanstack-queries/commentsQueries';
import { formatShareDescription, updateMetaTags } from '@/lib/utils/utils';
import LikesPopup from './LikesPopup';

type PostStatsProps = {
  post: Models.Document;
  userId: string;
  authorId: string;
};

const PostStats = ({ post, userId, authorId }: PostStatsProps) => {
  const { toast } = useToast();
  const { $id: postId } = post;
  const location = useLocation();
  const queryClient = useQueryClient();
  const isHomeRoute = location.pathname === '/home';
  const isProfileRoute = location.pathname.includes('/profile/');

  const [showLikesPopup, setShowLikesPopup] = useState(false);

  // Queries
  const { data: feedbacksCount = 0 } = useGetPostFeedbacksCount(post?.$id);
  const { data: commentsData } = useGetPostCommentsCount(postId);
  const totalCommentsCount = commentsData?.totalCount || 0;
  const { data: likesCount = 0 } = useGetPostLikesCount(postId);
  const { data: savesCount = 0 } = useGetPostSavesCount(postId);
  const { data: isLiked = false } = useCheckPostLike(postId, userId);
  const { data: isSaved = false } = useCheckPostSave(postId, userId);

  // Mutations
  const { mutateAsync: likePost, isPending: isLiking } = useLikePost();
  const { mutateAsync: unlikePost, isPending: isUnliking } = useUnlikePost();
  const { mutateAsync: savePost, isPending: isSaving } = useSavePost();
  const { mutateAsync: unsavePost, isPending: isUnsaving } = useUnsavePost();

  const handleLike = useCallback(async () => {
    if (!postId || !userId || isLiking || isUnliking) return;

    // Optimistic update
    queryClient.setQueryData(
      [QUERY_KEYS.GET_POST_LIKES_COUNT, postId],
      (old: number) => (isLiked ? old - 1 : old + 1)
    );
    queryClient.setQueryData(
      [QUERY_KEYS.CHECK_POST_LIKE, postId, userId],
      !isLiked
    );

    try {
      if (isLiked) {
        await unlikePost({ postId, userId });
      } else {
        await likePost({ postId, authorId, userId, postType: 'creation' });
      }
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(
        [QUERY_KEYS.GET_POST_LIKES_COUNT, postId],
        (old: number) => (isLiked ? old + 1 : old - 1)
      );
      queryClient.setQueryData(
        [QUERY_KEYS.CHECK_POST_LIKE, postId, userId],
        isLiked
      );
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  }, [
    postId,
    userId,
    authorId,
    isLiked,
    isLiking,
    isUnliking,
    likePost,
    unlikePost,
    queryClient,
    toast,
  ]);

  const handleSave = useCallback(async () => {
    if (!postId || !userId || isSaving || isUnsaving) return;

    // Optimistic update
    queryClient.setQueryData(
      [QUERY_KEYS.GET_POST_SAVES_COUNT, postId],
      (old: number) => (isSaved ? old - 1 : old + 1)
    );
    queryClient.setQueryData(
      [QUERY_KEYS.CHECK_POST_SAVE, postId, userId],
      !isSaved
    );

    try {
      if (isSaved) {
        await unsavePost({ postId, userId });
      } else {
        await savePost({ postId, authorId, userId });
      }
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(
        [QUERY_KEYS.GET_POST_SAVES_COUNT, postId],
        (old: number) => (isSaved ? old + 1 : old - 1)
      );
      queryClient.setQueryData(
        [QUERY_KEYS.CHECK_POST_SAVE, postId, userId],
        isSaved
      );
      toast({
        title: 'Error',
        description: 'Failed to update save status',
        variant: 'destructive',
      });
    }
  }, [
    postId,
    userId,
    authorId,
    isSaved,
    isSaving,
    isUnsaving,
    savePost,
    unsavePost,
    queryClient,
    toast,
  ]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/creations/${post?.$id}`;
    const imageUrl =
      post?.mediaUrl ||
      'https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/678c96350038d0b750f0/view?project=66e2a98a00192795ca51';
    const description = formatShareDescription(post?.content);

    // Update meta tags before sharing
    updateMetaTags('Xongroh Creation', description, imageUrl, shareUrl);

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Creation',
          text: description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${description} ${shareUrl}`);
        toast({ title: 'Link copied to clipboard!' });
      }
    } catch (error) {
      toast({ title: 'Error sharing creation', variant: 'destructive' });
    }
  }, [post, toast]);

  return (
    <div
      className={`flex justify-between items-center z-20 ${
        isProfileRoute ? 'w-full' : ''
      }`}
    >
      <div className="flex items-center gap-5">
        <div className="flex gap-1 items-center">
          <img
            src={isLiked ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'}
            alt="like"
            width={33}
            onClick={handleLike}
            className={`cursor-pointer ${
              isLiking || isUnliking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />

          {likesCount > 0 && (
            <button
              onClick={() => setShowLikesPopup(true)}
              className="small-semibold lg:base-semibold text-light-4 hover:text-light-2 transition-colors"
            >
              {likesCount}
            </button>
          )}
        </div>

        {(isHomeRoute || isProfileRoute) && (
          <div className="flex gap-1.5 items-center">
            <Link to={`/creations/${post.$id}`}>
              <img
                src="/assets/icons/comment.svg"
                alt="comments"
                width={26}
                className="cursor-pointer"
              />
            </Link>
            {totalCommentsCount > 0 && (
              <p className="small-semibold lg:base-semibold text-light-4">
                {totalCommentsCount}
              </p>
            )}
          </div>
        )}

        {(isHomeRoute || isProfileRoute) && userId === post?.authorId && (
          <div className="flex gap-1.5 items-center">
            <Link to={`/creations/${post.$id}`}>
              <img
                src="/assets/icons/feedback.svg"
                alt="feedbacks"
                width={26}
                className="cursor-pointer"
              />
            </Link>
            {feedbacksCount > 0 && (
              <p className="small-semibold lg:base-semibold text-light-4">
                {feedbacksCount}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex-center gap-5">
        {userId !== post?.authorId ? (
          <div className="flex gap-1.5">
            <img
              src={
                isSaved ? '/assets/icons/saved.svg' : '/assets/icons/save.svg'
              }
              alt="save"
              width={25}
              onClick={handleSave}
              className={`cursor-pointer ${
                isSaving || isUnsaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            {savesCount > 0 && (
              <p className="small-semibold lg:base-semibold text-light-4 pt-0.5">
                {savesCount}
              </p>
            )}
          </div>
        ) : (
          <>
            {savesCount > 0 && (
              <div className="flex gap-2">
                <img src="/assets/icons/save.svg" alt="save" width={25} />
                <p className="small-semibold lg:base-semibold text-light-3 pt-0.5">
                  {savesCount}
                </p>
              </div>
            )}
          </>
        )}
        <img
          src="/assets/icons/share.svg"
          alt="share"
          width={26}
          onClick={handleShare}
          className="cursor-pointer"
        />
      </div>

      <LikesPopup
        postId={postId}
        isOpen={showLikesPopup}
        onClose={() => setShowLikesPopup(false)}
        likesCount={likesCount}
      />
    </div>
  );
};

export default PostStats;
