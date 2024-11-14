import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import ProjectStats from './ProjectStats';

type ProjectCardProps = {
  project: Models.Document;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { user } = useUserContext();
  if (!project.creatorId) return;

  return (
    <div className="post-card">
      <Link to={`/projects/${project.$id}`}>
        <div className="pb-2">
          <p className="base-semibold lg:body-bold line-clamp-2 text-pretty">
            {project?.title}
          </p>
          <p className="small-regular line-clamp-6 text-pretty pt-1.5 md:pt-2">
            {project?.description}
          </p>
        </div>

        {/* {project.mediaUrl && project.mediaUrl.length > 0 && (
          <img
            src={project.mediaUrl}
            alt="post image"
            className="post-card_img"
          />
        )} */}
      </Link>

      {project?.tags &&
        Array.isArray(project.tags) &&
        project.tags.filter((tag: string) => tag.trim() !== '').length > 0 && (
          <ul className="flex py-1.5 flex-wrap gap-3.5 mt-1.5 overflow-x-hidden">
            {project.tags
              .filter((tag: string) => tag.trim() !== '') // Filter out empty tags
              .map((tag: string, index: number) => (
                <li key={`${tag}${index}`}>
                  <span className="px-3 py-1 bg-[#2A2A2A] rounded-full text-xs font-medium">
                    {tag}
                  </span>
                </li>
              ))}
          </ul>
        )}

      <div className="flex-between pt-6">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${project.creatorId}`}>
            <img
              src={
                project?.creator?.dpUrl ||
                '/assets/icons/profile-placeholder.svg'
              }
              alt="creator"
              className="rounded-full w-9 h-9 lg:w-11 lg:h-11"
            />
          </Link>
          <div className="flex flex-col">
            <p className="small-medium lg:base-medium text-light-1">
              {project.creator.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ProjectStats project={project} userId={user.id} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
