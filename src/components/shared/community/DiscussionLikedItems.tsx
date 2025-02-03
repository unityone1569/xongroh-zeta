import { Models } from 'appwrite';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useCheckItemLike, 
  useDiscussionItemLike,
  useUnlikeItem,
  useGetItemsLikesCount
} from '@/lib/tanstack-queries/interactionsQueries';

type DiscussionLikedItemsProps = {
  item: Models.Document;
  userId: string;
  authorId: string;
  postId: string;
  itemType: string;
  communityId: string;
};

const DiscussionLikedItems = ({
  item,
  userId,
  authorId,
  postId,
  itemType,
  communityId
}: DiscussionLikedItemsProps) => {
  const { toast } = useToast();
  const { $id: itemId } = item;

  // Queries
  const { data: likesCount = 0 } = useGetItemsLikesCount(itemId);
  const { data: isLiked = false, isLoading: isLikeLoading } = useCheckItemLike(
    itemId,
    userId
  );

  const { mutateAsync: likeItem, isPending: isLiking } = useDiscussionItemLike();
  const { mutateAsync: unlikeItem, isPending: isUnliking } = useUnlikeItem();

  const [isLikedState, setIsLikedState] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);

  // Sync with server state
  useEffect(() => {
    if (!isLikeLoading) {
      setIsLikedState(isLiked);
      setLocalLikesCount(likesCount);
    }
  }, [isLiked, likesCount, isLikeLoading]);

  const handleLikeItem = async () => {
    if (!itemId || !userId || !authorId) {
      toast({
        title: 'Error',
        description: 'Missing required information'
      });
      return;
    }
    if (isLiking || isUnliking) return;

    try {
      const newLikeState = !isLikedState;

      // Optimistic update
      setIsLikedState(newLikeState);
      setLocalLikesCount(prev => prev + (newLikeState ? 1 : -1));

      if (newLikeState) {
        await likeItem({
          itemId,
          userId,
          authorId,
          postId,
          itemType,
          communityId
        });
      } else {
        await unlikeItem({
          itemId,
          userId
        });
      }
    } catch (error) {
      // Revert on error
      setIsLikedState(!isLikedState);
      setLocalLikesCount(prev => prev + (!isLikedState ? 1 : -1));
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="flex gap-1 items-center">
      <img
        src={isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'}
        alt="like"
        width={23}
        onClick={handleLikeItem}
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
  );
};

export default DiscussionLikedItems;