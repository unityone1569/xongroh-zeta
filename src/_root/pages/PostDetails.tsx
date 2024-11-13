import Loader from '@/components/shared/Loader';
import PostComments from '@/components/shared/PostComments';
import PostStats from '@/components/shared/PostStats';
import { useUserContext } from '@/context/AuthContext';
import { useGetAuthorById, useGetPostById } from '@/lib/react-query/queries';
import { formatDateString } from '@/lib/utils';
import { Models } from 'appwrite';
import { Link, useParams } from 'react-router-dom';

const PostDetails = () => {
  const { id } = useParams();
  const { data: post, isPending } = useGetPostById(id || '');
  const { user } = useUserContext();
  const { data: author } = useGetAuthorById(post?.creatorId);

  const handleDeletePost = () => {};

  return (
    <div className="post_details-container">
      {isPending ? (
        <Loader />
      ) : (
        <div className="post_details-card">
          {post?.mediaUrl && post?.mediaUrl.length > 0 && (
            <img src={post?.mediaUrl} alt="post" className="post_details-img" />
          )}
          <div className="post_details-info">
            <div className="flex-between w-full">
              <Link
                to={`/profile/${post?.creatorId}`}
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
                      {formatDateString(post?.$createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex-center gap-5">
                <Link
                  to={`/update-post/${post?.$id}`}
                  className={`${user.id !== post?.creatorId && 'hidden'}`}
                >
                  <img src="/assets/icons/edit.svg" alt="edit" width={22} />
                </Link>
                <a
                  onClick={handleDeletePost}
                  className={`ghost_details-delete_btn ${
                    user.id !== post?.creatorId && 'hidden'
                  }`}
                >
                  <img src="/assets/icons/delete.svg" alt="delete" width={22} />
                </a>
              </div>
            </div>
            <hr className="border w-full my-2 border-dark-4/80" />
            <div className="flex flex-col flex-1 w-full small-medium lg:base-regular">
              <p className="font-normal text-pretty">{post?.content}</p>
              {post?.tags &&
                Array.isArray(post.tags) &&
                post.tags.filter((tag: string) => tag.trim() !== '').length >
                  0 && (
                  <ul className="flex py-1.5 flex-wrap gap-3.5 mt-5 overflow-x-hidden">
                    {post.tags
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
            </div>

            <div className="w-full  pt-1.5">
              <PostStats
                post={post ?? ({} as Models.Document)}
                userId={user.id}
              />
              <PostComments postId={post?.$id ?? ''} userId={user.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
