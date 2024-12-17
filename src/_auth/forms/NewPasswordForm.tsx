import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import { NewPasswordValidation } from '@/lib/validation';
import { useNavigate, useLocation } from 'react-router-dom';
import Loader from '@/components/shared/Loader';
import { useState } from 'react';
import { confirmPasswordReset } from '@/lib/appwrite-apis/users';

const NewPasswordForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof NewPasswordValidation>>({
    resolver: zodResolver(NewPasswordValidation),
    defaultValues: { password: '' },
  });

  async function onSubmit(values: z.infer<typeof NewPasswordValidation>) {
    try {
      setIsLoading(true);
      // Get URL parameters
      const params = new URLSearchParams(location.search);
      const userId = params.get('userId');
      const secret = params.get('secret');

      if (!userId || !secret) {
        throw new Error('Invalid reset link');
      }

      await confirmPasswordReset(userId, secret, values.password);
      toast({ title: 'Password reset successful!' });
      navigate('/sign-in');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-center w-full p-6">
      <Form {...form}>
        <div className="sm:w-420 w-full flex-col flex-center">
        <img
            className="h-16 w-16"
            src="/assets/icons/logo.svg"
            alt="Logo"
          />
          <h2 className="h3-bold md:h2-bold pt-6">Set new password</h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 pb-11">
            Enter your new password
          </p>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5 w-full mt-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" className="shad-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="shad-button_primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex-center gap-2">
                  <Loader />
                </div>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default NewPasswordForm;
