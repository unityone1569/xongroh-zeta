import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  useGetComments,
  useGetFeedbacks,
  useAddComment,
  useAddFeedback,
  useGetUserInfo,
} from '@/lib/react-query/queries';
import { toast } from '@/components/ui/use-toast';
import { getPostById } from '@/lib/appwrite/api';
import Loader from './Loader';
import { multiFormatDateString } from '@/lib/utils';
import { Link } from 'react-router-dom';

type PostCommentsProps = {
  postId: string;
  userId: string;
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

const PostComments = ({ postId, userId }: PostCommentsProps) => {
  const [isAuthor, setIsAuthor] = useState(false);
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

  // Check if the user is the author
  useEffect(() => {
    const checkIfAuthor = async () => {
      const post = await getPostById(postId);
      setIsAuthor(post?.creatorId === userId);
    };
    checkIfAuthor();
  }, [postId, userId]);

  const handleTabChange = useCallback(
    (tab: 'comments' | 'feedbacks') => setActiveTab(tab),
    []
  );

  // Submit handlers
  const onSubmitComment = useCallback(
    async ({ comment }: CommentFormValues) => {
      await addComment({ postId, userId, content: comment });
      commentForm.reset();
      toast({ title: 'Comment added successfully!' });
    },
    [addComment, commentForm, postId, userId]
  );

  const onSubmitFeedback = useCallback(
    async ({ feedback }: FeedbackFormValues) => {
      await addFeedback({ postId, userId, content: feedback });
      feedbackForm.reset();
      toast({ title: 'Feedback added successfully!' });
    },
    [addFeedback, feedbackForm, postId, userId]
  );

  // Filtered feedbacks based on user role
  const visibleFeedbacks = useMemo(() => {
    return feedbacks?.filter(
      (feedback) => isAuthor || feedback.accountId === userId
    );
  }, [feedbacks, isAuthor, userId]);

  // Rendered Items
  const RenderedItems = useMemo(() => {
    if (isCommentsLoading || isFeedbacksLoading) return <Loader />;
    if (activeTab === 'comments') {
      return comments?.map((comment) => (
        <CommentItem
          key={comment.$id}
          content={comment.content}
          accountId={comment.accountId}
          createdAt={comment.$createdAt}
        />
      ));
    }
    return visibleFeedbacks?.map((feedback) => (
      <FeedbackItem
        key={feedback.$id}
        content={feedback.content}
        accountId={feedback.accountId}
        createdAt={feedback.$createdAt}
      />
    ));
  }, [
    activeTab,
    comments,
    visibleFeedbacks,
    isCommentsLoading,
    isFeedbacksLoading,
  ]);

  return (
    <div className="post-comments-container">
      <div className="tabs">
        {['comments', 'feedbacks'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab as 'comments' | 'feedbacks')}
            className={`font-semibold ${
              activeTab === tab
                ? 'underline decoration-primary-500 underline-offset-8'
                : ''
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="comment-input">
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
                        className="shad-comment custom-scrollbar"
                        placeholder="Write something..."
                      />
                    </FormControl>
                    <FormMessage className="shad-form_message" />
                  </FormItem>
                )}
              />
              <Button
                className="shad-button_primary mt-4 mb-6 whitespace-nowrap"
                type="submit"
              >
                Comment
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
                        className="shad-comment custom-scrollbar"
                        placeholder="Give feedback to the creator..."
                      />
                    </FormControl>
                    <FormMessage className="shad-form_message" />
                  </FormItem>
                )}
              />
              <Button
                className="shad-button_primary mt-4 mb-6 whitespace-nowrap"
                type="submit"
              >
                Submit
              </Button>
            </form>
          </Form>
        )}
      </div>

      <div className="comments-list">{RenderedItems}</div>
    </div>
  );
};

type CommentProps = {
  content: string;
  createdAt: string;
  accountId: string;
};

const CommentItem = React.memo(
  ({ content, createdAt, accountId }: CommentProps) => {
    const { data: userData } = useGetUserInfo(accountId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dpUrl }
      : { name: '', dpUrl: '' };

      return (
        <div className="max-w-lg mx-auto px-2 py-4 rounded-lg">
          <div className="flex items-center mb-6">
            <Link to={`/profile/${accountId}`}>
              <img
                src={userInfo.dpUrl || '/assets/icons/profile-placeholder.svg'}
                alt={`${userInfo.name}'s profile picture`}
                className="rounded-full w-9 lf:h-9 mr-4"
              />
            </Link>
            <div>
              <p className="base-medium lg:body-bold text-light-1">
                {userInfo.name}
              </p>
              <p className="text-xs font-light lg:small-regular">
                {multiFormatDateString(createdAt)}
              </p>
            </div>
          </div>
          <p className="text-lg leading-relaxed ml-1 mb-3">{content}</p>
          <div className="flex justify-between items-center ml-1">
            <div>
              <a href="#" className="text-gray-500 hover:text-gray-700 mr-4">
                Like
              </a>
              <a href="#" className="text-gray-500 hover:text-gray-700">
                Reply
              </a>
            </div>
            
          </div>
        </div>
      );
  }
);

const FeedbackItem = React.memo(
  ({ content, createdAt, accountId }: CommentProps) => {
    const { data: userData } = useGetUserInfo(accountId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dpUrl }
      : { name: '', dpUrl: '' };

    return (
      <div className="max-w-lg mx-auto px-2 py-4 rounded-lg">
        <div className="flex items-center mb-6">
          <Link to={`/profile/${accountId}`}>
            <img
              src={userInfo.dpUrl || '/assets/icons/profile-placeholder.svg'}
              alt={`${userInfo.name}'s profile picture`}
              className="rounded-full w-9 lf:h-9 mr-4"
            />
          </Link>
          <div>
            <p className="base-medium lg:body-bold text-light-1">
              {userInfo.name}
            </p>
            <p className="text-xs font-light lg:small-regular">
              {multiFormatDateString(createdAt)}
            </p>
          </div>
        </div>
        <p className="text-lg leading-relaxed ml-1 mb-3">{content}</p>
        <div className="flex justify-between items-center ml-1">
          <div>
            <a href="#" className="text-gray-500 hover:text-gray-700 mr-4">
              Like
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700">
              Reply
            </a>
          </div>
          
        </div>
      </div>
    );
  }
);

export default PostComments;