import { Models } from 'appwrite';

import { Link } from 'react-router-dom';

type ProjectCardProps = {
  project: Models.Document;
};

const ProjectCard = ({ project }: ProjectCardProps) => {
  if (!project.creatorId) return;

  const handleShare = () => {
    const urlToShare = window.location.href;
    const shareText = 'Check out this post from Xongroh!';

    if (navigator.share) {
      navigator
        .share({
          title: 'Portfolio Project',
          text: shareText,
          url: urlToShare,
        })
        .then(() => console.log('Content shared successfully!'))
        .catch((error) => console.error('Error sharing content:', error));
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard
        .writeText(`${shareText} ${urlToShare}`)
        .then(() => alert('Link copied to clipboard!'))
        .catch((error) => console.error('Error copying text: ', error));
    }
  };

  return (
    <div className="post-card">
      <Link to={`/projects/${project.$id}`}>
        <div className="pb-7">
          <p className="base-semibold lg:body-bold line-clamp-2 text-pretty">
            {project?.title}
          </p>
          <p className="small-regular line-clamp-6 text-pretty pt-1.5 md:pt-2">
            {project?.description}
          </p>

          <ul className="flex gap-2 mt-3">
            {project?.tags.map((tag: string, index: string) => (
              <li key={`${tag}${index}`}>
                <span className="px-3 py-1 bg-[#2A2A2A] rounded-full text-xs font-medium">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* {project.mediaUrl && project.mediaUrl.length > 0 && (
          <img
            src={project.mediaUrl}
            alt="post image"
            className="post-card_img"
          />
        )} */}
      </Link>

      <div className="flex-between">
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
          <img src="/assets/icons/like.svg" alt="like" width={25} />
          <img
            src="/assets/icons/share.svg"
            alt="share"
            width={26}
            onClick={handleShare}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
