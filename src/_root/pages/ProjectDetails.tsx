import { DeleteProject } from '@/components/shared/DeleteItems';
import Loader from '@/components/shared/Loader';
import ProjectStats from '@/components/shared/ProjectStats';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/context/AuthContext';
import { useGetAuthorById, useGetProjectById } from '@/lib/react-query/queries';
import { formatDateString } from '@/lib/utils/utils';
import { Models } from 'appwrite';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import AudioPlayer from '@/components/shared/AudioPlayer';
import VideoPlayer from '@/components/shared/VideoPlayer';

const ProjectDetails = () => {
  const { id } = useParams();
  const { data: project, isPending } = useGetProjectById(id || '');
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(project?.creatorId);

  const postId = id || '';
  const mediaId = project?.mediaId[0];
  const creatorId = project?.creatorId;
  const { toast } = useToast();
  const navigate = useNavigate();
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
        .then(() => toast({ title: 'Content shared successfully!' }))
        .catch(() =>
          toast({ title: 'Error sharing content. Please try again.' })
        );
    } else {
      // Fallback for browsers that do not support the Web Share API
      navigator.clipboard
        .writeText(`${shareText} ${urlToShare}`)
        .then(() => toast({ title: 'Link copied to clipboard!' }))
        .catch(() => toast({ title: 'Error copying text. Please try again.' }));
    }
  };

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

  return (
    <div className="post_details-container">
      {isPending ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 p-2 mt-3 mb-5 text-light-2 subtle-semibold"
          >
            <img
              src="/assets/icons/back.svg"
              alt="back"
              className="w-5 h-5 lg:w-6 lg:h-6"
            />
            <p className="pt-1 lg:small-medium">Back</p>
          </button>
          {project?.mediaUrl && (
            <>
              {isMediaLoading ? (
                <div className="flex-center p-11">
                  <Loader />
                </div>
              ) : (
                (() => {
                  switch (mediaType) {
                    case 'image':
                      return (
                        <img
                          src={project.mediaUrl}
                          alt="project"
                          className="post-card_img"
                        />
                      );
                    case 'audio':
                      return (
                        <div className="post-card_audio">
                          <AudioPlayer audioUrl={project.mediaUrl} />
                        </div>
                      );
                    case 'video':
                      return (
                        <div className="post-card_video mb-2.5">
                          <VideoPlayer videoUrl={project.mediaUrl[0]} />
                        </div>
                      );
                    default:
                      return null;
                  }
                })()
              )}
            </>
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
                  className="rounded-full w-10 h-10 lg:w-14 object-cover lg:h-14"
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
              <div className="flex-center gap-5">
                <div
                  className={`pr-1 ${
                    user?.id !== project?.creatorId && 'hidden'
                  }`}
                >
                  <Link to={`/update-project/${project?.$id}`}>
                    <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                  </Link>
                </div>

                <div
                  className={`ghost_details-delete_btn ${
                    user?.id !== project?.creatorId && 'hidden'
                  }`}
                >
                  <DeleteProject
                    postId={postId}
                    mediaId={mediaId}
                    creatorId={creatorId}
                  />
                </div>
              </div>
            </div>
            <hr className="border w-full my-2 border-dark-4/80" />
            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p className="body-bold text-pretty px-1">{project?.title}</p>
              <p className="small-regular whitespace-pre-line text-pretty pt-3 px-1">
                {project?.description}
              </p>
              {project?.tags &&
                Array.isArray(project?.tags) &&
                project?.tags.filter((tag: string) => tag.trim() !== '')
                  .length > 0 && (
                  <ul className="flex py-1.5 flex-wrap gap-3.5 mt-5 overflow-x-hidden">
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

              {project?.links && project?.links?.length > 0 && (
                <ul className="flex flex-col pl-1 py-1.5 flex-wrap gap-3 mt-5 overflow-x-hidden">
                  {project?.links.map((link: string, index: number) => (
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
              <ProjectStats
                project={project ?? ({} as Models.Document)}
                userId={user?.id}
              />
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
