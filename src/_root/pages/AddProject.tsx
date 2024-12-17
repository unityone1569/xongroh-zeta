import PortfolioForm from '@/components/forms/PortfolioForm';

const AddProject = () => {
  return (
    <div className="flex flex-1 ">
      <div className="common-container">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <h2 className="h3-bold md:h2-bold text-left w-full">Add Project</h2>
        </div>

        <PortfolioForm action="Add" />
      </div>
    </div>
  );
};

export default AddProject;
