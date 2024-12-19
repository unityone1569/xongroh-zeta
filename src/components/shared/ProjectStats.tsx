import { Models } from 'appwrite';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCheckPostLike,
  useLikePost,
  useUnlikePost,
  useGetPostLikesCount
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
  const { data: isLiked = false, isLoading: isLikeLoading } = useCheckPostLike(
    projectId,
    userId
  );

  // Mutations
  const { mutateAsync: likePost, isPending: isLiking } = useLikePost();
  const { mutateAsync: unlikePost, isPending: isUnliking } = useUnlikePost();

  // Local states
  const [isLikedState, setIsLikedState] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);

  // Sync with server state
  useEffect(() => {
    if (!isLikeLoading) {
      setIsLikedState(isLiked);
      setLocalLikesCount(likesCount);
    }
  }, [isLiked, likesCount, isLikeLoading]);

  const handleLikeProject = async () => {
    if (!projectId || !userId || !authorId) {
      toast({
        title: 'Error',
        description: 'Missing required information',
      });
      return;
    }
    if (isLiking || isUnliking) return;

    try {
      const newLikeState = !isLikedState;

      // Optimistic update
      setIsLikedState(newLikeState);
      setLocalLikesCount(prev => prev + (newLikeState ? 1 : -1));

      // API call
      if (newLikeState) {
        await likePost({ postId: projectId, userId, authorId });
      } else {
        await unlikePost({ postId: projectId, userId });
      }

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, projectId],
      });

    } catch (error) {
      // Revert optimistic updates
      setIsLikedState(!isLikedState);
      setLocalLikesCount(prev => prev + (isLikedState ? 1 : -1));
      
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="z-20">
      <div className="flex gap-1 items-center">
        <img
          src={isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'}
          alt="like"
          width={25}
          onClick={handleLikeProject}
          className={`cursor-pointer ${
            isLiking || isUnliking ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        {localLikesCount > 0 && (
          <p className="small-semibold lg:base-semibold text-light-3">
            {localLikesCount}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectStats;
