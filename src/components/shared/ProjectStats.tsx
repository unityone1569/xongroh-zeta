import { Models } from 'appwrite';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCheckPostLike,
  useLikePost,
  useUnlikePost,
} from '@/lib/tanstack-queries/interactionsQueries';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';
import { getUserAccountId } from '@/lib/appwrite-apis/users';

type ProjectStatsProps = {
  project: Models.Document;
  userId: string;
};

const ProjectStats = ({ project, userId }: ProjectStatsProps) => {
  const { toast } = useToast();
  const { $id: projectId, likesCount, authorId } = project;

  const queryClient = useQueryClient();

  const { data: isLikedData, isLoading: isLikeLoading } = useCheckPostLike(
    projectId,
    userId
  );

  const { mutateAsync: likePostMutation, isPending: likePostPending } =
    useLikePost();
  const { mutateAsync: unlikePostMutation, isPending: unlikePostPending } =
    useUnlikePost();

  const [isLikedState, setIsLikedState] = useState<boolean>(false);

  const [initialLikesCount, setInitialLikesCount] =
    useState<number>(likesCount);

  const [accountId, setAccountId] = useState<string>("");

  useEffect(() => {
    if (!isLikeLoading && isLikedData !== undefined) {
      setIsLikedState(isLikedData);
    }
  }, [isLikedData, isLikeLoading]);

  useEffect(() => {
    const fetchAccountId = async () => {
      try {
        const id = await getUserAccountId(authorId);
        setAccountId(id);
      } catch (error) {
        console.error('Error fetching account ID:', error);
      }
    };
    
    fetchAccountId();
  }, [authorId]);

  const handleLikeProject = () => {
    const updateLikeCount = () => {
      setInitialLikesCount((prevCount) => prevCount + (isLikedState ? -1 : 1));

      if (!isLikedState) {
        setIsLikedState(true);
        likePostMutation(
          { postId: projectId, authorId: accountId, userId },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, projectId],
              });
              toast({ title: 'Project liked!' });
            },
            onError: () => {
              setIsLikedState(false);
              setInitialLikesCount((prevCount) => prevCount - 1); // Revert the count change
              toast({ title: 'Failed to like the project.' });
            },
          }
        );
      } else {
        setIsLikedState(false);
        unlikePostMutation(
          { postId: projectId, userId },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_PROJECT_BY_ID, projectId],
              });
              toast({ title: 'Project unliked!' });
            },
            onError: () => {
              setIsLikedState(true);
              setInitialLikesCount((prevCount) => prevCount + 1); // Revert the count change
              toast({ title: 'Failed to unlike the project.' });
            },
          }
        );
      }
    };

    setTimeout(updateLikeCount, 0);
  };

  return (
    <div className=" z-20">
      <div className="flex gap-1 items-center">
        <img
          src={
            isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'
          }
          alt="like"
          width={25}
          onClick={handleLikeProject}
          className={`cursor-pointer ${
            likePostPending || unlikePostPending
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        />
        {initialLikesCount > 0 && (
          <p className="small-semibold lg:base-semibold text-light-3">
            {initialLikesCount}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectStats;
