import { Models } from 'appwrite';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useCheckItemLike,
  useLikeItem,
  useUnlikeItem,
  useGetItemsLikesCount,
} from '@/lib/tanstack-queries/interactionsQueries';
import { getUserAccountId } from '@/lib/appwrite-apis/users';

type LikedItemsProps = {
  item: Models.Document;
  userId: string;
  authorId: string;
};

const LikedItems = ({ item, userId, authorId }: LikedItemsProps) => {
  const { toast } = useToast();
  const { $id: itemId } = item;

  // Get likes count query
  const { data: likesCountData } = useGetItemsLikesCount(itemId);

  const { data: isLikedData, isLoading: isLikeLoading } = useCheckItemLike(
    itemId,
    userId
  );

  const { mutateAsync: likeItemMutation, isPending: likeItemPending } =
    useLikeItem();
  const { mutateAsync: unlikeItemMutation, isPending: unlikeItemPending } =
    useUnlikeItem();

  const [isLikedState, setIsLikedState] = useState<boolean>(false);
  const [localLikesCount, setLocalLikesCount] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>("");

  // Update local states when data changes
  useEffect(() => {
    if (!isLikeLoading && isLikedData !== undefined) {
      setIsLikedState(isLikedData);
    }
    if (likesCountData !== undefined) {
      setLocalLikesCount(likesCountData);
    }
  }, [isLikedData, isLikeLoading, likesCountData]);

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

  const handleLikeItem = () => {
    if (likeItemPending || unlikeItemPending) return;

    const updateLikeCount = () => {
      setLocalLikesCount((prevCount) => prevCount + (isLikedState ? -1 : 1));

      if (!isLikedState) {
        setIsLikedState(true);
        likeItemMutation(
          { itemId, userId, authorId: accountId },
          {
            onSuccess: () => {
              toast({ title: 'Liked!' });
            },
            onError: () => {
              setIsLikedState(false);
              setLocalLikesCount((prevCount) => prevCount - 1);
              toast({ title: 'Oops, please try again!' });
            },
          }
        );
      } else {
        setIsLikedState(false);
        unlikeItemMutation(
          { itemId, userId },
          {
            onSuccess: () => {
              toast({ title: 'Unliked!' });
            },
            onError: () => {
              setIsLikedState(true);
              setLocalLikesCount((prevCount) => prevCount + 1);
              toast({ title: 'Oops, please try again!' });
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
          width={23}
          onClick={handleLikeItem}
          className={`cursor-pointer ${
            likeItemPending || unlikeItemPending
              ? 'opacity-50 cursor-not-allowed'
              : ''
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
