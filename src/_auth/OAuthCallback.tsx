import {
  createUserAccountWithGoogle,
  getAccount,
  checkUserExists,
} from '@/lib/appwrite/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

let isOAuthCallbackProcessing = false; // Global flag to prevent multiple requests

const OAuthCallback = () => {
  const [userCreated, setUserCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (isOAuthCallbackProcessing) return; // Prevent multiple calls
      isOAuthCallbackProcessing = true; // Set flag to true

      try {
        console.log('Starting OAuth callback...');
        const session = await getAccount();
        console.log('Session from getAccount:', session);

        if (session) {
          const existingUser = await checkUserExists(session.email);
          console.log('Existing user check result:', existingUser);

          if (!existingUser) {
            const newUser = await createUserAccountWithGoogle(session);
            console.log('User created successfully:', newUser);
            setUserCreated(true);
          } else {
            console.log('User already exists in the database.');
          }
        }
      } catch (error) {
        console.error('Error during OAuth callback:', error);
      } finally {
        isOAuthCallbackProcessing = false; // Reset flag after execution
        navigate('/'); // Navigate after handling the callback
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div>
      {userCreated ? (
        <p>Account created successfully!</p>
      ) : (
        <p>Processing...</p>
      )}
    </div>
  );
};

export default OAuthCallback;
