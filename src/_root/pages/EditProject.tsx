import PortfolioForm from '@/components/forms/PortfolioForm';
import Loader from '@/components/shared/Loader';
import { useGetProjectById } from '@/lib/react-query/queries';
import { useParams } from 'react-router-dom';

const EditProject = () => {
  const { id } = useParams();

  const { data: project, isPending } = useGetProjectById(id || '');

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="flex flex-1 ">
      <div className="common-container pb-16">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">Edit Project</h2>
        </div>

        <PortfolioForm action="Update" project={project} />
      </div>
    </div>
  );
};

export default EditProject;
