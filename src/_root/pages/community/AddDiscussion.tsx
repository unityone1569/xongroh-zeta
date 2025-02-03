import DiscussionForm from '@/components/forms/DiscussionForm';

const AddDiscussion = () => {
  return (
    <div className="flex flex-1">
      <div className="common-container">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">Add Discussion</h2>
        </div>

        <DiscussionForm action="Create" />
      </div>
    </div>
  );
};

export default AddDiscussion;