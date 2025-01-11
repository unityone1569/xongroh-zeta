import { useCallback } from 'react';
import { Models } from 'appwrite';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCheckPostLike,
  useLikePost,
  useUnlikePost,
  useGetPostLikesCount,
} from '@/lib/tanstack-queries/interactionsQueries';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';

type ProjectStatsProps = {
  project: Models.Document;
  userId: string;
  authorId: string;
};

const ProjectStats = ({ project, userId, authorId }: ProjectStatsProps) => {
  const { toast } = useToast();
  const { $id: projectId } = project;
  const queryClient = useQueryClient();

  // Queries
  const { data: likesCount = 0 } = useGetPostLikesCount(projectId);
  const { data: isLiked = false } = useCheckPostLike(projectId, userId);

  // Mutations
  const { mutateAsync: likePost, isPending: isLiking } = useLikePost();
  const { mutateAsync: unlikePost, isPending: isUnliking } = useUnlikePost();

  const handleLikeProject = useCallback(async () => {
    if (!projectId || !userId || isLiking || isUnliking) return;

    // Optimistic update
    queryClient.setQueryData(
      [QUERY_KEYS.GET_POST_LIKES_COUNT, projectId],
      (old: number) => (isLiked ? old - 1 : old + 1)
    );
    queryClient.setQueryData(
      [QUERY_KEYS.CHECK_POST_LIKE, projectId, userId],
      !isLiked
    );

    try {
      if (isLiked) {
        await unlikePost({ postId: projectId, userId });
      } else {
        await likePost({
          postId: projectId,
          authorId,
          userId,
          postType: 'project',
        });
      }
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(
        [QUERY_KEYS.GET_POST_LIKES_COUNT, projectId],
        (old: number) => (isLiked ? old + 1 : old - 1)
      );
      queryClient.setQueryData(
        [QUERY_KEYS.CHECK_POST_LIKE, projectId, userId],
        isLiked
      );
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  }, [
    projectId,
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

  return (
    <div className="z-20">
      <div className="flex gap-1 items-center">
        <img
          src={isLiked ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'}
          alt="like"
          width={25}
          onClick={handleLikeProject}
          className={`cursor-pointer ${
            isLiking || isUnliking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {likesCount > 0 && (
          <p className="small-semibold lg:base-semibold text-light-3">
            {likesCount}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectStats;
