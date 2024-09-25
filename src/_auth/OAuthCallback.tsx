import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useUserContext } from '@/context/AuthContext';
import Loader from '@/components/shared/Loader';
import { getAccount } from '@/lib/appwrite/api';
import { createUserAccountWithGoogle } from '@/lib/appwrite/api';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAuthUser } = useUserContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAuthAndAccountCreation = async () => {
    setIsProcessing(true);

    try {
      // Step 1: Try getting the authenticated user from the context
      let isLoggedIn = await checkAuthUser();

      let session = null;
      if (!isLoggedIn) {
        // Step 2: Fallback to directly checking the Appwrite session (only if not found in context)
        session = await getAccount(); // Get current session from Appwrite
        isLoggedIn = !!session;
      }

      if (!isLoggedIn) {
        throw new Error('User not authenticated after OAuth');
      }

      // Step 3: Avoid extra network requests by passing the session directly
      if (session) {
        // Pass the session directly to avoid fetching it again in `createUserAccountWithGoogle`
        const newUser = await createUserAccountWithGoogle(session);

        if (!newUser) {
          throw new Error('Failed to create user account');
        }
      }

      // Step 4: Navigate to the home page after everything is successful
      navigate('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: 'Authentication or user creation failed. Please try again.',
      });
      navigate('/sign-up');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isProcessing) {
      handleAuthAndAccountCreation(); // Ensure the function only runs once on mount
    }
  }, []); // No dependencies to avoid re-running

  return isProcessing ? <Loader /> : null;
};

export default OAuthCallback;
