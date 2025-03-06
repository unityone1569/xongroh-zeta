import EventForm from '@/components/forms/EventForm';

const AddEvent = () => {
  return (
    <div className="flex flex-1">
      <div className="common-container md:my-14 lg:my-0">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">Add Event</h2>
        </div>

        <EventForm action="Create" />
      </div>
    </div>
  );
};

export default AddEvent;
