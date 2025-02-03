import DiscussionForm from '@/components/forms/DiscussionForm';
import Loader from '@/components/shared/Loader';
import { useGetDiscussionById } from '@/lib/tanstack-queries/communityQueries';
import { useParams } from 'react-router-dom';

const EditDiscussion = () => {
  const { id } = useParams();

  const { data: discussion, isPending } = useGetDiscussionById(id || '');

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="flex flex-1">
      <div className="common-container pb-16">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Discussion</h2>
        </div>

        <DiscussionForm action="Update" discussion={discussion || undefined} />
      </div>
    </div>
  );
};

export default EditDiscussion;