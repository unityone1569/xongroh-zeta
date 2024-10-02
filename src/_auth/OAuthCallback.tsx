import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAccount } from '@/lib/appwrite/api';
import { useCreateUserAccountWithGoogle } from '@/lib/react-query/queries';
import Loader from '@/components/shared/Loader';
import { useUserContext } from '@/context/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { mutateAsync: createUserAccountWithGoogle } = useCreateUserAccountWithGoogle();
  const { checkAuthUser } = useUserContext();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const session = await getAccount();

        if (!session) {
          console.error('No valid session found after OAuth callback');
          return;
        }

        await createUserAccountWithGoogle(session);
        const isLoggedIn = await checkAuthUser();

        if (isLoggedIn) {
          navigate('/');
        } else {
          throw new Error('Authentication failed after sign-up');
        }
      } catch (error) {
        console.error('Error during OAuth callback:', error);
        // Optional: Handle error (e.g., show an error message)
      }
    };

    handleOAuthCallback();
  }, [navigate, createUserAccountWithGoogle, checkAuthUser]);

  return (
    <div>
      <Loader />
    </div>
  );
};

export default OAuthCallback;
