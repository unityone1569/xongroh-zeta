import React, { useCallback } from 'react';
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
import {
  useAddCommentReply,
  useGetCommentReplies,
  useAddFeedbackReply,
  useGetFeedbackReplies,
  useGetUserInfo,
} from '@/lib/react-query/queries';
import Loader from './Loader';
import { toast } from '@/components/ui/use-toast';
import { multiFormatDateString } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface RepliesSectionProps {
  parentId: string;
  userId: string;
  isFeedback: boolean;
  showReplyForm: boolean;
  toggleReplyForm: () => void;
}

interface ReplyFormValues {
  reply: string;
}

// Schema validation
const replySchema = z.object({
  reply: z.string().min(1, 'Reply cannot be empty'),
});

// Textarea with ref forwarding
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'>
>((props, ref) => <BaseTextarea {...props} ref={ref} />);
Textarea.displayName = 'Textarea';

const Replies = ({
  parentId,
  userId,
  isFeedback,
  showReplyForm,
  toggleReplyForm,
}: RepliesSectionProps) => {
  const { data: replies, isLoading: isRepliesLoading } = isFeedback
    ? useGetFeedbackReplies(parentId)
    : useGetCommentReplies(parentId);

  const { mutateAsync: addReply } = isFeedback
    ? useAddFeedbackReply()
    : useAddCommentReply();

  const replyForm = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: '' },
  });

  const onSubmitReply = useCallback(
    async ({ reply }: ReplyFormValues) => {
      await addReply({ parentId, userId, content: reply });
      replyForm.reset();
      toast({ title: 'Reply added successfully!' });
      toggleReplyForm();
    },
    [addReply, parentId, userId, replyForm, toggleReplyForm]
  );

  return (
    <div className="post-comments-container ml-7 pr-3">
      <div className="replies-list">
        {isRepliesLoading ? (
          <Loader />
        ) : (
          replies?.map((reply) => (
            <ReplyItem
              key={reply.$id}
              content={reply.content}
              accountId={reply.accountId}
              createdAt={reply.$createdAt}
              toggleReplyForm={toggleReplyForm} // Pass toggleReplyForm as a prop
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
                      className="custom-scrollbar shad-reply"
                      placeholder="Write a reply..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              className="text-light-3 font-semibold text-sm md:text-base ml-2 mt-4 mb-6 whitespace-nowrap"
              type="submit"
            >
              Send
            </button>
          </form>
        </Form>
      )}
    </div>
  );
};

type ReplyItemProps = {
  content: string;
  createdAt: string;
  accountId: string;
  toggleReplyForm: () => void;
};

const ReplyItem = React.memo(
  ({ content, createdAt, accountId, toggleReplyForm }: ReplyItemProps) => {
    const { data: userData } = useGetUserInfo(accountId);
    const userInfo = userData
      ? { name: userData.name, dpUrl: userData.dpUrl }
      : { name: '', dpUrl: '' };

    return (
      <div className="w-full mx-auto px-2 pt-1 pb-5 rounded-lg">
        <div className="flex-between mb-6">
          <Link
            to={`/profile/${accountId}`}
            className="flex items-center gap-3"
          >
            <img
              src={userInfo.dpUrl || '/assets/icons/profile-placeholder.svg'}
              alt={`${userInfo.name}'s profile picture`}
              className="rounded-full w-8 h-8"
            />
            <div>
              <p className="text-base font-medium text-light-1">
                {userInfo.name}
              </p>
              <p className="text-xs font-thin ">
                {multiFormatDateString(createdAt)}
              </p>
            </div>
          </Link>
        </div>
        <p className="text-pretty leading-relaxed font-thin lg:font-normal text-sm lg:text-base ml-1 lg:ml-2 mb-3">
          {content}
        </p>
        <div className="flex justify-start gap-4 items-center ml-1 lg:ml-2">
          <img src={'/assets/icons/like.svg'} alt="like" width={20} />
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleReplyForm();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            Reply
          </button>
        </div>
      </div>
    );
  }
);

export default Replies;
