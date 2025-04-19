import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader';

import { useUserContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { sendVerificationEmail } from '@/lib/appwrite-apis/users';
import { account } from '@/lib/appwrite-apis/config';

const INITIAL_DELAY = 60; // 60 seconds for first 3 attempts
const EXTENDED_DELAY = 120; // 120 seconds for last 2 attempts

const VerifyEmail = () => {
  const { user, isLoading, isAuthenticated, isVerified } = useUserContext();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize attempts and countdown from server
  useEffect(() => {
    const initializeState = async () => {
      try {
        const prefs = await account.getPrefs();
        if (prefs?.verificationAttempts) {
          setAttempts(prefs.verificationAttempts);

          // Calculate remaining countdown if within delay period
          const now = Date.now();
          const lastAttempt = prefs.lastVerificationTime || 0;
          const requiredDelay =
            prefs.verificationAttempts < 3 ? INITIAL_DELAY : EXTENDED_DELAY;

          const elapsed = (now - lastAttempt) / 1000;
          if (elapsed < requiredDelay) {
            setCountdown(Math.ceil(requiredDelay - elapsed));
          }
        }
      } catch (error) {
        console.error('Error initializing state:', error);
      }
    };

    initializeState();
  }, []);

  // Add countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]); // Only re-run effect when countdown changes

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
    return <Navigate to="/home" replace />;
  }

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setError(null);
    setIsResending(true);
    try {
      await sendVerificationEmail();

      // Update local state
      const newCountdown = attempts < 3 ? INITIAL_DELAY : EXTENDED_DELAY;
      setCountdown(newCountdown);
      setAttempts((prev) => prev + 1);

      toast({
        title: 'Verification email sent!',
        description: 'Please check your inbox',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to send verification email';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-5">
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

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

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

          <div className="mt-11 text-center">
            <p className="text-light-3 small-regular mb-2">
              Didn't receive any email?
            </p>
            <a
              href="https://api.whatsapp.com/send/?phone=919127510087&text=I+need+help"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 subtle-semibold hover:underline"
            >
              Contact us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
