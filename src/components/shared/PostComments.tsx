import React, { useState, useMemo, useCallback } from 'react';
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
import Loader from './Loader';
import { multiFormatDateString } from '@/lib/utils/utils';
import { Link } from 'react-router-dom';
import Replies from './Replies';
import LikedItems from './LikedItems';
import { Models } from 'appwrite';
import { DeleteComment, DeleteFeedback } from './DeleteItems';
import {
  useAddComment,
  useAddFeedback,
  useGetComments,
  useGetFeedbacks,
} from '@/lib/tanstack-queries/commentsQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';

type PostCommentsProps = {
  postId: string;
  userId: string;
  authorId: string;
  postAuthorId: string;
};

interface CommentFormValues {
  comment: string;
}

interface FeedbackFormValues {
  feedback: string;
}

// Schema validation
const commentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty'),
});

const feedbackSchema = z.object({
  feedback: z.string().min(1, 'Feedback cannot be empty'),
});

// Textarea with ref forwarding
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>((props, ref) => <BaseTextarea {...props} ref={ref} />);
Textarea.displayName = 'Textarea';

const PostComments = ({
  postId,
  userId,
  authorId,
  postAuthorId,
}: PostCommentsProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'comments' | 'feedbacks'>(
    'comments'
  );

  // Fetching data
  const { data: comments, isLoading: isCommentsLoading } =
    useGetComments(postId);
  const { data: feedbacks, isLoading: isFeedbacksLoading } =
    useGetFeedbacks(postId);

  const { mutateAsync: addComment } = useAddComment();
  const { mutateAsync: addFeedback } = useAddFeedback();

  // Form instances
  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment: '' },
  });

  const feedbackForm = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { feedback: '' },
  });

  const handleTabChange = useCallback(
    (tab: 'comments' | 'feedbacks') => setActiveTab(tab),
    []
  );

  // Submit handlers
  const onSubmitComment = useCallback(
    async ({ comment }: CommentFormValues) => {
      await addComment({ postId, userId, authorId, content: comment });
      commentForm.reset();
      toast({ title: 'Comment added successfully!' });
    },
    [addComment, commentForm, postId, userId, authorId]
  );

  const onSubmitFeedback = useCallback(
    async ({ feedback }: FeedbackFormValues) => {
      await addFeedback({ postId, userId, authorId, content: feedback });
      feedbackForm.reset();
      toast({ title: 'Feedback added successfully!' });
    },
    [addFeedback, feedbackForm, postId, userId, authorId]
  );

  const visibleFeedbacks = useMemo(() => {
    return feedbacks?.filter(
      (feedback) => postAuthorId === userId || feedback.userId === userId
    );
  }, [feedbacks, authorId, userId]);

  // Rendered Items
  const RenderedItems = useMemo(() => {
    if (isCommentsLoading || isFeedbacksLoading) return <Loader />;
    if (activeTab === 'comments') {
      return comments?.map((comment) => (
        <CommentItem
          key={comment.$id}
          creatorId={comment.userId}
          content={comment.content}
          createdAt={comment.$createdAt}
          commentId={comment.$id}
          postId={postId}
          userId={userId}
          authorId={authorId}
          postAuthorId={postAuthorId}
          item={comment}
        />
      ));
    }
    return visibleFeedbacks?.map((feedback) => (
      <FeedbackItem
        key={feedback.$id}
        content={feedback.content}
        creatorId={feedback.userId}
        createdAt={feedback.$createdAt}
        feedbackId={feedback.$id}
        postId={postId}
        userId={userId}
        authorId={authorId}
        postAuthorId={postAuthorId}
        item={feedback}
      />
    ));
  }, [
    activeTab,
    comments,
    visibleFeedbacks,
    isCommentsLoading,
    isFeedbacksLoading,
    postId,
    userId,
  ]);

  const {
    formState: { isSubmitting: isSubmittingComment },
  } = commentForm;
  const {
    formState: { isSubmitting: isSubmittingFeedback },
  } = feedbackForm;

  return (
    <div className="post-comments-container">
      <div className="tabs pt-1">
        {['comments', 'feedbacks'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab as 'comments' | 'feedbacks')}
            className={`small-medium md:base-medium ${
              activeTab === tab
                ? 'underline text-purple-300 lg:decoration-1 underline-offset-8'
                : ''
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="comment-input">
        <div className="comments-list">{RenderedItems}</div>
        {activeTab === 'comments' ? (
          <Form {...commentForm} key="comment-form">
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
                  isSubmittingComment ? 'opacity-50' : ''
                }`}
                type="submit"
                disabled={isSubmittingComment}
              >
                {isSubmittingComment ? 'Sending' : 'Send'}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...feedbackForm} key="feedback-form">
            <form onSubmit={feedbackForm.handleSubmit(onSubmitFeedback)}>
              <FormField
                control={feedbackForm.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="shad-comment subtle-comment md:small-regular custom-scrollbar pl-3.5 pt-3.5 "
                        placeholder="Feedbacks are private and not visible to others."
                      />
                    </FormControl>
                    <FormMessage className="shad-form_message" />
                  </FormItem>
                )}
              />
              <Button
                className={`shad-button_primary ml-1 mt-4 mb-6 whitespace-nowrap ${
                  isSubmittingFeedback ? 'opacity-50' : ''
                }`}
                type="submit"
                disabled={isSubmittingFeedback}
              >
                {isSubmittingFeedback ? 'Sending' : 'Send'}
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
};

type CommentProps = {
  content: string;
  createdAt: string;
  creatorId: string;
  commentId: string;
  postId: string;
  userId: string;
  authorId: string;
  postAuthorId: string;
  item: Models.Document;
};

const CommentItem = React.memo(
  ({
    content,
    createdAt,
    creatorId,
    commentId,
    userId,
    authorId,
    postAuthorId,
    item,
    postId,
  }: CommentProps) => {
    const { user } = useUserContext();
    const { data: userData } = useGetUserInfo(creatorId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dp }
      : { name: '', dpUrl: '' };
    // State for reply form visibility
    const [showReplyForm, setShowReplyForm] = useState(false);
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
              <p className="small-medium md:base-medium text-light-1 pb-0.5">
                {userInfo.name}
              </p>
              <p className="subtle-semibold lg:small-regular text-light-3">
                {multiFormatDateString(createdAt)}
              </p>
            </div>
          </Link>
        </div>
        <p className="text-pretty leading-relaxed subtle-comment md:small-regular ml-2 mb-3">
          {content}
        </p>
        <div className="flex justify-between items-center ml-1">
          <div className="flex justify-start gap-3.5">
            <LikedItems item={item} userId={user.id} authorId={authorId} />
            <div
              className={`${
                user?.id !== creatorId && user?.id !== postAuthorId && 'hidden'
              }`}
            >
              <DeleteComment commentId={commentId} postId={postId} />
            </div>
            <button
              onClick={toggleReplyForm}
              className="text-gray-500 hover:text-gray-700 small-medium"
            >
              Reply
            </button>
          </div>
        </div>
        <div>
          <Replies
            postAuthorId={postAuthorId}
            parentId={commentId}
            userId={userId}
            isFeedback={false}
            showReplyForm={showReplyForm}
            toggleReplyForm={toggleReplyForm}
            authorId={authorId}
          />
        </div>
      </div>
    );
  }
);

CommentItem.displayName = 'CommentItem';

type FeedbackProps = {
  content: string;
  createdAt: string;
  creatorId: string;
  feedbackId: string;
  postId: string;
  userId: string;
  authorId: string;
  postAuthorId: string;
  item: Models.Document;
};

const FeedbackItem = React.memo(
  ({
    content,
    createdAt,
    creatorId,
    feedbackId,
    userId,
    postAuthorId,
    authorId,
    item,
    postId,
  }: FeedbackProps) => {
    const { user } = useUserContext();
    const { data: userData } = useGetUserInfo(creatorId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dp }
      : { name: '', dpUrl: '' };

    const [showReplyForm, setShowReplyForm] = useState(false);
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
              <p className="small-medium md:base-medium text-light-1 pb-0.5">
                {userInfo.name}
              </p>
              <p className="subtle-semibold lg:small-regular text-light-3">
                {multiFormatDateString(createdAt)}
              </p>
            </div>
          </Link>
        </div>
        <p className="text-pretty subtle-comment md:small-regular leading-relaxed ml-2 mb-3">
          {content}
        </p>
        <div className="flex justify-between items-center ml-1">
          <div className="flex justify-start gap-3.5">
            <LikedItems item={item} userId={user.id} authorId={authorId} />
            <div
              className={`${
                user?.id !== creatorId && user?.id !== postAuthorId && 'hidden'
              }`}
            >
              <DeleteFeedback feedbackId={feedbackId} postId={postId} />
            </div>
            <button
              onClick={toggleReplyForm} // Toggle visibility of reply form
              className="small-medium text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
          </div>
        </div>
        <div>
          <Replies
            postAuthorId={postAuthorId}
            authorId={authorId}
            parentId={feedbackId}
            userId={userId}
            isFeedback={true}
            showReplyForm={showReplyForm}
            toggleReplyForm={toggleReplyForm}
          />
        </div>
      </div>
    );
  }
);

FeedbackItem.displayName = 'FeedbackItem';

export default PostComments;
