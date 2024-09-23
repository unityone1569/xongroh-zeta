import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
import {
  useCreateUserAccount,
  useLoginWithGoogle,
  useCreateUserAccountWithGoogle,
  useSignInAccount,
} from '@/lib/react-query/queries';
import { useUserContext } from '@/context/AuthContext';
import { useState } from 'react';

const SignUpForm = () => {
  const { toast } = useToast();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  const navigate = useNavigate();

  const { mutateAsync: createUserAccount, isPending: isCreatingAccount } =
    useCreateUserAccount();

  const { mutateAsync: loginWithGoogle, isPending: googleSignInPending } =
    useLoginWithGoogle();

  const { mutateAsync: createUserAccountWithGoogle } =
    useCreateUserAccountWithGoogle();
  const { mutateAsync: SignInAccount, isPending: isSigningInUser } =
    useSignInAccount();

  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const [isGoogleSignUp, setIsGoogleSignUp] = useState(false);
  const formDisabled =
    isGoogleSignUp ||
    isCreatingAccount ||
    isUserLoading ||
    googleSignInPending ||
    isSigningInUser;

  const handleSignupWithGoogle = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    setIsGoogleSignUp(true);
    try {
      await loginWithGoogle();
      // await createUserAccountWithGoogle();
      const newUser = await createUserAccountWithGoogle();
      console.log(newUser);

      if (!newUser) throw new Error('Google signup failed');

      const isLoggedIn = await checkAuthUser();
      if (isLoggedIn) navigate('/');
      else throw new Error('User not authenticated after Google sign-in');
    } catch (error) {
      toast({ title: 'Google signup failed. Please try again.' });
    } finally {
      setIsGoogleSignUp(false);
    }
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const values = form.getValues();
    try {
      const newUser = await createUserAccount(values);
      if (!newUser) throw new Error('Signup failed');

      const session = await SignInAccount({
        email: values.email,
        password: values.password,
      });
      if (!session) throw new Error('Sign-in failed');

      const isLoggedIn = await checkAuthUser();
      if (isLoggedIn) {
        form.reset();
        toast({ title: 'Signup successful!', variant: 'success' });
        navigate('/');
      } else {
        throw new Error('Authentication failed after sign-up');
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'message' in error) {
        toast({ title: error.message || 'Sign-up failed, please try again!' });
      } else {
        toast({ title: 'An unexpected error occurred', variant: 'danger' });
      }
    }
  };

  return (
    <Form {...form}>
      <div className="sm:w-420 flex-center flex-col">
        <img className="h-16" src="/assets/icons/logo.svg" alt="logo" />
        <h2 className="h3-bold md:h2-bold pt-6 sm:pt-8">Create account</h2>
        <p className="text-light-3 small-medium md:base-regular mt-2 mb-5">
          This marks a new beginning!
        </p>
        <form
          onSubmit={handleSignup}
          className="flex flex-col gap-5 w-full mt-4"
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
          <Button
            type="submit"
            className="shad-button_primary mt-3"
            disabled={formDisabled}
          >
            {isCreatingAccount || isSigningInUser || isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Signing up...
              </div>
            ) : (
              'Sign up'
            )}
          </Button>
          <Button
            onClick={handleSignupWithGoogle}
            className="shad-button_dark_4"
            disabled={formDisabled}
          >
            {isGoogleSignUp ? (
              <div className="flex-center gap-2">
                <Loader /> Signing up with Google...
              </div>
            ) : (
              <>
                <img
                  className="h-4"
                  src="./assets/icons/google.svg"
                  alt="google"
                />
                Sign up with Google
              </>
            )}
          </Button>
          <p className="small-regular text-light-2 text-center mt-4">
            Already have an account?{' '}
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
