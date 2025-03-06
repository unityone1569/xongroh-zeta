import PostForm from '@/components/forms/PostForm';

const AddCreation = () => {
  return (
    <div className="flex flex-1 ">
      <div className="common-container md:my-14 lg:my-0">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full ">Add Creation</h2>
        </div>

        <PostForm action="Create" />
      </div>
    </div>
  );
};

export default AddCreation;
