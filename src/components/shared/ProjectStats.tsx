import {
    useCheckPostLike,
    useLikePost,
    useUnlikePost,
  } from '@/lib/react-query/queries';
  import { QUERY_KEYS } from '@/lib/react-query/queryKeys';
  import { Models } from 'appwrite';
  import { toast } from '../ui/use-toast';
  import { useEffect, useState } from 'react';
  import { useQueryClient } from '@tanstack/react-query';
  
  type ProjectStatsProps = {
    project: Models.Document;
    userId: string;
  };
  
  const ProjectStats = ({ project, userId }: ProjectStatsProps) => {
    const { $id: projectId, postType, likesCount } = project;
  
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
  
    useEffect(() => {
      if (!isLikeLoading && isLikedData !== undefined) {
        setIsLikedState(isLikedData);
      }
    }, [isLikedData, isLikeLoading]);
  
    const handleLikeProject = () => {
      const updateLikeCount = () => {
        setInitialLikesCount((prevCount) => prevCount + (isLikedState ? -1 : 1));
  
        if (!isLikedState) {
          setIsLikedState(true);
          likePostMutation(
            { postId: projectId, userId, postType },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: [QUERY_KEYS.GET_POST_BY_ID, projectId, postType],
                });
                toast({ title: 'Post liked!' });
              },
              onError: () => {
                setIsLikedState(false);
                setInitialLikesCount((prevCount) => prevCount - 1); // Revert the count change
                toast({ title: 'Failed to like the post.' });
              },
            }
          );
        } else {
          setIsLikedState(false);
          unlikePostMutation(
            { postId: projectId, userId, postType },
            {
              onSuccess: () => {
                queryClient.invalidateQueries({
                  queryKey: [QUERY_KEYS.GET_POST_BY_ID, projectId, postType],
                });
                toast({ title: 'Post unliked!' });
              },
              onError: () => {
                setIsLikedState(true);
                setInitialLikesCount((prevCount) => prevCount + 1); // Revert the count change
                toast({ title: 'Failed to unlike the post.' });
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
  