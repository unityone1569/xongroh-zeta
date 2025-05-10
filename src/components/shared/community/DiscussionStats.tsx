import { useCallback } from 'react';
import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  useCheckPostLike,
  useCheckPostSave,
  useGetPostLikesCount,
  useGetPostSavesCount,
  useDiscussionLike,
  useDiscussionSave,
  useUnlikePost,
  useUnsavePost,
} from '@/lib/tanstack-queries/interactionsQueries';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';
import {
  useGetPostCommentsCount,
  useGetPostRepliesCount,
} from '@/lib/tanstack-queries/commentsQueries';
import { formatShareDescription, updateMetaTags } from '@/lib/utils/utils';

type DiscussionStatsProps = {
  discussion: Models.Document;
  userId: string;
  authorId: string;
  communityId: string;
};

const DiscussionStats = ({
  discussion,
  userId,
  authorId,
  communityId,
}: DiscussionStatsProps) => {
  const { toast } = useToast();
  const { $id: discussionId } = discussion;
  //  const location = useLocation();
  const queryClient = useQueryClient();

  // Queries
  const { data: commentsCount = 0 } = useGetPostCommentsCount(discussionId);
  const { data: repliesCount = 0 } = useGetPostRepliesCount(discussionId);
  const { data: likesCount = 0 } = useGetPostLikesCount(discussionId);
  const { data: savesCount = 0 } = useGetPostSavesCount(discussionId);
  const { data: isLiked = false } = useCheckPostLike(discussionId, userId);
  const { data: isSaved = false } = useCheckPostSave(discussionId, userId);

  // Mutations
  const { mutateAsync: likeDiscussion, isPending: isLiking } =
    useDiscussionLike();
  const { mutateAsync: unlikePost, isPending: isUnliking } = useUnlikePost();
  const { mutateAsync: saveDiscussion, isPending: isSaving } =
    useDiscussionSave();
  const { mutateAsync: unsavePost, isPending: isUnsaving } = useUnsavePost();

  const handleLike = useCallback(async () => {
    if (!discussionId || !userId || isLiking || isUnliking) return;

    // Optimistic update
    queryClient.setQueryData(
      [QUERY_KEYS.GET_POST_LIKES_COUNT, discussionId],
      (old: number) => (isLiked ? old - 1 : old + 1)
    );
    queryClient.setQueryData(
      [QUERY_KEYS.CHECK_POST_LIKE, discussionId, userId],
      !isLiked
    );

    try {
      if (isLiked) {
        await unlikePost({ postId: discussionId, userId });
      } else {
        await likeDiscussion({ discussionId, authorId, userId, communityId });
      }
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(
        [QUERY_KEYS.GET_POST_LIKES_COUNT, discussionId],
        (old: number) => (isLiked ? old + 1 : old - 1)
      );
      queryClient.setQueryData(
        [QUERY_KEYS.CHECK_POST_LIKE, discussionId, userId],
        isLiked
      );
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  }, [
    discussionId,
    userId,
    authorId,
    communityId,
    isLiked,
    isLiking,
    isUnliking,
    likeDiscussion,
    unlikePost,
    queryClient,
    toast,
  ]);

  const handleSave = useCallback(async () => {
    if (!discussionId || !userId || isSaving || isUnsaving) return;

    // Optimistic update
    queryClient.setQueryData(
      [QUERY_KEYS.GET_POST_SAVES_COUNT, discussionId],
      (old: number) => (isSaved ? old - 1 : old + 1)
    );
    queryClient.setQueryData(
      [QUERY_KEYS.CHECK_POST_SAVE, discussionId, userId],
      !isSaved
    );

    try {
      if (isSaved) {
        await unsavePost({ postId: discussionId, userId });
      } else {
        await saveDiscussion({ discussionId, authorId, userId, communityId });
      }
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(
        [QUERY_KEYS.GET_POST_SAVES_COUNT, discussionId],
        (old: number) => (isSaved ? old + 1 : old - 1)
      );
      queryClient.setQueryData(
        [QUERY_KEYS.CHECK_POST_SAVE, discussionId, userId],
        isSaved
      );
      toast({
        title: 'Error',
        description: 'Failed to update save status',
        variant: 'destructive',
      });
    }
  }, [
    discussionId,
    userId,
    authorId,
    communityId,
    isSaved,
    isSaving,
    isUnsaving,
    saveDiscussion,
    unsavePost,
    queryClient,
    toast,
  ]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/discussions/${discussion?.$id}`;
    const imageUrl =
      discussion?.mediaUrl ||
      'https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/678c96350038d0b750f0/view?project=66e2a98a00192795ca51';
    const description = formatShareDescription(discussion?.content);

    // Update meta tags before sharing
    updateMetaTags('Xongroh Discussion', description, imageUrl, shareUrl);

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Discussion',
          text: description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${description} ${shareUrl}`);
        toast({ title: 'Link copied to clipboard!' });
      }
    } catch (error) {
      toast({ title: 'Error sharing discussion', variant: 'destructive' });
    }
  }, [discussion, toast]);

  return (
    <div className="flex justify-between items-center z-20">
      <div className="flex items-center gap-5">
        <div className="flex gap-1 items-center">
          <img
            src={isLiked ? '/assets/icons/d-liked.svg' : '/assets/icons/d-like.svg'}
            alt="like"
            width={26}
            onClick={handleLike}
            className={`cursor-pointer ${
              isLiking || isUnliking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          />
          {likesCount > 0 && (
            <p className="small-semibold lg:base-semibold text-light-4">
              {likesCount}
            </p>
          )}
        </div>

        <div className="flex gap-1.5 items-center">
          <Link to={`/discussions/${discussion.$id}`}>
            <img
              src="/assets/icons/comment.svg"
              alt="comments"
              width={26}
              className="cursor-pointer"
            />
          </Link>
          {commentsCount + repliesCount > 0 && (
            <p className="small-semibold lg:base-semibold text-light-4">
              {commentsCount + repliesCount}
            </p>
          )}
        </div>
      </div>

      <div className="flex-center gap-5">
        {userId !== discussion?.authorId ? (
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
    </div>
  );
};

export default DiscussionStats;
