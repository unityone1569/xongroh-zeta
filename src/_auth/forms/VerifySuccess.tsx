import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

import { useUserContext } from '@/context/AuthContext';

import Loader from '@/components/shared/Loader';
import { verifyEmail } from '@/lib/appwrite/user';

const VerifySuccess = () => {
  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuthUser } = useUserContext();

  useEffect(() => {
    const confirmVerification = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(location.search);
        const userId = params.get('userId');
        const secret = params.get('secret');

        if (!userId || !secret) {
          throw new Error('Invalid verification link');
        }

        // Verify email
        const verified = await verifyEmail(userId, secret);

        if (!verified) {
          throw new Error('Verification failed');
        }

        // Update auth context
        await checkAuthUser();

        setVerificationStatus('success');
        toast({
          title: 'Email verified successfully!',
          description: 'Redirecting to homepage...',
        });

        // Redirect to home after success
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        toast({
          title: 'Verification failed',
          description: 'Please try again or request a new verification link',
          variant: 'destructive',
        });

        // Redirect to verify-email page after error
        setTimeout(() => navigate('/verify-email'), 2000);
      }
    };

    confirmVerification();
  }, [navigate, location, toast, checkAuthUser]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader />
            <p className="mt-4 text-light-2">Verifying your email...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <div className="text-green-500 text-2xl mb-4">✓</div>
            <h2 className="text-xl font-semibold text-light-2 mb-2">
              Email Verified!
            </h2>
            <p className="text-light-3">Redirecting you to the Homepage...</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <div className="text-red text-2xl mb-4">⚠</div>
            <h2 className="text-xl font-semibold text-light-2 mb-2">
              Verification Failed
            </h2>
            <p className="text-light-3">Redirecting...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-5">
      <div className="max-w-md w-full bg-dark-2 p-8 pb-10 rounded-xl border-[1.5px] border-dark-4 shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default VerifySuccess;
