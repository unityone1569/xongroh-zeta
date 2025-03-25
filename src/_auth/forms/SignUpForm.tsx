import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SignUpFormSchema } from '@/lib/validation';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Loader from '@/components/shared/Loader';
import { Link, useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';

import { useState } from 'react';
import { useUserContext } from '@/context/AuthContext';
import {
  useCreateUserAccount,
  useLoginWithGoogle,
  useGetTopCreators,
} from '@/lib/tanstack-queries/usersQueries';

const SignUpForm = () => {
  const { toast } = useToast();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const navigate = useNavigate();

  // Queries
  const { mutateAsync: createUserAccount, isPending: isCreatingAccount } =
    useCreateUserAccount();
  const { mutateAsync: loginWithGoogle } = useLoginWithGoogle();
  const { data: creators } = useGetTopCreators();
  // const { mutateAsync: SignInAccount, isPending: isSigningInUser } =
  //   useSignInAccount();

  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: { name: '', hometown: '', email: '', password: '' },
  });

  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  const formDisabled = isGoogleSignUp || isCreatingAccount || isUserLoading;

  const handleSignupWithGoogle = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    if (!termsAccepted) {
      setShowTermsError(true);
      return;
    }

    setIsGoogleSignUp(true);

    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Google OAuth failed:', error);
      toast({ title: 'Google sign-up failed. Please try again.' });
    } finally {
      form.reset();
      // setIsGoogleSignUp(false);
    }
  };

  // Add console logging for form state
  // console.log('Form State:', form.formState);
  // console.log('Form Errors:', form.formState.errors);

  const handleSignup = async (user: z.infer<typeof SignUpFormSchema>) => {
    if (!termsAccepted) {
      setShowTermsError(true);
      return; // Stop form submission here
    }
    // console.log('Form Submission Triggered with data:', user);
    try {
      // Create user account
      const newUser = await createUserAccount(user);
      if (!newUser) throw new Error('Signup failed');

      // Sign in after signup
      // const session = await SignInAccount({
      //   email: user.email,
      //   password: user.password,
      // });
      // if (!session) throw new Error('Sign-in failed');

      // Navigate directly to verify-email without signing in

      const isLoggedIn = await checkAuthUser();
      if (isLoggedIn) {
        toast({
          title: 'Account created successfully!',
          description: 'Please check your email to verify your account.',
        });
        form.reset();
        navigate('/verify-email', { replace: true });
      } else {
        throw new Error('Authentication failed after sign-up');
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'message' in error) {
        toast({ title: error.message || 'Sign-up failed, please try again!' });
      } else {
        toast({
          title: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  const totalSpots = 500;
  const takenSpots = creators?.total || 0;
  const remainingSpots = Math.max(0, totalSpots - takenSpots);

  return (
    <Form {...form}>
      <div className="py-16 w-80 sm:w-420 flex-col overflow-y-auto p-4 no-scrollbar">
        <div className="flex-center flex-col">
          <Link to="/">
            <img className="h-14" src="/assets/icons/logo.svg" alt="logo" />
          </Link>
          <h2 className="h3-bold md:h2-bold pt-6 sm:pt-8">Create account</h2>
          <p className="text-light-3 small-medium md:base-regular mt-2">
            A fresh journey is just getting underway!
          </p>
        </div>

        {/* Founding Creator Section */}
        <div className="flex flex-col items-center gap-4 my-9 bg-dark-3 p-6 rounded-xl border-light-4 border">
          <div className="flex flex-col items-center gap-2">
            <p className="h4-bold text-center pb-3">
              Only <span className="text-primary-500">{remainingSpots}</span>{' '}
              spots left!
            </p>
            <div className="w-full max-w-xs bg-dark-4 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (takenSpots / totalSpots) * 100)}%`,
                }}
              />
            </div>
            <p className="text-light-3 text-sm text-center">
              {takenSpots} of {totalSpots}{' '}
              <span className="font-bold">Founding Creator Badges</span> claimed
              already!
            </p>
          </div>
          <p className="text-light-2 text-center text-sm">
            Don't miss your chance to be an OG and unlock{' '}
            <Link
              to="/badges/B9001"
              className="text-primary-500 underline underline-offset-4 md:no-underline md:hover:underline"
            >
              Exclusive Perks!
            </Link>
          </p>
        </div>

        <form
          onSubmit={(e) => {
            if (!termsAccepted) {
              e.preventDefault();
              setShowTermsError(true);
              return;
            }
            form.handleSubmit(handleSignup)(e);
          }}
          className="flex flex-col gap-5 w-full  mt-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Name</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    disabled={formDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hometown"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Hometown</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    className="shad-input"
                    {...field}
                    disabled={formDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    className="shad-input"
                    {...field}
                    disabled={formDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="shad-input"
                    {...field}
                    disabled={formDisabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-3.5 mt-2">
            <div className="flex items-start space-x-3.5">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => {
                  setTermsAccepted(checked as boolean);
                  if (checked) setShowTermsError(false);
                }}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agreed to the{' '}
                <a
                  href="/privacy"
                  className="text-primary-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                ,{' '}
                <a
                  href="/terms"
                  className="text-primary-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/guidelines"
                  className="text-primary-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Community Guidelines
                </a>
                .
              </label>
            </div>

            {showTermsError && (
              <div className="text-red text-sm">
                Please accept the user agreements to continue
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="shad-button_primary mt-3"
            disabled={formDisabled}
          >
            {isCreatingAccount || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader />
              </div>
            ) : (
              'Sign up'
            )}
          </Button>

          <div className="flex items-center my-4">
            <hr className="w-full border-t-1 border-light-4" />
            <span className="px-2 text-light-3 subtle-semibold ml-1">Or</span>
            <hr className="w-full border-t-1 border-light-4" />
          </div>

          <Button
            onClick={handleSignupWithGoogle}
            className="shad-button_dark_4"
            disabled={formDisabled}
          >
            {isGoogleSignUp ? (
              <div className="flex-center gap-2">
                <Loader />
              </div>
            ) : (
              <>
                <img
                  className="h-4"
                  src="./assets/icons/google.svg"
                  alt="google"
                />
                Continue with Google
              </>
            )}
          </Button>
          <p className="small-regular text-light-2 text-center mt-4">
            Already have an account?
            <Link
              to="/sign-in"
              className="text-primary-500 small-semibold ml-1"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignUpForm;
