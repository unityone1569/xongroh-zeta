import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader';
import { useToast } from '@/components/ui/use-toast';
import { sendVerificationEmail } from '@/lib/appwrite/user';

const VerifyEmail = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((count) => count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await sendVerificationEmail();
      toast({ title: 'Verification email sent!' });
      setCountdown(60); // Start 60 second countdown
    } catch (error) {
      toast({
        title: 'Failed to send verification email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex  items-center justify-center min-h-screen p-4">
      <div className="max-w-md flex-col w-full flex-center space-y-8 text-center">
        <h2 className="h3-bold md:h2-bold">Verify Your Email</h2>
        <p className="text-light-3">
          Please check your email inbox and click the verification link to
          activate your account.
        </p>

        <Button
          onClick={handleResendEmail}
          disabled={isLoading || countdown > 0}
          className="shad-button_primary mt-4"
        >
          {isLoading ? (
            <Loader />
          ) : countdown > 0 ? (
            `Resend in ${countdown}s`
          ) : (
            'Resend Verification Email'
          )}
        </Button>
      </div>
    </div>
  );
};

export default VerifyEmail;
