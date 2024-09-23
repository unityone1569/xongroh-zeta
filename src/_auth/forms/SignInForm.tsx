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
import { useToast } from '@/components/ui/use-toast';
import { SignInValidation } from '@/lib/validation';
import {
  useLoginWithGoogle,
  useSignInAccount,
} from '@/lib/react-query/queries';
import { useUserContext } from '@/context/AuthContext';
import { useState } from 'react';

const SignInForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();

  // Query
  const { mutateAsync: signInAccount, isPending: signInPending } =
    useSignInAccount();
  const { mutateAsync: loginWithGoogle, isPending: googleSignInPending } =
    useLoginWithGoogle();

  const form = useForm<z.infer<typeof SignInValidation>>({
    resolver: zodResolver(SignInValidation),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);

  const handleGoogleSignin = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setIsGoogleSignIn(true);
    await loginWithGoogle();

    const isLoggedIn = await checkAuthUser();

    if (isLoggedIn) {
      form.reset();
      navigate('/');
    } else {
      toast({ title: 'Login failed. Please try again.' });
      return;
    }
    // Reset form after successful Google sign-in
    form.reset();
    setIsGoogleSignIn(false);
  };

  const handleSignin = async (event: React.FormEvent<HTMLFormElement>) => {

    event.preventDefault();
    const result = await form.trigger();
    if (!result) return;

    const { email, password } = form.getValues();
    const session = await signInAccount({ email, password });

    if (!session) {
      toast({ title: 'Login failed. Please try again.' });
      return;
    }

    const isLoggedIn = await checkAuthUser();

    if (isLoggedIn) {
      form.reset();
      navigate('/');
    } else {
      toast({ title: 'Login failed. Please try again.' });
      return;
    }
  };

  const formDisabled = isGoogleSignIn || googleSignInPending;

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img className="h-16" src="/assets/icons/logo.svg" alt="logo" />
        <h2 className="h3-bold md:h2-bold pt-6 sm:pt-8">Login</h2>
        <p className="text-light-3 small-medium md:base-regular my-2">
          Welcome back! Please enter your details.
        </p>
        <form
          onSubmit={handleSignin}
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
          <Link
            to="/forgot-password"
            className="text-light-3 subtle-semibold ml-1"
          >
            Forgot password?
          </Link>

          <Button type="submit" className="shad-button_primary mt-3">
            {signInPending || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              'Sign in'
            )}
          </Button>

          <Button onClick={handleGoogleSignin} className="shad-button_dark_4 ">
            <img className="h-4" src="./assets/icons/google.svg" alt="google" />
            Sign in with Google
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
