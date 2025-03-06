import EventForm from '@/components/forms/EventForm';
import Loader from '@/components/shared/Loader';
import { useGetEventById } from '@/lib/tanstack-queries/eventsQueries';
import { useParams } from 'react-router-dom';
import { IEvent } from '@/types';

const EditEvent = () => {
  const { id } = useParams();

  const { data: event, isPending } = useGetEventById(id || '');

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="flex flex-1">
      <div className="common-container pb-16">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Event</h2>
        </div>

        <EventForm action="Update" event={event as unknown as IEvent} />
      </div>
    </div>
  );
};

export default EditEvent;
