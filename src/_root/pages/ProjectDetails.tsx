import { DeleteProject } from '@/components/shared/DeleteItems';
import Loader from '@/components/shared/Loader';
import ProjectStats from '@/components/shared/ProjectStats';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/context/AuthContext';
import { formatDateString, updateMetaTags } from '@/lib/utils/utils';
import { Models } from 'appwrite';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getMediaTypeFromUrl } from '@/lib/utils/mediaUtils';
import AudioPlayer from '@/components/shared/AudioPlayer';
import VideoPlayer from '@/components/shared/VideoPlayer';
import LazyImage from '@/components/shared/LazyImage';
import {
  useGetAuthorById,
  useGetProjectById,
} from '@/lib/tanstack-queries/postsQueries';

const ProjectDetails = () => {
  const { id } = useParams();
  const { data: project, isPending } = useGetProjectById(id || '');
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(project?.authorId);

  const postId = id || '';
  const mediaId = project?.mediaId[0];
  const authorId = project?.authorId;
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleShare = useCallback(async () => {
    const shareUrl = window.location.href;
    const imageUrl =
      project?.mediaUrl ||
      'https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/678c96350038d0b750f0/view?project=66e2a98a00192795ca51';
    // Update meta tags
    updateMetaTags(
      project?.title || 'Xongroh Project',
      project?.description || 'Check out this project from Xongroh!',
      imageUrl,
      shareUrl
    );

    try {
      if (navigator.share) {
        await navigator.share({
          title: project?.title || 'Project',
          text: 'Check out this project from Xongroh!',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `Check out this project from Xongroh! ${shareUrl}`
        );
        toast({ title: 'Link copied to clipboard!' });
      }
    } catch (error) {
      toast({ title: 'Error sharing project', variant: 'destructive' });
    }
  }, [project, toast]);

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
                        <LazyImage
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
                to={`/profile/${project?.authorId}`}
                className="flex items-center gap-3"
              >
                <LazyImage
                  src={author?.dpUrl || '/assets/icons/profile-placeholder.svg'}
                  alt="authorId"
                  className="rounded-full w-10 h-10 lg:w-14 object-cover lg:h-14"
                />

                <div className="flex flex-col">
                  <p className="base-medium lg:body-bold text-light-1 flex items-center gap-1.5">
                    {author?.name}
                    {author?.verifiedUser && (
                      <img
                        src="/assets/icons/verified.svg"
                        alt="verified"
                        className="w-4 h-4"
                      />
                    )}
                  </p>
                  <div className="flex-start pt-1 text-light-3">
                    <p className="subtle-semibold lg:small-regular ">
                      {formatDateString(project?.$createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex-center gap-5">
                <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                  Project
                </div>
                <div
                  className={`pr-1 ${
                    user?.id !== project?.authorId && 'hidden'
                  }`}
                >
                  <Link to={`/update-project/${project?.$id}`}>
                    <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                  </Link>
                </div>

                <div
                  className={`ghost_details-delete_btn ${
                    user?.id !== project?.authorId && 'hidden'
                  }`}
                >
                  <DeleteProject
                    projectId={postId}
                    mediaId={mediaId}
                    authorId={authorId}
                  />
                </div>
              </div>
            </div>
            <hr className="border w-full my-2 border-dark-4/80" />
            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p className="body-bold text-pretty px-1">{project?.title}</p>
              <p className="small-regular whitespace-pre-line text-pretty pt-3 px-1 text-light-3">
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
                authorId={project?.authorId}
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
