import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCheckPostLike,
  useCheckPostSave,
  useLikePost,
  useSavePost,
  useUnlikePost,
  useUnsavePost,
} from '@/lib/react-query/queries';
import { Loader } from 'lucide-react';
import { Models } from 'appwrite';
import { useLocation } from 'react-router-dom';
import { toast } from '../ui/use-toast';
import { QUERY_KEYS } from '@/lib/react-query/queryKeys';

type PostStatsProps = {
  post: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const { $id: postId, postType, likesCount } = post;
  const location = useLocation();
  const queryClient = useQueryClient();

  const { data: isLikedData, isLoading: isLikeLoading } = useCheckPostLike(
    postId,
    userId
  );
  const { data: isSavedData, isLoading: isSaveLoading } = useCheckPostSave(
    postId,
    userId
  );

  const { mutateAsync: likePostMutation, isPending: likePostPending } =
    useLikePost();
  const { mutateAsync: unlikePostMutation, isPending: unlikePostPending } =
    useUnlikePost();
  const { mutateAsync: savePostMutation, isPending: savePostPending } =
    useSavePost();
  const { mutateAsync: unsavePostMutation, isPending: unsavePostPending } =
    useUnsavePost();

  const [isLikedState, setIsLikedState] = useState<boolean>(false);
  const [isSavedState, setIsSavedState] = useState<boolean>(false);
  const [initialLikesCount, setInitialLikesCount] =
    useState<number>(likesCount);

  useEffect(() => {
    if (!isLikeLoading && isLikedData !== undefined) {
      setIsLikedState(isLikedData);
    }
  }, [isLikedData, isLikeLoading]);

  useEffect(() => {
    if (!isSaveLoading && isSavedData !== undefined) {
      setIsSavedState(isSavedData);
    }
  }, [isSavedData, isSaveLoading]);

  const handleLikePost = () => {
    const updateLikeCount = () => {
      setInitialLikesCount(prevCount => prevCount + (isLikedState ? -1 : 1));
      
      if (!isLikedState) {
        setIsLikedState(true);
        likePostMutation(
          { postId, userId, postType },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
              });
              toast({ title: 'Post liked!' });
            },
            onError: () => {
              setIsLikedState(false);
              setInitialLikesCount(prevCount => prevCount - 1); // Revert the count change
              toast({ title: 'Failed to like the post.' });
            },
          }
        );
      } else {
        setIsLikedState(false);
        unlikePostMutation(
          { postId, userId, postType },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
              });
              toast({ title: 'Post unliked!' });
            },
            onError: () => {
              setIsLikedState(true);
              setInitialLikesCount(prevCount => prevCount + 1); // Revert the count change
              toast({ title: 'Failed to unlike the post.' });
            },
          }
        );
      }
    };

    setTimeout(updateLikeCount, 0);
  };

  const handleSavePost = () => {
    if (savePostPending || unsavePostPending || postType === 'portfolioPost')
      return;

    if (!isSavedState) {
      setIsSavedState(true);
      savePostMutation(
        { postId, userId, postType },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
            });
            toast({ title: 'Post saved!' });
          },
          onError: () => {
            setIsSavedState(false);
            toast({ title: 'Failed to save the post.' });
          },
        }
      );
    } else {
      setIsSavedState(false);
      unsavePostMutation(
        { postId, userId, postType },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
            });
            toast({ title: 'Post unsaved!' });
          },
          onError: () => {
            setIsSavedState(true);
            toast({ title: 'Failed to unsave the post.' });
          },
        }
      );
    }
  };

  const containerStyles = location.pathname.startsWith('/profile')
    ? 'w-full'
    : '';

  return (
    <div
      className={`flex justify-between items-center z-20 ${containerStyles}`}
    >
      <div className="flex gap-2 mr-5">
        <img
          src={
            isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'
          }
          alt="like"
          width={20}
          onClick={handleLikePost}
          className={`cursor-pointer ${
            likePostPending || unlikePostPending
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        />
        <p className="small-medium lg:base-medium">
          {initialLikesCount}
        </p>
      </div>

      <div className="flex gap-2">
        {savePostPending || unsavePostPending ? (
          <Loader />
        ) : (
          postType !== 'portfolioPost' && (
            <img
              src={
                isSavedState
                  ? '/assets/icons/saved.svg'
                  : '/assets/icons/save.svg'
              }
              alt="save"
              width={20}
              onClick={handleSavePost}
              className={`cursor-pointer ${
                savePostPending || unsavePostPending
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            />
          )
        )}
      </div>
    </div>
  );
};

export default PostStats;
