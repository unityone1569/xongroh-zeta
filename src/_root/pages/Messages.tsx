import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useUserContext } from '@/context/AuthContext';

import { multiFormatDateString } from '@/lib/utils/utils';
import Loader from '@/components/shared/Loader';
import { Models } from 'appwrite';
import { DeleteConversation } from '@/components/shared/DeleteItems';
import { MessageEncryption } from '@/lib/utils/encryption';
import { appwriteConfig } from '@/lib/appwrite-apis/config';
import {
  useGetConversations,
  useGetMessageById,
} from '@/lib/tanstack-queries/conversationsQueries';
import { useGetUserInfo } from '@/lib/tanstack-queries/usersQueries';

// *** APPWRITE ***

// Encryption
const encrypt = {
  messageEncryption: appwriteConfig.encryption.messageEncryption,
};

interface ConversationCardProps {
  conversation: Models.Document & {
    unreadCount?: number;
  };
  currentUserId: string;
}

const DecryptedMessage = ({
  encryptedContent,
}: {
  encryptedContent: string;
}) => {
  const [decryptedContent, setDecryptedContent] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const decryptMessage = async () => {
      try {
        const content = await MessageEncryption.decrypt(
          encryptedContent,
          encrypt.messageEncryption
        );
        setDecryptedContent(content);
      } catch (err) {
        console.error('Decryption failed:', err);
        setError(true);
      }
    };

    decryptMessage();
  }, [encryptedContent]);

  if (error)
    return <span className="text-red-500">Failed to decrypt message</span>;
  if (!decryptedContent) return <span>Decrypting...</span>;

  return <span>{decryptedContent}</span>;
};

const ConversationCard = ({
  conversation,
  currentUserId,
}: ConversationCardProps) => {
  const otherParticipantId = conversation.participantsKey
    .split('_')
    .find((id: string) => id !== currentUserId);
  const { data: message, isLoading: isLoadingMsg } = useGetMessageById(
    conversation?.lastMsgId
  );

  const { data: userData, isLoading } = useGetUserInfo(otherParticipantId);
  const unreadCount = conversation.unreadCount || 0;

  const participantsKey = conversation?.participantsKey ?? '';
  const participants = participantsKey.split('_');
  const isLastMessageFromMe = participants.includes(currentUserId);
  const isLastMessageRead = message?.isRead ?? false;

  if (isLoading || isLoadingMsg) return <Loader />;

  return (
    <div className="block">
      <div className="flex items-center justify-between gap-3.5 p-3.5 rounded-lg bg-dark-2 border border-dark-4 hover:bg-dark-3 transition-colors">
        <Link
          to={`/chat/${conversation?.$id}`}
          className="flex items-center gap-3.5 "
        >
          <div className="relative flex-shrink-0">
            <img
              src={userData?.dp || '/assets/icons/profile-placeholder.svg'}
              alt={userData?.name || 'User'}
              className="w-9 h-9 rounded-full object-cover"
            />
            {unreadCount > 0 && (
              <span className=" bg-gradient-to-r from-purple-500 to-purple-400 absolute -top-2 -right-2 text-white px-2 py-1 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <h3 className="small-semibold line-clamp-1 lg:base-bold text-light-1">
                {userData?.name || 'Unknown User'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <p className="subtle-semibold text-light-3 lg:small-semibold line-clamp-1">
                {message?.content ? (
                  <DecryptedMessage encryptedContent={message.content} />
                ) : (
                  'No messages yet'
                )}
              </p>
            </div>
          </div>
        </Link>

        <div className="flex-center flex flex-shrink-0 gap-3.5">
          <div className="flex-center flex-col">
            {isLastMessageFromMe && (
              <span className="flex items-center">
                {isLastMessageRead ? (
                  <div className="relative flex items-center">
                    <div className="relative w-5 h-5">
                      <img
                        src="/assets/icons/isRead.svg"
                        alt="Read"
                        className="absolute top-0 left-0 w-4 h-4"
                      />
                      <img
                        src="/assets/icons/isRead.svg"
                        alt="Read"
                        className="absolute left-[4px] w-4 h-4"
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
            {message?.$createdAt && (
              <span className="tiny-medium text-nowrap text-light-3">
                {multiFormatDateString(conversation?.$updatedAt)}
              </span>
            )}
          </div>
          <DeleteConversation
            conversationId={conversation.$id}
            userId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
};

const Messages = () => {
  const { user } = useUserContext();
  const { ref, inView } = useInView();
  const navigate = useNavigate();

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate('/sign-in');
    }
  }, [user, navigate]);

  const {
    data: conversations,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useGetConversations(user?.id); // Add optional chaining here

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  if (!user) return null;
  if (isLoading) return <Loader />;

  return (
    <div className="common-container">
      <div className="max-w-3xl w-full mx-auto py-8">
        <h2 className="h3-bold md:h2-bold w-full mb-6">Messages</h2>

        <div className="flex flex-col gap-4">
          {!conversations?.pages ||
          conversations.pages.length === 0 ||
          conversations.pages[0].documents.length === 0 ? (
            <p className="text-light-4 text-start">No conversations yet</p>
          ) : (
            conversations.pages.map((page, pageIndex) => (
              <React.Fragment key={pageIndex}>
                {page?.documents
                  .filter(
                    (conv: Models.Document) =>
                      !conv.isDeleted?.includes(user.id)
                  )
                  .map((conversation: Models.Document) => (
                    <ConversationCard
                      key={conversation.$id}
                      conversation={conversation}
                      currentUserId={user.id}
                    />
                  ))}
              </React.Fragment>
            ))
          )}

          {hasNextPage && (
            <div ref={ref} className="mt-10">
              <Loader />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
