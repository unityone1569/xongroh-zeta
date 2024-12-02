import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { account } from '@/lib/appwrite/config';
import Loader from '@/components/shared/Loader';

const VerifySuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const confirmVerification = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const userId = urlParams.get('userId');
        const secret = urlParams.get('secret');

        if (!userId || !secret) {
          throw new Error('Invalid verification link');
        }

        await account.updateVerification(userId, secret);
        
        toast({ 
          title: "Email verified successfully!",
          variant: "default"
        });
        
        // Small delay before redirect
        setTimeout(() => navigate('/'), 1500);
      } catch (error) {
        console.error('Verification error:', error);
        toast({ 
          title: "Verification failed",
          description: "Please try again or request a new verification link",
          variant: "destructive"
        });
        navigate('/verify-email');
      } finally {
        setIsVerifying(false);
      }
    };

    confirmVerification();
  }, [navigate, location, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {isVerifying ? (
        <div className="text-center">
          <Loader />
          <p className="mt-4">Verifying your email...</p>
        </div>
      ) : null}
    </div>
  );
};

export default VerifySuccess;