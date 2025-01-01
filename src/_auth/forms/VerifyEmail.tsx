import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader';

import { useUserContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { sendVerificationEmail } from '@/lib/appwrite-apis/users';

const VerifyEmail = () => {
  const { user, isLoading, isAuthenticated, isVerified } = useUserContext();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  // Handle countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((count) => count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Show loader while checking auth status
  if (isLoading) {
    return (
      <div className="flex-center w-full min-h-screen">
        <Loader />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // Redirect if already verified
  if (isVerified) {
    return <Navigate to="/" replace />;
  }

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      await sendVerificationEmail();
      toast({ title: 'Verification email sent!' });

      // Calculate exponential countdown: 60 * 2^attempts
      const newCountdown = 60 * Math.pow(2, attempts);
      setCountdown(newCountdown);
      setAttempts((prev) => prev + 1);
    } catch (error) {
      toast({
        title: 'Failed to send verification email',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-5 ">
      <div className="max-w-md w-full bg-dark-2 p-8 pb-10 rounded-xl border-[1.5px] border-dark-4 shadow-lg">
        <div className="flex-col flex-center space-y-8 text-center">
          <img
            className="h-16 w-16"
            src="/assets/icons/logo.svg"
            alt="Email Verified"
          />
          <h2 className="h3-bold md:h2-bold text-light-1">Verify Your Email</h2>
          {user?.email ? (
            <>
              <p className="text-light-3">
                Please check your email inbox and click the verification link to
                activate your account.
              </p>
              <p className="text-light-3">
                We have sent a verification link to:
                <span className="font-sm text-light-2 pl-1">{user.email}</span>
              </p>
            </>
          ) : (
            <p className="text-light-3">
              Please check your email inbox for the verification link.
            </p>
          )}

          <span className="text-sm text-gray-600">
            If you don't see it, check your{' '}
            <span className="font-semibold text-gray-500">spam folder</span> and
            mark the email as{' '}
            <span className="font-semibold text-gray-500">"Not Spam"</span>.
          </span>

          <Button
            onClick={handleResendEmail}
            disabled={isResending || countdown > 0}
            className="shad-button_primary"
          >
            {isResending ? (
              <Loader />
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Verification Email'
            )}
          </Button>

          <div className="mt-9 text-center">
            <p className="text-light-3 mb-2">Still need help?</p>
            <a
              href="https://api.whatsapp.com/send/?phone=919127510087&text=I+need+help"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:underline"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
