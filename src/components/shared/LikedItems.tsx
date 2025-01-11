import { Models } from 'appwrite';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useCheckItemLike,
  useLikeItem,
  useUnlikeItem,
  useGetItemsLikesCount,
} from '@/lib/tanstack-queries/interactionsQueries';

type LikedItemsProps = {
  item: Models.Document;
  userId: string;
  authorId: string;
  postId: string;
  itemType: string;
};

const LikedItems = ({
  item,
  userId,
  authorId,
  postId,
  itemType,
}: LikedItemsProps) => {
  const { toast } = useToast();
  const { $id: itemId } = item;

  // Queries
  const { data: likesCount = 0 } = useGetItemsLikesCount(itemId);
  const { data: isLiked = false, isLoading: isLikeLoading } = useCheckItemLike(
    itemId,
    userId
  );

  const { mutateAsync: likeItem, isPending: isLiking } = useLikeItem();
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
        description: 'Missing required information',
      });
      return;
    }
    if (isLiking || isUnliking) return;

    try {
      const newLikeState = !isLikedState;

      // API call with validation
      if (newLikeState) {
        await likeItem({
          itemId,
          userId,
          authorId,
          postId,
          itemType,
        });
      } else {
        await unlikeItem({
          itemId,
          userId,
        });
      }

      setIsLikedState(newLikeState);
      setLocalLikesCount((prev) => prev + (newLikeState ? 1 : -1));
    } catch (error) {
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
          src={
            isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'
          }
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
    </div>
  );
};

export default LikedItems;
