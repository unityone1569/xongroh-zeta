import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import ProjectStats from './ProjectStats';
import LazyImage from './LazyImage';

type ProjectCardProps = {
  project: Models.Document;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { user } = useUserContext();
  if (!project.authorId) return;

  return (
    <div className="post-card">
      <Link to={`/projects/${project?.$id}`}>
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
        Array.isArray(project?.tags) &&
        project?.tags.filter((tag: string) => tag.trim() !== '').length > 0 && (
          <ul className="flex py-1.5 flex-wrap gap-3.5 mt-1.5 overflow-x-hidden">
            {project?.tags
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
          <Link to={`/profile/${project?.authorId}`}>
            <LazyImage
              src={
                project?.author?.dpUrl ||
                '/assets/icons/profile-placeholder.svg'
              }
              alt="creator"
              className="rounded-full w-9 h-9 object-cover lg:w-11 lg:h-11"
            />
          </Link>
          <div className="flex flex-col">
            <p className="small-medium lg:base-medium text-light-1 flex items-center gap-1">
              {project?.author?.name}
              {project?.author?.verifiedUser && (
                <img 
                  src="/assets/icons/verified.svg" 
                  alt="verified" 
                  className="w-3.5 h-3.5" 
                />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Project
          </div>
          <ProjectStats project={project} userId={user.id} authorId={project.authorId} />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
