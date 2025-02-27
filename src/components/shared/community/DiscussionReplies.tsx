// DiscussionReplies.tsx
import React, { useCallback } from 'react';
import { useUserContext } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Textarea as BaseTextarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Models } from 'appwrite';
import { multiFormatDateStringNoTime } from '@/lib/utils/utils';
import { Link } from 'react-router-dom';
import DiscussionLikedItems from './DiscussionLikedItems';
import {
  useGetCommentReplies,
  useAddDiscussionCommentReply,
} from '@/lib/tanstack-queries/commentsQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';
import Loader from '../Loader';
import { DeleteCommentReply } from '../DeleteItems';

interface RepliesSectionProps {
  authorId: string;
  postAuthorId: string;
  parentId: string;
  userId: string;
  showReplyForm: boolean;
  toggleReplyForm: () => void;
  discussionId: string;
  communityId: string;
}

interface ReplyFormValues {
  reply: string;
}

const replySchema = z.object({
  reply: z.string().min(1, 'Reply cannot be empty'),
});

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>((props, ref) => <BaseTextarea {...props} ref={ref} />);
Textarea.displayName = 'Textarea';

const DiscussionReplies = ({
  authorId,
  postAuthorId,
  parentId,
  userId,
  showReplyForm,
  toggleReplyForm,
  discussionId,
  communityId,
}: RepliesSectionProps) => {
  const { toast } = useToast();
  const { data: replies, isLoading: isRepliesLoading } =
    useGetCommentReplies(parentId);
  const { mutateAsync: addReply } = useAddDiscussionCommentReply();

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: '' },
  });

  const {
    formState: { isSubmitting },
  } = replyForm;

  const onSubmitReply = useCallback(
    async ({ reply }: ReplyFormValues) => {
      try {
        await addReply({
          parentId,
          authorId,
          postAuthorId,
          userId,
          content: reply,
          discussionId,
          communityId,
        });
        replyForm.reset();
        toast({
          description: 'Reply added successfully!',
        });
        toggleReplyForm();
      } catch (error) {
        toast({
          description: 'Failed to add reply. Please try again.',
        });
      }
    },
    [
      addReply,
      parentId,
      authorId,
      postAuthorId,
      userId,
      communityId,
      replyForm,
      toast,
      toggleReplyForm,
    ]
  );

  return (
    <div className="ml-5 pt-3.5">
      <div className="replies-list">
        {isRepliesLoading ? (
          <Loader />
        ) : (
          replies?.map((reply) => (
            <ReplyItem
              key={reply.$id}
              content={reply.content}
              createdAt={reply.$createdAt}
              creatorId={reply.userId}
              authorId={authorId}
              postAuthorId={postAuthorId}
              item={reply}
              toggleReplyForm={toggleReplyForm}
              parentId={parentId}
              discussionId={discussionId}
              communityId={communityId}
            />
          ))
        )}
      </div>

      {showReplyForm && (
        <Form {...replyForm}>
          <form onSubmit={replyForm.handleSubmit(onSubmitReply)}>
            <FormField
              control={replyForm.control}
              name="reply"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="custom-scrollbar subtle-comment md:small-regular pl-3.5 pt-3.5 shad-reply"
                      placeholder="Write a reply..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              className={`text-light-3 font-semibold text-sm md:text-base ml-2 mt-4 mb-6 whitespace-nowrap
                ${isSubmitting ? 'opacity-50' : ''}`}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending' : 'Send'}
            </button>
          </form>
        </Form>
      )}
    </div>
  );
};

const ReplyItem = React.memo(
  ({
    content,
    createdAt,
    creatorId,
    authorId,
    postAuthorId,
    item,
    toggleReplyForm,
    parentId,
    discussionId,
    communityId,
  }: {
    content: string;
    createdAt: string;
    creatorId: string;
    authorId: string;
    postAuthorId: string;
    item: Models.Document;
    toggleReplyForm: () => void;
    parentId: string;
    discussionId: string;
    communityId: string;
  }) => {
    const { user } = useUserContext();
    const { data: userData } = useGetUserInfo(creatorId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dp }
      : { name: '', dpUrl: '' };

    return (
      <div className="w-full mx-auto pl-2 py-4 rounded-lg">
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
                {multiFormatDateStringNoTime(createdAt)}
              </p>
            </div>
          </Link>
        </div>
        <p className="text-pretty leading-relaxed subtle-comment md:small-regular ml-1 lg:ml-2 mb-3">
          {content}
        </p>
        <div className="flex justify-between items-center ml-1">
          <div className="flex gap-5 items-center">
            <DiscussionLikedItems
              item={item}
              userId={user.id}
              authorId={authorId}
              postId={discussionId}
              itemType="reply"
              communityId={communityId}
            />
            <button
              onClick={toggleReplyForm}
              className="small-medium text-gray-500 hover:text-gray-700"
            >
              Reply
            </button>
          </div>
          <div
            className={`${
              user?.id !== creatorId && user?.id !== postAuthorId && 'hidden'
            }`}
          >
            <DeleteCommentReply
              commentReplyId={item.$id}
              commentId={parentId}
            />
          </div>
        </div>
      </div>
    );
  }
);

ReplyItem.displayName = 'ReplyItem';

export default DiscussionReplies;
