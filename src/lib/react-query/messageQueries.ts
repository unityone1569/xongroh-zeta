import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

import { QUERY_KEYS } from '@/lib/react-query/queryKeys';
import {
  createConversation,
  createMessage,
  deleteConversation,
  deleteMessage,
  generateParticipantsKey,
  getConversationById,
  getConversationByParticipantsKey,
  getConversations,
  getMessages,
  markMessageAsRead,
} from '../appwrite/message';
import { Conversation, Message } from '@/types';

export const useGetConversations = (userId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_CONVERSATIONS, userId],
    queryFn: ({ pageParam }) => getConversations({ pageParam, userId }),
    getNextPageParam: (lastPage: any) => {
      // Stop pagination if no more conversations
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last conversation as cursor
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: Boolean(userId),
  });
};

export const useGetConversation = (conversationId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_CONVERSATION, conversationId],
    queryFn: () => getConversationById(conversationId),
    enabled: Boolean(conversationId),
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participants: string[]) => {
      const response = await generateParticipantsKey(
        participants[0],
        participants[1]
      );

      // Check if conversation exists

      const existingConversation = await getConversationByParticipantsKey(
        response.participantsKey
      );
      if (existingConversation) {
        // Conversation exists, return it
        return existingConversation;
      } else {
        // Create new conversation
        const conversation: Conversation = {
          participants: response.participants,
          participantsKey: response.participantsKey,
          lastMessage: '',
          lastUpdated: null,
          isDeleted: [],
        };

        return await createConversation(conversation);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CONVERSATIONS],
      });
    },
  });
};

export const useGetMessages = (conversationId: string) => {
  return useInfiniteQuery({
    initialPageParam: null,
    queryKey: [QUERY_KEYS.GET_MESSAGES, conversationId],
    queryFn: ({ pageParam }) => getMessages({ pageParam, conversationId }),
    getNextPageParam: (lastPage: any) => {
      // Stop pagination if no more messages
      if (lastPage && lastPage.documents.length === 0) {
        return null;
      }

      // Use the $id of the last message as cursor
      const lastId = lastPage.documents[lastPage?.documents.length - 1].$id;
      return lastId;
    },
    enabled: Boolean(conversationId),
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ message }: { message: Message }) => createMessage(message),
    onSuccess: (_, { message: newMessage }) => {
      const conversationId = newMessage?.conversationId;

      queryClient.setQueryData(
        [QUERY_KEYS.GET_MESSAGES, conversationId],
        (oldData: any) => {
          if (oldData && Array.isArray(oldData.pages)) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => {
                if (Array.isArray(page)) {
                  return [...page, newMessage];
                }
                return page;
              }),
            };
          } else {
            return {
              pages: [[newMessage]],
              pageParams: oldData?.pageParams || [],
            };
          }
        }
      );

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CONVERSATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_MESSAGES, conversationId],
      });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      conversationId,
      userId,
    }: {
      messageId: string;
      conversationId: string;
      userId: string;
    }) => deleteMessage(messageId, conversationId, userId),
    onSuccess: ({ conversationId }: { conversationId: string }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_MESSAGES, conversationId],
      });
    },
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      conversationId,
    }: {
      messageId: string;
      conversationId: string;
    }) => markMessageAsRead(messageId, conversationId),
    onSuccess: ({ conversationId }: { conversationId: string }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_MESSAGES, conversationId],
      });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => deleteConversation(conversationId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CONVERSATIONS],
      });
    },
  });
};
