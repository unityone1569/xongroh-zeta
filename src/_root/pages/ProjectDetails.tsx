import Loader from '@/components/shared/Loader';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/context/AuthContext';
import { useGetAuthorById, useGetProjectById } from '@/lib/react-query/queries';
import { formatDateString } from '@/lib/utils';

import { Link, useParams } from 'react-router-dom';

const ProjectDetails = () => {
  const { id } = useParams();
  const { data: project, isPending } = useGetProjectById(id || '');
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(project?.creatorId);

  const handleDeleteProject = () => {};

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
    <div className="post_details-container">
      {isPending ? (
        <Loader />
      ) : (
        <div className="project_details-card">
          {project?.mediaUrl && project?.mediaUrl.length > 0 && (
            <img
              src={project?.mediaUrl}
              alt="post image"
              className="post-card_img"
            />
          )}

          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${project?.creatorId}`}
                className="flex items-center gap-3"
              >
                <img
                  src={author?.dpUrl || '/assets/icons/profile-placeholder.svg'}
                  alt="creator"
                  className="rounded-full w-10 h-10 lg:w-14 lg:h-14"
                />

                <div className="flex flex-col">
                  <p className="base-medium lg:body-bold text-light-1">
                    {author?.name}
                  </p>
                  <div className="flex-start pt-1 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">
                      {formatDateString(project?.$createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex-center">
                <Link
                  to={`/update-project/${project?.$id}`}
                  className={`pr-1 ${
                    user.id !== project?.creatorId && 'hidden'
                  }`}
                >
                  <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                </Link>
                <Button
                  onClick={handleDeleteProject}
                  variant="ghost"
                  className={`ghost_details-delete_btn ${
                    user.id !== project?.creatorId && 'hidden'
                  }`}
                >
                  <img src="/assets/icons/delete.svg" alt="delete" width={22} />
                </Button>
              </div>
            </div>
            <hr className="border w-full my-2 border-dark-4/80" />
            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p className="base-semibold lg:body-bold text-pretty px-1">
                <span className="body-bold ">Title: </span>
                {project?.title}
              </p>
              <p className="small-regular text-pretty pt-3 px-1">
                <span className="base-semibold">Description: </span>
                {project?.description}
              </p>
              {project?.tags &&
                Array.isArray(project.tags) &&
                project.tags.filter((tag: string) => tag.trim() !== '').length >
                  0 && (
                  <ul className="flex py-1.5 flex-wrap gap-3.5 mt-5 overflow-x-hidden">
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

              {project?.links && project.links.length > 0 && (
                <ul className="flex flex-col pl-1 py-1.5 flex-wrap gap-3 mt-5 overflow-x-hidden">
                  {project.links.map((link: string, index: number) => (
                    <li key={`${link}${index}`}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-medium underline text-purple-200 hover:text-purple-400"
                      >
                        <img
                          src="/assets/icons/link.svg"
                          alt="link"
                          width={19}
                        />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex justify-between py-2 px-0.5 md:px-0 items-center w-full">
              <img src="/assets/icons/like.svg" alt="like" width={26} />
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
      )}
    </div>
  );
};

export default ProjectDetails;
