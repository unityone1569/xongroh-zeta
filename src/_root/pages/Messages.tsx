import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useUserContext } from '@/context/AuthContext';
import { useGetConversations } from '@/lib/react-query/messageQueries';
import { useGetUserInfo } from '@/lib/react-query/queries';
import { multiFormatDateString } from '@/lib/utils';
import Loader from '@/components/shared/Loader';
import { Models } from 'appwrite';
import { DeleteConversation } from '@/components/shared/DeleteItems';

interface ConversationCardProps {
  conversation: Models.Document;
  currentUserId: string;
}

const ConversationCard = ({
  conversation,
  currentUserId,
}: ConversationCardProps) => {
  const otherParticipantId = conversation.participantsKey
    .split('_')
    .find((id: string) => id !== currentUserId);

  const { data: userData, isLoading } = useGetUserInfo(otherParticipantId);

  if (isLoading) return <Loader />;

  return (
    <div className="block">
      <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-dark-2 border border-dark-4 hover:bg-dark-3 transition-colors">
        <div className='w-3/4'>
          <Link
            to={`/chat/${conversation?.$id}`}
            className="flex items-center gap-3.5"
          >
            <img
              src={userData?.dp || '/assets/icons/profile-placeholder.svg'}
              alt={userData?.name || 'User'}
              className="w-11 h-11 rounded-full object-cover"
            />
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="small-semibold lg:base-bold text-light-1">
                {userData?.name || 'Unknown User'}
              </h3>
              <p className="subtle-semibold text-light-3 lg:small-semibold line-clamp-1">
                {conversation?.lastMessage || 'No messages yet'}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3.5 whitespace-nowrap">
          {conversation?.lastUpdated && (
            <span className="subtle-normal text-light-3">
              {multiFormatDateString(conversation?.lastUpdated)}
            </span>
          )}
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
