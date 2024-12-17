import { useState, useEffect } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { ID, Query } from 'appwrite';
import { Button } from '../ui/button';
import Loader from './Loader';
import { appwriteConfig, databases } from '@/lib/appwrite-apis/config';

// *** APPWRITE ***

// Database
const db = {
  tempsId: appwriteConfig.databases.temps.databaseId,
};

// Collections
const cl = {
  voteId: appwriteConfig.databases.temps.collections.vote,
};

type VoteButtonProps = {
  featureId: string;
};

const VoteButton = ({ featureId }: VoteButtonProps) => {
  const { user } = useUserContext();
  const [likes, setLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [voteId, setVoteId] = useState<string>('');

  useEffect(() => {
    const fetchLikes = async () => {
      setIsFetching(true);
      try {
        const response = await databases.listDocuments(db.tempsId, cl.voteId, [
          Query.equal('featureId', featureId),
        ]);
        setLikes(response.documents.length);

        if (user.id) {
          const userLike = response.documents.find(
            (doc) => doc.userId === user.id
          );
          setHasLiked(!!userLike);
          if (userLike) setVoteId(userLike.$id);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setIsFetching(false);
      }
    };

    fetchLikes();
  }, [featureId, user.id]);

  const handleVoteToggle = async () => {
    if (!user.id) return;

    setIsLoading(true);
    try {
      if (!hasLiked) {
        // Create vote
        const response = await databases.createDocument(
          db.tempsId,
          cl.voteId,
          ID.unique(),
          {
            userId: user.id,
            featureId,
          }
        );
        setVoteId(response.$id);
        setLikes((prev) => prev + 1);
        setHasLiked(true);
      } else {
        // Remove vote
        await databases.deleteDocument(db.tempsId, cl.voteId, voteId);
        setVoteId('');
        setLikes((prev) => prev - 1);
        setHasLiked(false);
      }
    } catch (error) {
      console.error('Error toggling vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <h3 className="pr-5 text-light-3 h4-bold">Upvote</h3>
      <Button
        onClick={handleVoteToggle}
        disabled={isLoading || !user.id}
        className="flex items-center gap-2 shad-button_dark_4"
      >
        {isFetching ? (
          <Loader />
        ) : (
          <>
            {hasLiked ? (
              <img src="/assets/icons/liked.svg" alt="like" width={27} />
            ) : (
              <img src="/assets/icons/like.svg" alt="like" width={27} />
            )}
            <span className="text-sm text-light-3">{likes}</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default VoteButton;
