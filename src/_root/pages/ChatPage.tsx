import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useUserContext } from '@/context/AuthContext';
import {
  useCreateMessage,
  useGetMessages,
  useGetConversation,
  useMarkMessageAsRead,
} from '@/lib/react-query/messageQueries';
import Loader from '@/components/shared/Loader';
import { Link, useParams } from 'react-router-dom';
import { multiFormatDateString } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { useGetUserInfo } from '@/lib/react-query/queries';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { Models } from 'appwrite';
import { useInView } from 'react-intersection-observer';
import { client, appwriteConfig } from '@/lib/appwrite/config';

const MessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4096, 'Message too big'),
});

interface MessagesListProps {
  messages: {
    pages: {
      documents: Models.Document[];
    }[];
  };
  senderId: string;
  fetchNextPage: () => void;
  hasNextPage: boolean;
}

const MessagesList: React.FC<MessagesListProps> = React.memo(
  ({ messages, senderId, fetchNextPage, hasNextPage }) => {
    const { ref, inView } = useInView();
    const { mutate: markAsRead } = useMarkMessageAsRead();

    // Effect to mark messages as read
    useEffect(() => {
      messages.pages.forEach((page) => {
        page.documents.forEach((message) => {
          // Only mark messages from other user that are unread
          if (message.senderId !== senderId && !message.isRead) {
            markAsRead({
              messageId: message.$id,
              conversationId: message.conversationId,
            });
          }
        });
      });
    }, [messages.pages, senderId, markAsRead]);

    useEffect(() => {
      if (inView && hasNextPage) {
        fetchNextPage();
      }
    }, [inView, hasNextPage, fetchNextPage]);

    return (
      <div className="flex flex-col-reverse w-full">
        {messages.pages.map((page, pageIndex) => (
          <div key={pageIndex} className="flex flex-col-reverse">
            {page.documents
              .filter((message) => !message.isDeleted?.includes(senderId))
              .filter((message) => message?.content)
              .map((message) => (
                <div
                  key={message.$id}
                  className={`flex ${
                    message.senderId === senderId
                      ? 'justify-end mt-3.5'
                      : 'justify-start mt-3.5'
                  }`}
                >
                  <div
                    className={`max-w-[290px] md:max-w-md p-3 rounded-lg ${
                      message.senderId === senderId
                        ? 'bg-purple-950 text-white'
                        : 'bg-dark-4'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    <span className="text-xs opacity-50 flex items-center">
                      {multiFormatDateString(message.$createdAt)}
                      {message.senderId === senderId && (
                        <span className="ml-2">
                          {message.isRead ? (
                            <div className="relative flex items-center">
                              <div className="relative w-4 h-4">
                                <img
                                  src="/assets/icons/isRead.svg"
                                  alt="Read"
                                  className="absolute top-0 left-0 w-4 h-4"
                                />
                                <img
                                  src="/assets/icons/isRead.svg"
                                  alt="Read"
                                  className="absolute left-[5px] w-4 h-4"
                                />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <img
                                src="/assets/icons/isRead.svg"
                                alt="Delivered"
                                className="w-4 h-4"
                              />
                            </div>
                          )}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        ))}

        {hasNextPage && (
          <div ref={ref} className="flex justify-center py-2">
            <Loader />
          </div>
        )}
      </div>
    );
  }
);

const ChatPage = () => {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { id } = useParams<{ id: string }>();
  const convId = id || '';
  const { user } = useUserContext();
  const senderId = user?.id || '';
  const [isSending, setIsSending] = useState(false);

  const form = useForm<z.infer<typeof MessageSchema>>({
    resolver: zodResolver(MessageSchema),
    defaultValues: {
      message: '',
    },
  });

  const { data: conversationData, isLoading: isConversationLoading } =
    useGetConversation(convId);

  const participantsKey =
    conversationData?.documents?.[0]?.participantsKey || '';
  const participants = participantsKey.split('_');
  const receiverId = participants.find((id: string) => id !== senderId) || '';

  const { data: receiverData, isLoading: isReceiverLoading } =
    useGetUserInfo(receiverId);

  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    refetch: refetchMessages,
  } = useGetMessages(convId);

  const { mutateAsync: createMessage } = useCreateMessage();

  const handleTextareaInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      const minHeight = 44;
      if (target.scrollHeight > minHeight) {
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }
    },
    []
  );

  // Scroll to bottom for new messages
  useEffect(() => {
    if (messagesContainerRef.current && messagesData?.pages[0]) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messagesData?.pages[0]]);

  // Add subscription for real-time updates
  useEffect(() => {
    if (!convId) return;

    // Subscribe to messages collection
    const unsubscribe = client.subscribe(
      `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.messageCollectionId}.documents`,
      (response) => {
        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.create'
          )
        ) {
          // Check if the message belongs to this conversation
          const payload = response.payload as { conversationId: string };
          if (payload.conversationId === convId) {
            refetchMessages();
          }
        }

        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.delete'
          )
        ) {
          const payload = response.payload as { conversationId: string };
          if (payload.conversationId === convId) {
            refetchMessages();
          }
        }

        if (
          response.events.includes(
            'databases.*.collections.*.documents.*.update'
          )
        ) {
          const payload = response.payload as { conversationId: string };
          if (payload.conversationId === convId) {
            refetchMessages();
          }
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [convId, refetchMessages]);

  const onSubmit = async (data: z.infer<typeof MessageSchema>) => {
    if (!receiverId || !convId || !data.message.trim()) return;

    setIsSending(true);
    try {
      await createMessage({
        message: {
          content: data.message.trim(),
          senderId: senderId,
          receiverId: receiverId,
          conversationId: convId,
          isDeleted: [],
          isRead: false,
        },
      });
      form.reset();

      // No need to manually update messages as subscription will handle it
    } finally {
      setIsSending(false);
    }
  };

  if (!convId || !receiverId || isConversationLoading || isReceiverLoading) {
    return <Loader />;
  }

  return (
    <div className="common-msg-container flex flex-col ">
      <div className=" w-full max-w-3xl p-3 border-b-2 border-dark-4 mb-3">
        <Link
          to={`/profile/${receiverId}`}
          className="flex items-center gap-3.5"
        >
          <img
            src={receiverData?.dp || '/default-avatar.png'}
            alt={`${receiverData?.name}'s avatar`}
            className="w-11 h-11 lg:h-14 lg:w-14 object-cover rounded-full"
          />
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold">{receiverData?.name}</h2>
            <p className="subtle-normal text-light-3">
              {receiverData?.profession || 'Creator'}
            </p>
          </div>
        </Link>
      </div>

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto mb-5 lg:mb-9 w-full rounded-lg custom-scrollbar pl-4 pr-3 max-w-3xl h-[600px] pb-3"
      >
        {isMessagesLoading ? (
          <Loader />
        ) : messagesData?.pages.every((page) => page.documents.length === 0) ? (
          <div className="flex-center w-full h-full">
            <p className="text-light-3">No messages yet</p>
          </div>
        ) : (
          <MessagesList
            messages={messagesData || { pages: [] }}
            senderId={senderId}
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage ?? false}
          />
        )}
      </div>

      <div className="w-full max-w-3xl px-3">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex items-end justify-between gap-3 w-full"
          >
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="grow">
                  <FormMessage className="shad-form_message pl-1.5 w-full" />
                  <FormControl>
                    <Textarea
                      {...field}
                      className="shad-msg-textarea"
                      placeholder="Type your message..."
                      onInput={handleTextareaInput}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="shad-button_primary whitespace-nowrap grow-0"
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ChatPage;
