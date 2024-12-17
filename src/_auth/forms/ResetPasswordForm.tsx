import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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

import Loader from '@/components/shared/Loader';
import { useState } from 'react';
import { account } from '@/lib/appwrite-apis/config';

const FormSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof FormSchema>) {
    try {
      setIsLoading(true);
      // Use Appwrite's password recovery directly
      await account.createRecovery(
        values.email,
        `${window.location.origin}/new-password`
      );
      
      toast({
        title: "Success!",
        description: "Check your email for the password reset link.",
      });
      
      navigate('/sign-in');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send reset link. Please try again.",
        variant: "destructive",
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
          <h2 className="h3-bold md:h2-bold pt-6">Reset password</h2>
          <p className="text-light-3 small-medium md:base-regular mt-2 pb-11">
            Enter your email to receive a password reset link
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 w-full mt-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" className="shad-input" {...field} />
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
                  <Loader /> Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>
        </div>
      </Form>
    </div>
  );
};

export default ResetPasswordForm;
