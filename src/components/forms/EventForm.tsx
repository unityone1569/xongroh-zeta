import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useUserContext } from '@/context/AuthContext';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SingleFileUploader } from '../shared/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { IEvent, EventType } from '@/types';
import {
  useCreateEvent,
  useUpdateEvent,
} from '@/lib/tanstack-queries/eventsQueries';
import { DateTimePicker } from '@/components/ui/datetime-picker';

import Loader from '../shared/Loader';

const EventValidation = z.object({
  title: z
    .string()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(300, { message: 'Title must be less than 300 characters' }),
  description: z
    .string()
    .min(5, { message: 'Description must be at least 5 characters' })
    .max(1500, { message: 'Description must be less than 1500 characters' }),
  organiser: z
    .string()
    .min(5, { message: 'Organiser must be at least 5 characters' })
    .max(300, { message: 'Organiser must be less than 300 characters' }),
  venue: z
    .string()
    .min(5, { message: 'Venue must be at least 5 characters' })
    .max(250, { message: 'Venue must be less than 250 characters' }),
  dateTime: z.date(),
  type: z.string(),
  bookingLink: z
    .string()
    .transform((val) => val.trim()) // Trim whitespace
    .refine((val) => val === '' || /^https?:\/\/.+/.test(val), {
      message: 'Please enter a valid URL starting with http:// or https://',
    })
    .transform((val) => (val === '' ? null : val))
    .optional(),
  imageFile: z.custom<File>().optional(),
  imageUrl: z
    .string()
    .max(500, { message: 'Image URL must be less than 500 characters' })
    .optional(),
  imageId: z
    .string()
    .max(100, { message: 'Image ID must be less than 100 characters' })
    .optional(),
});

type EventFormProps = {
  event?: IEvent;
  action: 'Create' | 'Update';
};
const EventForm = ({ event, action }: EventFormProps) => {
  const { user } = useUserContext();
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof EventValidation>>({
    resolver: zodResolver(EventValidation),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      organiser: event?.organiser || '',
      venue: event?.venue || '',
      dateTime: event?.dateTime ? new Date(event.dateTime) : undefined,
      type: (event?.type as EventType) || 'Live Performance',
      bookingLink: event?.bookingLink?.toString() || '',
      imageUrl: event?.imageUrl?.toString() || undefined,
      imageId: event?.imageId || '',
    },
  });

  const { mutateAsync: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutateAsync: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const handleSubmit = async (values: z.infer<typeof EventValidation>) => {
    try {
      const bookingLink = values.bookingLink
        ? new URL(values.bookingLink)
        : undefined;
      if (action === 'Create') {
        await createEvent({
          ...values,
          bookingLink,
          dateTime: values.dateTime.toISOString(),
          creatorId: user.id,
        });
        toast({ title: 'Event created successfully' });
      } else {
        if (!event?.$id) throw Error;
        const imageUrl = values.imageUrl ? new URL(values.imageUrl) : undefined;
        const bookingLink = values.bookingLink
          ? new URL(values.bookingLink)
          : undefined;
        await updateEvent({
          ...values,
          imageUrl,
          bookingLink,
          dateTime: values.dateTime.toISOString(),
          eventId: event.$id,
        });
        toast({ title: 'Event updated successfully' });
      }
      navigate('/events');
    } catch (error) {
      toast({ title: `Failed to ${action.toLowerCase()} event` });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-9 w-full max-w-3xl"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Event Title</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
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
          name="organiser"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Organiser</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Venue</FormLabel>
              <FormControl>
                <Input type="text" className="shad-input" {...field} />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Date and Timing</FormLabel>
              <FormControl>
                <DateTimePicker
                  value={field.value}
                  onChange={field.onChange}
                  granularity="minute"
                  hourCycle={12} // Set to 12-hour format display
                  placeholder="Select date and time"
                  displayFormat={{
                    hour12: 'PP hh:mm a', // Custom format for 12-hour display with AM/PM
                  }}
                  yearRange={1}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Event Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[
                    'Exhibition',
                    'Concert',
                    'Live Performance',
                    'Cultural Festival',
                    'Workshop',
                    'Masterclass',
                    'Meetup',
                    'Launch Event',
                    'Competition',
                    'Award',
                    'Fair',
                    'Webinar',
                    'Other',
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">Event Image</FormLabel>
              <FormControl>
                <SingleFileUploader
                  fieldChange={field.onChange}
                  docUrl={event?.imageUrl?.toString() || ''}
                />
              </FormControl>
              <FormMessage className="shad-form_message" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bookingLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="shad-form_label">
                Booking Link (Optional)
              </FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://..."
                  className="shad-input"
                  {...field}
                  value={field.value || ''}
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
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="shad-button_primary whitespace-nowrap"
            disabled={isCreating || isUpdating}
          >
            {action} Event
            {(isCreating || isUpdating) && <Loader />}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EventForm;
