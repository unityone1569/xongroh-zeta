import {
    useCheckSupportingUser,
    useSupport,
    useUnSupport,
  } from '@/lib/react-query/queries';
  import { useEffect, useState } from 'react';
  import { toast } from '../ui/use-toast';
  import { Button } from '../ui/button';
  
  type UserSupportProps = {
    creatorId: string;
    supportingId: string;
  };
  
  const UserSupport = ({ creatorId, supportingId }: UserSupportProps) => {
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
        <Button
          className={`font-semibold ${
            isSupportingState ? 'shad-button_dark_4' : 'shad-button_primary'
          }`}
          onClick={handleSupporting}
          disabled={supportPending || unsupportPending}
        >
          {isSupportLoading ? 'Loading...' : buttonText}
        </Button>
      </div>
    );
  };
  
  export default UserSupport;
  