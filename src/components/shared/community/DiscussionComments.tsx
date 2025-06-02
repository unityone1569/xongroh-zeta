import React, { useMemo, useCallback, useEffect } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { multiFormatDateStringNoTime } from '@/lib/utils/utils';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import {
  useGetComments,
  useAddDiscussionComment,
  useGetCommentRepliesCount,
  useGetPostCommentsCount,
} from '@/lib/tanstack-queries/commentsQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';
import { useInView } from 'react-intersection-observer';
import Loader from '../Loader';
import { DeleteComment } from '../DeleteItems';
import DiscussionLikedItems from './DiscussionLikedItems';
import DiscussionReplies from './DiscussionReplies';

type DiscussionCommentsProps = {
  discussionId: string;
  userId: string;
  authorId: string;
  communityId: string;
  postAuthorId: string;
};

// Schema validation
const commentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty'),
});

// Textarea with ref forwarding
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>((props, ref) => <BaseTextarea {...props} ref={ref} />);
Textarea.displayName = 'Textarea';

const DiscussionComments = ({
  discussionId,
  userId,
  authorId,
  postAuthorId,
  communityId,
}: DiscussionCommentsProps) => {
  const { toast } = useToast();

  // Infinite scroll setup
  const { ref: loadMoreRef, inView } = useInView();

  // Fetching data
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    fetchNextPage: fetchNextComments,
    hasNextPage: hasNextCommentsPage,
    isFetchingNextPage: isFetchingNextComments,
  } = useGetComments(discussionId);

  const { data: commentsCount } = useGetPostCommentsCount(discussionId);

  const { mutateAsync: addComment } = useAddDiscussionComment();

  // Form instance
  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment: '' },
  });

  // Submit handler
  const onSubmitComment = useCallback(
    async ({ comment }: { comment: string }) => {
      await addComment({
        discussionId,
        userId,
        authorId,
        content: comment,
        communityId,
      });
      commentForm.reset();
      toast({ title: 'Comment added successfully!' });
    },
    [addComment, discussionId, userId, authorId, communityId]
  );

  // Load more comments when scrolled to bottom
  useEffect(() => {
    if (inView && hasNextCommentsPage && !isFetchingNextComments) {
      fetchNextComments();
    }
  }, [inView, hasNextCommentsPage, isFetchingNextComments, fetchNextComments]);

  // Rendered Comments
  const renderedComments = useMemo(() => {
    if (isCommentsLoading) return <Loader />;

    return (
      <>
        {commentsData?.pages.map((page) =>
          page.documents.map((comment) => (
            <CommentItem
              key={comment.$id}
              creatorId={comment.userId}
              content={comment.content}
              createdAt={comment.$createdAt}
              commentId={comment.$id}
              discussionId={discussionId}
              userId={userId}
              authorId={authorId}
              postAuthorId={postAuthorId}
              communityId={communityId}
              item={comment}
            />
          ))
        )}
        {hasNextCommentsPage && (
          <div ref={loadMoreRef} className="w-full flex justify-center py-4">
            {isFetchingNextComments ? (
              <Loader />
            ) : (
              <p className="text-light-3 text-sm">Load more comments</p>
            )}
          </div>
        )}
      </>
    );
  }, [
    commentsData?.pages,
    isCommentsLoading,
    hasNextCommentsPage,
    isFetchingNextComments,
    discussionId,
    userId,
    authorId,
    postAuthorId,
    communityId,
  ]);

  const {
    formState: { isSubmitting },
  } = commentForm;

  return (
    <div className="post-comments-container">
      <div className="comment-count pt-1 pb-3">
        <span className="small-medium md:base-medium">
          Comments
          {(commentsCount?.totalCount || 0) > 0 && (
            <span className="ml-1 text-light-3 subtle-comment-semibold">
              ({commentsCount?.totalCount || 0})
            </span>
          )}
        </span>
      </div>

      <div className="comment-input">
        <Form {...commentForm}>
          <form onSubmit={commentForm.handleSubmit(onSubmitComment)}>
            <FormField
              control={commentForm.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="shad-comment subtle-comment md:small-regular pl-3.5 pt-3.5 custom-scrollbar"
                      placeholder="Write a comment..."
                    />
                  </FormControl>
                  <FormMessage className="shad-form_message" />
                </FormItem>
              )}
            />
            <Button
              className={`shad-button_primary ml-1 mt-4 mb-6 whitespace-nowrap ${
                isSubmitting ? 'opacity-50' : ''
              }`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending' : 'Send'}
            </Button>
          </form>
        </Form>
        <div className="comments-list">{renderedComments}</div>
      </div>
    </div>
  );
};

type CommentProps = {
  content: string;
  createdAt: string;
  creatorId: string;
  commentId: string;
  discussionId: string;
  userId: string;
  authorId: string;
  postAuthorId: string;
  communityId: string;
  item: Models.Document;
};

const CommentItem = React.memo(
  ({
    content,
    createdAt,
    creatorId,
    commentId,
    discussionId,
    userId,
    authorId,
    postAuthorId,
    communityId,
    item,
  }: CommentProps) => {
    const { user } = useUserContext();
    const { data: userData } = useGetUserInfo(creatorId);
    const { data: repliesCount = 0 } = useGetCommentRepliesCount(commentId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dp }
      : { name: '', dpUrl: '' };

    const [showReplyForm, setShowReplyForm] = React.useState(false);
    const toggleReplyForm = () => setShowReplyForm((prev) => !prev);

    return (
      <div className="w-full mx-auto px-2 py-4 rounded-lg">
        <div className="flex-between mb-5">
          <Link
            to={`/profile/${creatorId}`}
            className="flex items-center gap-3"
          >
            <img
              src={userInfo.dpUrl || '/assets/icons/profile-placeholder.svg'}
              alt={`${userInfo.name}'s profile picture`}
              className="rounded-full object-cover w-8 h-8"
            />
            <div>
              <p className="small-medium md:base-medium text-light-1 pb-0.5 flex items-center gap-1.5">
                {userInfo.name}
                {userData?.verifiedUser && (
                  <img
                    src="/assets/icons/verified.svg"
                    alt="verified"
                    className="w-3.5 h-3.5 md:w-4 md:h-4"
                  />
                )}
              </p>
              <p className="subtle-semibold lg:small-regular text-light-3">
                {multiFormatDateStringNoTime(createdAt)}
              </p>
            </div>
          </Link>
        </div>
        <p className="text-pretty leading-relaxed subtle-comment md:small-regular ml-2 mb-3">
          {content}
        </p>
        <div className="flex justify-between items-center ml-1">
          <div className="flex gap-5">
            <DiscussionLikedItems
              item={item}
              userId={user.id}
              authorId={authorId}
              postId={discussionId}
              itemType="comment"
              communityId={communityId}
            />
            <button
              onClick={toggleReplyForm}
              className="text-primary-500 hover:text-gray-500 small-medium"
            >
              Reply
            </button>
          </div>
          <div
            className={`${
              user?.id !== creatorId && user?.id !== postAuthorId && 'hidden'
            }`}
          >
            <DeleteComment commentId={commentId} postId={discussionId} />
          </div>
        </div>
        <div className="flex mt-2">
          {(showReplyForm || repliesCount > 0) && (
            <div className="ml-5 w-[2px] mt-5 mb-4 bg-gray-700/40 transition-colors duration-200"></div>
          )}
          <div className="flex-1">
            <DiscussionReplies
              postAuthorId={postAuthorId}
              parentId={commentId}
              userId={userId}
              showReplyForm={showReplyForm}
              toggleReplyForm={toggleReplyForm}
              authorId={authorId}
              discussionId={discussionId}
              communityId={communityId}
            />
          </div>
        </div>
      </div>
    );
  }
);

CommentItem.displayName = 'CommentItem';

export default DiscussionComments;
