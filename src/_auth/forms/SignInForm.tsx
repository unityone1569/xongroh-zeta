import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loader from '@/components/shared/Loader';
import { useToast } from '@/hooks/use-toast';
import { SignInValidation } from '@/lib/validation';
import { useUserContext } from '@/context/AuthContext';
import { useState } from 'react';
import {
  useLoginWithGoogle,
  useSignInAccount,
} from '@/lib/tanstack-queries/usersQueries';

const SignInForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  // Queries
  const { mutateAsync: signInAccount, isPending: isSigningInUser } =
    useSignInAccount();
  const { mutateAsync: loginWithGoogle } = useLoginWithGoogle();

  const form = useForm<z.infer<typeof SignInValidation>>({
    resolver: zodResolver(SignInValidation),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const formDisabled = isGoogleSignIn || isUserLoading || isSigningInUser;

  const handleGoogleSignin = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setIsGoogleSignIn(true);

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

  const handleSignin = async (user: z.infer<typeof SignInValidation>) => {
    try {
      const session = await signInAccount(user);

      if (!session) {
        toast({ title: 'Login failed. Please try again.' });
        return;
      }

      const isLoggedIn = await checkAuthUser();

      if (isLoggedIn) {
        form.reset();
        toast({ title: 'Signin successful!' });
        navigate('/home');
      } else {
        throw new Error('Authentication failed after sign-in');
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'message' in error) {
        toast({ title: error.message || 'Sign-in failed, please try again!' });
      } else {
        toast({
          title: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Form {...form}>
      <div className=" py-16 w-80 sm:w-420 flex-col overflow-y-auto p-4 no-scrollbar">
        <div className="flex-center flex-col">
          <img className="h-14" src="/assets/icons/logo.svg" alt="logo" />
          <h2 className="h3-bold md:h2-bold pt-6 sm:pt-8">Login</h2>
          <p className="text-light-3 small-medium md:base-regular my-2">
            Welcome back! Please enter your details.
          </p>
        </div>
        <form
          onSubmit={form.handleSubmit(handleSignin)}
          className="flex flex-col gap-5 w-full mt-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="shad-form_label">Email</FormLabel>
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
          {/* forgot password (implementation pending) */}
          <Link
            to="/reset-password"
            className="text-light-3 subtle-semibold ml-1"
          >
            Forgot password?
          </Link>

          <Button
            type="submit"
            className="shad-button_primary mt-3"
            disabled={formDisabled}
          >
            {isSigningInUser || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader />
              </div>
            ) : (
              'Sign in'
            )}
          </Button>

          <div className="flex items-center my-4">
            <hr className="w-full border-t-1 border-light-4" />
            <span className="px-2 text-light-3 subtle-semibold ml-1">Or</span>
            <hr className="w-full border-t-1 border-light-4" />
          </div>

          <Button
            onClick={handleGoogleSignin}
            className="shad-button_dark_4"
            disabled={formDisabled}
          >
            {isGoogleSignIn ? (
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
            Don&apos;t have an account?
            <Link
              to="/sign-up"
              className="text-primary-500 small-semibold ml-1"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SignInForm;
