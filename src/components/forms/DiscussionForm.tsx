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
import { DiscussionValidation } from '@/lib/validation';
import { Models } from 'appwrite';
import { useUserContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Loader from '../shared/Loader';
import {
  useCreateDiscussion,
  useUpdateDiscussion,
} from '@/lib/tanstack-queries/communityQueries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { useEffect, useState } from 'react';
import { getCommunityIdFromTopicId } from '@/lib/appwrite-apis/community';

type DiscussionFormProps = {
  discussion?: Models.Document;
  action: 'Create' | 'Update';
};

const DiscussionForm = ({ discussion, action }: DiscussionFormProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id: topicId } = useParams(); // Get topicId from URL params
  const [communityId, setCommunityId] = useState<string>('');

  const form = useForm<z.infer<typeof DiscussionValidation>>({
    resolver: zodResolver(DiscussionValidation),
    defaultValues: {
      content: discussion ? discussion?.content : '',
      file: [],
      tags: discussion ? discussion.tags.join(',') : '',
      type: discussion ? discussion.type : 'Discussion',
    },
  });

  // Add useEffect to fetch communityId
  useEffect(() => {
    const fetchCommunityId = async () => {
      if (topicId) {
        const id = await getCommunityIdFromTopicId(topicId);
        setCommunityId(id);
      }
    };
    fetchCommunityId();
  }, [topicId]);

  // Mutations
  const { mutateAsync: createDiscussion, isPending: isLoadingCreate } =
    useCreateDiscussion();
  const { mutateAsync: updateDiscussion, isPending: isLoadingUpdate } =
    useUpdateDiscussion();

  async function onSubmit(values: z.infer<typeof DiscussionValidation>) {
    if (discussion && action === 'Update') {
      const updatedDiscussion = await updateDiscussion({
        discussionId: discussion.$id,
        content: values.content,
        file: values.file,
        tags: values.tags,
        mediaId: discussion?.mediaId,
        mediaUrl: discussion?.mediaUrl,
      });

      if (!updatedDiscussion) {
        toast({ title: 'Please try again!' });
        return;
      }

      toast({ title: 'Discussion updated successfully!' });
      return navigate(`/discussions/${discussion.$id}`);
    }

    if (!topicId) {
      toast({ title: 'Topic ID is required!' });
      return;
    }

    const newDiscussion = await createDiscussion({
      discussion: {
        ...values,
        topicId,
        authorId: user.id,
      },
      communityId: communityId,
    });

    if (!newDiscussion) {
      toast({ title: 'Please try again!' });
      return;
    }

    navigate(`/topics/${topicId}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-9 w-full max-w-3xl"
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="shad-input">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Discussion">Discussion</SelectItem>
                  <SelectItem value="Collab">Collab</SelectItem>
                  <SelectItem value="Help">Help</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

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
                  placeholder="Share your thoughts..."
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
                  docUrl={discussion?.mediaUrl}
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
                  placeholder="Thought, Question, Feedback..."
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
              navigate(-1);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingCreate || isLoadingUpdate}
          >
            {action} Discussion
            {(isLoadingCreate || isLoadingUpdate) && <Loader />}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DiscussionForm;
