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

import { Models } from 'appwrite';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/react-query/queryKeys';
import Loader from './Loader';

type PostStatsProps = {
  post: Models.Document;
  userId: string;
};

const PostStats = ({ post, userId }: PostStatsProps) => {
  const { toast } = useToast();
  const { $id: postId, postType, likesCount } = post;
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleShare = () => {
    const urlToShare = window.location.href;
    const shareText = 'Check out this post from Xongroh!';

    if (navigator.share) {
      navigator
        .share({
          title: 'Creation Post',
          text: shareText,
          url: urlToShare,
        })
        .then(() => toast({ title: 'Content shared successfully!' }))
        .catch(() =>
          toast({ title: 'Error sharing content. Please try again.' })
        );
    } else {
      navigator.clipboard
        .writeText(`${shareText} ${urlToShare}`)
        .then(() => toast({ title: 'Link copied to clipboard!' }))
        .catch(() => toast({ title: 'Error copying text. Please try again.' }));
    }
  };

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
      setInitialLikesCount((prevCount) => prevCount + (isLikedState ? -1 : 1));

      if (!isLikedState) {
        setIsLikedState(true);
        likePostMutation(
          { postId, userId, postType },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
              });
              toast({ title: 'Creation liked!' });
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
          { postId, userId, postType },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, postId, postType],
              });
              toast({ title: 'Creation unliked!' });
            },
            onError: () => {
              setIsLikedState(true);
              setInitialLikesCount((prevCount) => prevCount + 1); // Revert the count change
              toast({ title: 'Failed to unlike the creation.' });
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
            toast({ title: 'Creation saved!' });
          },
          onError: () => {
            setIsSavedState(false);
            toast({ title: 'Failed to save the creation.' });
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
            toast({ title: 'Creation unsaved!' });
          },
          onError: () => {
            setIsSavedState(true);
            toast({ title: 'Failed to unsave the creation.' });
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
      <div className="flex gap-1 items-center">
        <img
          src={
            isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'
          }
          alt="like"
          width={27}
          onClick={handleLikePost}
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

      <div className="flex-center gap-5">
        <div className="flex gap-2">
          {savePostPending || unsavePostPending ? (
            <Loader />
          ) : (
            // Hide save button if post type is portfolioPost OR if user is the creator
            postType !== 'portfolioPost' && userId !== post?.creatorId && (
              <img
                src={
                  isSavedState
                    ? '/assets/icons/saved.svg'
                    : '/assets/icons/save.svg'
                }
                alt="save"
                width={25}
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

export default PostStats;
