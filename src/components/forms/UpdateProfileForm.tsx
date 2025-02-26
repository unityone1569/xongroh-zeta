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
import { Textarea } from '../ui/textarea';
import { SingleFileUploader } from '../shared/FileUploader';
import { ProfileValidation } from '@/lib/validation'; // Define this validation schema
import { Models } from 'appwrite';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

import Loader from '../shared/Loader';
import { useUpdateProfile } from '@/lib/tanstack-queries/usersQueries';

type ProfileFormProps = {
  user?: Models.Document;
};

const UpdateprofileForm = ({ user }: ProfileFormProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof ProfileValidation>>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: {
      name: user?.name ?? '',
      username: user?.username ?? '',
      hometown: user?.hometown ?? '',
      profession: user?.profession ?? '',
      bio: user?.bio ?? '',
      about: user?.about ?? '',
      dpFile: undefined,
      coverFile: undefined,
    },
  });

  const { mutateAsync: updateProfile, isPending: isLoadingUpdate } =
    useUpdateProfile();

  async function onSubmit(values: z.infer<typeof ProfileValidation>) {
    try {
      if (!user) {
        throw new Error('User object is undefined');
      }
      const updatedUser = await updateProfile({
        ...values,
        userId: user.$id,
        dpUrl: user?.dpUrl,
        dpId: user?.dpId,
        coverUrl: user?.coverUrl,
        coverId: user?.coverId,
      });

      if (updatedUser) {
        navigate(`/profile/${user?.$id}`);
        toast({ title: 'Profile updated succesfully!' });
      } else {
        toast({ title: 'Update failed, please try again!' });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: 'An error occurred',
          description: error.message,
        });
      } else {
        toast({
          title: 'An error occurred',
          description: 'An unexpected error occurred.',
        });
      }
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-9 w-full max-w-3xl"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Name</FormLabel>
              <FormControl>
                <Input className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Username</FormLabel>
              <FormControl>
                <Input className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="profession"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Profession</FormLabel>
              <FormControl>
                <Input className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
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
                <Input className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Bio</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea"
                  {...field}
                  placeholder="Write a brief and catchy bio to display on your profile."
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dpFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Profile Picture</FormLabel>
              <FormControl>
                <SingleFileUploader
                  fieldChange={field.onChange}
                  docUrl={user?.dpUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Cover Picture</FormLabel>
              <FormControl>
                <SingleFileUploader
                  fieldChange={field.onChange}
                  docUrl={user?.coverUrl}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <div className="body-bold">For Portfolio</div>
        <FormField
          control={form.control}
          name="about"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">About</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea"
                  {...field}
                  placeholder="Tell your story, flaunt your skills, and make your portfolio impossible to ignore!"
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-center justify-end">
          <Button
            type="button"
            className="shad-button_dark_4"
            onClick={() => {
              form.reset(); // Resets the form fields
              navigate(-1); // Navigates back
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingUpdate}
          >
            Update Profile
            {isLoadingUpdate && <Loader />}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateprofileForm;
