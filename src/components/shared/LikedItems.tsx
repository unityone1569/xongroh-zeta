import {
  useCheckItemLike,
  useLikeItem,
  useUnlikeItem,
} from '@/lib/react-query/queries';
import { Models } from 'appwrite';
import { useEffect, useState } from 'react';
import { toast } from '../ui/use-toast';

type LikedItemsProps = {
  item: Models.Document;
  userId: string;
};

const LikedItems = ({ item, userId }: LikedItemsProps) => {
  const { $id: itemId, itemType, likesCount } = item;

  const { data: isLikedData, isLoading: isLikeLoading } = useCheckItemLike(
    itemId,
    userId
  );

  const { mutateAsync: likeItemMutation, isPending: likeItemPending } =
    useLikeItem();
  const { mutateAsync: unlikeItemMutation, isPending: unlikeItemPending } =
    useUnlikeItem();

  const [isLikedState, setIsLikedState] = useState<boolean>(false);

  const [initialLikesCount, setInitialLikesCount] =
    useState<number>(likesCount);

  useEffect(() => {
    if (!isLikeLoading && isLikedData !== undefined) {
      setIsLikedState(isLikedData);
    }
  }, [isLikedData, isLikeLoading]);

  const handleLikeItem = () => {
    const updateLikeCount = () => {
      setInitialLikesCount((prevCount) => prevCount + (isLikedState ? -1 : 1));

      if (!isLikedState) {
        setIsLikedState(true);
        likeItemMutation(
          { itemId, userId, itemType },
          {
            onSuccess: (itemType) => {
              toast({ title: `${itemType}' liked!'` });
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
        unlikeItemMutation(
          { itemId, userId, itemType },
          {
            onSuccess: (itemType) => {
              toast({ title: `${itemType}' unliked!'` });
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
    <div className="z-20">
      <div className="flex gap-1 items-center">
        <img
          src={
            isLikedState ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'
          }
          alt="like"
          width={25}
          onClick={handleLikeItem}
          className={`cursor-pointer ${
            likeItemPending || unlikeItemPending
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

export default LikedItems;
