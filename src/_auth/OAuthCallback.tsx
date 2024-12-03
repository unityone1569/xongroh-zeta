import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useCreateUserAccountWithGoogle } from '@/lib/react-query/queries';
import Loader from '@/components/shared/Loader';
import { useUserContext } from '@/context/AuthContext';
import { getAccount } from '@/lib/appwrite/user';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { mutateAsync: createUserAccountWithGoogle } =
    useCreateUserAccountWithGoogle();
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
    <div className="flex items-center justify-center min-h-screen w-full p-5">
      <div className="max-w-md w-full text-center bg-dark-2 p-8 pb-10 rounded-xl border-[1.5px] border-dark-4 shadow-lg">
        <div className="text-green-500 text-2xl mb-4">Verified ✓</div>
        <p className="text-light-3 pb-6">Redirecting you to the Homepage</p>
        <Loader />
      </div>
    </div>
  );
};

export default OAuthCallback;
