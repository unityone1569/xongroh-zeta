import { databases, appwriteConfig, client } from '@/lib/appwrite/config';
import { Conversation, Message } from '@/types';
import { Functions, ID, Permission, Query, Role } from 'appwrite';
import { getUserAccountId } from './user';

/** Create conversations */
export async function createConversation(conversation: Conversation) {
  try {
    const functions = new Functions(client);

    // Extract senderId and receiverId
    const [senderId, receiverId] = conversation.participants;

    // Create the conversation document with sender permissions
    const senderPermissions = [
      Permission.read(Role.user(senderId)),
      Permission.update(Role.user(senderId)),
      Permission.delete(Role.user(senderId)),
    ];

    const document = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      ID.unique(),
      conversation,
      senderPermissions
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      conversationId: document.$id,
      receiverId,
    });

    await functions.createExecution(
      appwriteConfig.addConversationReceiverFunctionId,
      payload,
      true
    );

    return document;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Update a conversation document by its ID
export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation>
) => {
  return await databases.updateDocument(
    appwriteConfig.databaseId,
    appwriteConfig.conversationCollectionId,
    conversationId,
    updates
  );
};

/** Fetch conversations for a specific user */
export async function getConversations({
  pageParam,
  userId,
}: {
  pageParam: string | null;
  userId: string;
}) {
  const accountId1 = await getUserAccountId(userId);
  const queries: any[] = [
    Query.orderDesc('$updatedAt'),
    Query.equal('participants', accountId1),
    Query.limit(11),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: conversations } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      queries
    );

    if (!conversations || conversations.length === 0) {
      return { documents: [] };
    }

    return { documents: conversations };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/** Get a conversation by participantsKey */
export async function getConversationByParticipantsKey(
  participantsKey: string
) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      [Query.equal('participantsKey', participantsKey)]
    );

    if (response.documents.length > 0) {
      return response.documents[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

export async function getConversationById(conversationId: string) {
  try {
    const document = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      [Query.equal('$id', conversationId)]
    );
    return document;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

/** Delete a conversation for a user */
export async function deleteConversation(
  conversationId: string,
  userId: string
) {
  try {
    const conversation = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      conversationId
    );

    // Get all messages for this conversation
    const messages = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      [Query.equal('conversationId', conversationId)]
    );

    // Mark all messages as deleted for this user
    const messageUpdatePromises = messages.documents.map((message) => {
      const updatedMessageIsDeleted = [...(message.isDeleted || []), userId];
      return databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.messageCollectionId,
        message.$id,
        { isDeleted: updatedMessageIsDeleted }
      );
    });

    // Update messages in parallel
    await Promise.all(messageUpdatePromises);

    const updatedIsDeleted = [...(conversation.isDeleted || []), userId];

    if (updatedIsDeleted.length === conversation.participants.length) {
      // All participants deleted the conversation - hard delete everything
      const deleteMessagePromises = messages.documents.map((message) =>
        databases.deleteDocument(
          appwriteConfig.databaseId,
          appwriteConfig.messageCollectionId,
          message.$id
        )
      );

      await Promise.all(deleteMessagePromises);
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.conversationCollectionId,
        conversationId
      );
    } else {
      // Soft delete conversation
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.conversationCollectionId,
        conversationId,
        { isDeleted: updatedIsDeleted }
      );
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

/** Create a new message in an existing conversation */
export async function createMessage(message: Message) {
  try {
    const functions = new Functions(client);

    // Retrieve account IDs for sender and receiver
    const [senderAccountId, receiverAccountId] = await Promise.all([
      getUserAccountId(message.senderId),
      getUserAccountId(message.receiverId),
    ]);

    // Set permissions using account IDs
    const senderPermissions = [
      Permission.read(Role.user(senderAccountId)),
      Permission.update(Role.user(senderAccountId)),
      Permission.delete(Role.user(senderAccountId)),
    ];

    // Create the message document with permissions
    const newMessage = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      ID.unique(),
      message,
      senderPermissions
    );

    // Update the conversation's last message and timestamp
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.conversationCollectionId,
      message.conversationId,
      {
        lastMessage: message.content,
        lastUpdated: new Date().toISOString(),
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      messageId: newMessage.$id,
      receiverAccountId,
    });

    await functions.createExecution(
      appwriteConfig.addMessageReceiverFunctionId,
      payload,
      true
    );

    return newMessage;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

/** Fetch paginated messages for a conversation */
export async function getMessages({
  pageParam,
  conversationId,
}: {
  pageParam: string | null;
  conversationId: string;
}) {
  const queries: any[] = [
    Query.orderDesc('$createdAt'),
    Query.equal('conversationId', conversationId),
    Query.limit(11),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: messages } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      queries
    );

    if (!messages || messages.length === 0) {
      return { documents: [] };
    }

    return { documents: messages };
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}
/** Soft delete or hard delete a message */
export async function deleteMessage(
  messageId: string,
  userId: string,
  conversationId: string
) {
  try {
    const message = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      messageId
    );

    const updatedIsDeleted = [...message.isDeleted, userId];

    if (
      updatedIsDeleted.includes(message.senderId) &&
      updatedIsDeleted.includes(message.receiverId)
    ) {
      const messages = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.messageCollectionId,
        [Query.equal('conversationId', conversationId)]
      );

      if (messages.documents.length === 1) {
        await deleteConversation(conversationId, userId);
      }

      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.messageCollectionId,
        messageId
      );
    } else {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.messageCollectionId,
        messageId,
        { isDeleted: updatedIsDeleted }
      );
    }

    return { conversationId };
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

/** Mark a message as read */
export async function markMessageAsRead(
  messageId: string,
  conversationId: string
) {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.messageCollectionId,
      messageId,
      { isRead: true }
    );
    return { conversationId };
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

export async function generateParticipantsKey(
  userId1: string,
  userId2: string
): Promise<{ participantsKey: string; participants: string[] }> {
  try {
    const accountId1 = await getUserAccountId(userId1);
    const accountId2 = await getUserAccountId(userId2);

    return {
      participantsKey: [userId1, userId2].sort().join('_'),
      participants: [accountId1, accountId2],
    };
  } catch (error) {
    console.error('Error generating participants key:', error);
    throw error;
  }
}
