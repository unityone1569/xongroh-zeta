import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import {
  useCheckSupportingUser,
  useSupport,
  useUnSupport,
} from '@/lib/tanstack-queries/usersQueries';
import Loader from './Loader'; // Add this import

type UserSupportProps = {
  creatorId: string;
  supportingId: string;
  variant?: 'default' | 'small';
};

const UserSupport = ({
  creatorId,
  supportingId,
  variant = 'default',
}: UserSupportProps) => {
  const { toast } = useToast();
  const { data: isSupporting, isLoading: isSupportLoading } =
    useCheckSupportingUser(creatorId, supportingId);

  const { mutateAsync: supportMutation, isPending: supportPending } =
    useSupport();
  const { mutateAsync: unsupportMutation, isPending: unsupportPending } =
    useUnSupport();

  const [isSupportingState, setIsSupportingState] = useState<boolean>(false);

  // Update state when data is fetched
  useEffect(() => {
    if (!isSupportLoading && isSupporting !== undefined) {
      setIsSupportingState(isSupporting);
    }
  }, [isSupporting, isSupportLoading]);

  const handleSupporting = async () => {
    if (supportPending || unsupportPending) return; // Prevent duplicate clicks

    if (!isSupportingState) {
      // Optimistic update for supporting
      setIsSupportingState(true);
      try {
        await supportMutation({ creatorId, supportingId });
        toast({ title: 'You are now supporting the creator!' });
      } catch (error) {
        setIsSupportingState(false); // Revert on failure
        toast({ title: 'Failed to support the creator.' });
      }
    } else {
      // Optimistic update for unsupporting
      setIsSupportingState(false);
      try {
        await unsupportMutation({ creatorId, supportingId });
        toast({ title: 'You have stopped supporting the creator.' });
      } catch (error) {
        setIsSupportingState(true); // Revert on failure
        toast({ title: 'Failed to unsupport the creator.' });
      }
    }
  };

  const buttonText = isSupportingState ? 'Supporting' : 'Support';

  return (
    <div>
      {variant === 'default' ? (
        <Button
          className={`font-semibold ${
            isSupportingState ? 'shad-button_dark_4' : 'shad-button_primary'
          }`}
          onClick={handleSupporting}
          disabled={supportPending || unsupportPending}
        >
          {isSupportLoading ? <Loader size="sm" /> : buttonText}
        </Button>
      ) : (
        <button
          onClick={handleSupporting}
          disabled={supportPending || unsupportPending}
          className={`px-3 py-1.5 tiny-medium rounded-full transition-all flex items-center justify-center
            ${
              isSupportingState
                ? 'bg-dark-4 text-light-1 hover:bg-dark-4/80 border border-light-4 border-opacity-50'
                : 'bg-gradient-to-r from-purple-500 to-purple-400 hover:bg-violet-600 text-light-1 border border-light-2 border-opacity-50'
            }`}
        >
          {isSupportLoading ? <Loader size="sm" /> : buttonText}
        </button>
      )}
    </div>
  );
};

export default UserSupport;
