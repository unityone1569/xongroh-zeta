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
import { FileUploader } from '../shared/FileUploader';
import { PostValidation } from '@/lib/validation';
import { Models } from 'appwrite';
import { useUserContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

import Loader from '../shared/Loader';
import {
  useAddCreation,
  useUpdateCreation,
} from '@/lib/tanstack-queries/postsQueries';

type PostFormProps = {
  post?: Models.Document;
  action: 'Create' | 'Update';
};

const PostForm = ({ post, action }: PostFormProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof PostValidation>>({
    resolver: zodResolver(PostValidation),
    defaultValues: {
      content: post ? post?.content : '',
      file: [],
      tags: post ? post.tags.join(',') : '',
    },
  });

  // Query
  const { mutateAsync: createPost, isPending: isLoadingCreate } =
    useAddCreation();
  const { mutateAsync: updatePost, isPending: isLoadingUpdate } =
    useUpdateCreation();

  async function onSubmit(values: z.infer<typeof PostValidation>) {
    if (post && action === 'Update') {
      const updatedPost = await updatePost({
        ...values,
        creationId: post.$id,
        mediaId: post?.mediaId,
        mediaUrl: post?.mediaUrl,
      });

      if (!updatedPost) {
        toast({ title: 'Please try again!' });
      }

      toast({ title: 'Creation added successfully!' });
      return navigate(`/creations/${post.$id}`);
    }

    const newPost = await createPost({
      ...values,
      authorId: user.id,
    });

    if (!newPost) {
      toast({ title: 'Please try again!' });
    }

    navigate(`/creations/${newPost?.$id}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-9 w-full max-w-3xl"
      >
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Content</FormLabel>
              <FormControl>
                <Textarea
                  className="shad-textarea custom-scrollbar"
                  {...field}
                />
              </FormControl>

              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Add Media</FormLabel>
              <FormControl>
                <FileUploader
                  fieldChange={field.onChange}
                  docUrl={post?.mediaUrl}
                />
              </FormControl>

              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Tags (separated by comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Expression, Learn"
                  type="text"
                  className="shad-input"
                  {...field}
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
              form.reset();
              navigate(-1); // Navigates to the previous location
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            {action} Post
            {(isLoadingCreate || isLoadingUpdate) && <Loader />}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostForm;
