import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import ProjectStats from './ProjectStats';
import LazyImage from './LazyImage';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import Loader from './Loader';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

type ProjectCardProps = {
  project: Models.Document;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  const { user } = useUserContext();
  const [mediaType, setMediaType] = useState<string>('unknown');
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  useEffect(() => {
    if (project?.mediaUrl) {
      setIsMediaLoading(true);
      getMediaTypeFromUrl(project.mediaUrl)
        .then(setMediaType)
        .finally(() => setIsMediaLoading(false));
    }
  }, [project?.mediaUrl]);

  if (!project.authorId) return;

  return (
    <div className="post-card">
      <Link to={`/projects/${project?.$id}`}>
        <div className="pb-2">
          <p className="base-semibold lg:body-bold line-clamp-2 text-pretty">
            {project?.title}
          </p>
          <p className="small-regular line-clamp-6 text-pretty pt-1.5 md:pt-2 text-light-3">
            {project?.description}
          </p>
        </div>
      </Link>

      {project?.mediaUrl?.length > 0 && (
        <>
          {isMediaLoading ? (
            <div className="post-card_img flex-center">
              <Loader />
            </div>
          ) : (
            (() => {
              switch (mediaType) {
                case 'image':
                  return (
                    <Link to={`/projects/${project?.$id}`}>
                      <LazyImage
                        src={project?.mediaUrl}
                        alt="project image"
                        className="post-card_img mt-5"
                      />
                    </Link>
                  );
                case 'audio':
                  return (
                    <div className="post-card_audio mt-5">
                      <AudioPlayer audioUrl={project?.mediaUrl} />
                    </div>
                  );
                case 'video':
                  return (
                    <div className="post-card_video mt-5">
                      <VideoPlayer videoUrl={project?.mediaUrl[0]} />
                    </div>
                  );
                default:
                  return null;
              }
            })()
          )}
        </>
      )}

      {project?.tags &&
        Array.isArray(project?.tags) &&
        project?.tags.filter((tag: string) => tag.trim() !== '').length > 0 && (
          <ul className="flex py-1.5 flex-wrap gap-3.5 mt-5 overflow-x-hidden">
            {project?.tags
              .filter((tag: string) => tag.trim() !== '')
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
            <p className="small-medium lg:base-medium text-light-1 flex items-center gap-1.5">
              {project?.author?.name}
              {project?.author?.verifiedUser && (
                <img
                  src="/assets/icons/verified.svg"
                  alt="verified"
                  className="w-4 h-4"
                />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Project
          </div>
          <ProjectStats
            project={project}
            userId={user.id}
            authorId={project.authorId}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
