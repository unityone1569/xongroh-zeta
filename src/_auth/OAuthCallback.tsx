import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { getAccount } from '@/lib/appwrite/api';
import { useCreateUserAccountWithGoogle } from '@/lib/react-query/queries';
import Loader from '@/components/shared/Loader';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const createUserMutation = useCreateUserAccountWithGoogle();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const session = await getAccount();

        if (session) {
          await createUserMutation.mutateAsync(session);
          navigate('/');
        } else {
          console.error('No valid session found after OAuth callback');
          // Handle invalid session case (e.g., redirect to login page)
        }
      } catch (error) {
        console.error('Error during OAuth callback:', error);
        // Handle error case (e.g., show error message to user)
      }
    };

    handleOAuthCallback();
  }, [navigate, createUserMutation]);

  return (
    <div>
      <Loader />
    </div>
  );
};

export default OAuthCallback;
