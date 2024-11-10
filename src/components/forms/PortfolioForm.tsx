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
import FileUploader from '../shared/FileUploader';
import { ProjectValidation } from '@/lib/validation';
import { Models } from 'appwrite';
import { useUserContext } from '@/context/AuthContext';
import { useToast } from '../ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAddProject, useUpdateProject } from '@/lib/react-query/queries';
import Loader from '../shared/Loader';

type PortfolioFormProps = {
  project?: Models.Document;
  action: 'Add' | 'Update';
};

const PortfolioForm = ({ project, action }: PortfolioFormProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof ProjectValidation>>({
    resolver: zodResolver(ProjectValidation),
    defaultValues: {
      title: project ? project?.title : '',
      description: project ? project?.description : '',
      file: [],
      links: project && project.links ? project.links.join(',') : '',
      tags: project ? project.tags.join(',') : '',
    },
  });

  // Query
  const { mutateAsync: addProject, isPending: isLoadingAdd } = useAddProject();
  const { mutateAsync: updateProject, isPending: isLoadingUpdate } =
    useUpdateProject();

  async function onSubmit(values: z.infer<typeof ProjectValidation>) {
    if (project && action === 'Update') {
      const updatedPost = await updateProject({
        ...values,
        projectId: project.$id,
        mediaId: project?.mediaId,
        mediaUrl: project?.mediaUrl,
      });

      if (!updatedPost) {
        toast({ title: 'Please try again!' });
      }
      return navigate(`/projects/${project.$id}`);
    }

    const newProject = await addProject({
      ...values,
      userId: user.id,
    });

    if (!newProject) {
      toast({ title: 'Please try again!' });
    }

    navigate(`/portfolio/${user.id}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-9 w-full max-w-3xl"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Title</FormLabel>
              <FormControl>
                <Input className="shad-input custom-scrollbar" {...field} />
              </FormControl>

              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Description</FormLabel>
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
                  docUrl={project?.mediaUrl}
                />
              </FormControl>

              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="links"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Add Links (separated by a comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.youtube.com/@xongroh, https://www.behance.net/xongroh"
                  type="text"
                  className="shad-input"
                  {...field}
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
                Add Tags (separated by a comma " , ")
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Art, Music, Photography..."
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
              form.reset(); // Clears the form fields
              navigate(-1); // Navigates to the previous location
            }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isLoadingAdd || isLoadingUpdate}
          >
            {action} Project
            {(isLoadingAdd || isLoadingUpdate) && <Loader />}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PortfolioForm;
