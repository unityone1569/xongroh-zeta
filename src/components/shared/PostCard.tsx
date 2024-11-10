import { useUserContext } from '@/context/AuthContext';
import { multiFormatDateString } from '@/lib/utils';
import { Models } from 'appwrite';
import { Link } from 'react-router-dom';
import PostStats from './PostStats';

type PostCardProps = {
  post: Models.Document;
};

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useUserContext();
  if (!post.creatorId) return;

  return (
    <div className="post-card">
      <div className="flex-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.creatorId}`}>
            <img
              src={
                post?.creator?.dpUrl || '/assets/icons/profile-placeholder.svg'
              }
              alt="creator"
              className="rounded-full w-10 h-10 lg:w-14 lg:h-14"
            />
          </Link>
          <div className="flex flex-col">
            <p className="base-medium lg:body-bold text-light-1">
              {post.creator.name}
            </p>
            <div className="flex-start text-light-3 pt-0.5">
              <p className="subtle-semibold lg:small-regular ">
                {multiFormatDateString(post.$createdAt)}
              </p>
              {/* •
              <p className="subtle-semibold lg:small-regular">
                {post.location}
              </p> */}
            </div>
          </div>
        </div>
        <Link
          to={`/update-post/${post.$id}`}
          className={`${user.id !== post.creatorId && 'hidden'}`}
        >
          <img src="/assets/icons/edit.svg" alt="edit" width={20} />
        </Link>
      </div>

      <Link to={`/posts/${post.$id}`}>
        <div className="small-medium lg:base-medium pt-5 pb-4">
          <p className="font-normal line-clamp-3 text-pretty">{post.content}</p>
          <ul className="flex py-1.5 flex-wrap gap-3.5 mt-5 overflow-x-hidden">
            {post?.tags.map((tag: string, index: string) => (
              <li key={`${tag}${index}`}>
                <span className="px-3 py-1  bg-[#2A2A2A] rounded-full text-xs font-medium">
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <img
          src={post.mediaUrl || '/assets/icons/profile-placeholder.svg'}
          alt="post image"
          className="post-card_img"
        />
      </Link>
      <PostStats post={post} userId={user.id} />
    </div>
  );
};

export default PostCard;
