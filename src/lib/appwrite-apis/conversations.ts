import { ID, Permission, Query, Role } from 'appwrite';
import { Conversation, Message } from '@/types';
import { appwriteConfig, databases, functions } from './config';
import { getUserAccountId } from './users';
import { MessageEncryption } from '@/lib/utils/encryption';

// *** APPWRITE ***

// Database
const db = {
  conversationsId: appwriteConfig.databases.conversations.databaseId,
};

// Collections
const cl = {
  conversationId:
    appwriteConfig.databases.conversations.collections.conversation,
  messageId: appwriteConfig.databases.conversations.collections.message,
};

// Functions
const fn = {
  conversationPermissionId: appwriteConfig.functions.conversationPermission,
  messagePermissionId: appwriteConfig.functions.messagePermission,
};

// Encryption
const encrypt = {
  messageEncryption: appwriteConfig.encryption.messageEncryption,
};

// *** CONVERSATION ***

// Get-Conversations
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
      db.conversationsId,
      cl.conversationId,
      queries
    );

    // Get unread message count for each conversation
    const conversationsWithUnreadCount = await Promise.all(
      conversations.map(async (conversation) => {
        const messages = await databases.listDocuments(
          db.conversationsId,
          cl.messageId,
          [
            Query.equal('conversationId', conversation.$id),
            Query.equal('receiverId', userId),
            Query.equal('isRead', false),
          ]
        );
        return {
          ...conversation,
          unreadCount: messages.total,
        };
      })
    );

    if (!conversations || conversations.length === 0) {
      return { documents: [] };
    }

    return { documents: conversationsWithUnreadCount };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Get-Conversation-By-Id
export async function getConversationById(conversationId: string) {
  try {
    const document = await databases.listDocuments(
      db.conversationsId,
      cl.conversationId,
      [Query.equal('$id', conversationId)]
    );
    return document;
  } catch (error) {
    console.error('Error fetching conversation:', error);
    throw error;
  }
}

// Get-Conversation-By-Participants-Key
export async function getConversationByParticipantsKey(
  participantsKey: string
) {
  try {
    const response = await databases.listDocuments(
      db.conversationsId,
      cl.conversationId,
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

// Create-Conversation
export async function createConversation(conversation: Conversation) {
  try {
    // Extract senderId and receiverId
    const [senderId, receiverId] = conversation.participants;

    // Create the conversation document with sender permissions
    const senderPermissions = [
      Permission.read(Role.user(senderId)),
      Permission.update(Role.user(senderId)),
      Permission.delete(Role.user(senderId)),
    ];

    const document = await databases.createDocument(
      db.conversationsId,
      cl.conversationId,
      ID.unique(),
      conversation,
      senderPermissions
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      conversationId: document.$id,
      receiverId,
    });

    await functions.createExecution(fn.conversationPermissionId, payload, true);

    return document;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Update-Conversation
export const updateConversation = async (
  conversationId: string,
  updates: Partial<Conversation>
) => {
  return await databases.updateDocument(
    db.conversationsId,
    cl.conversationId,
    conversationId,
    updates
  );
};

// Delete-Conversation
export async function deleteConversation(
  conversationId: string,
  userId: string
) {
  try {
    const conversation = await databases.getDocument(
      db.conversationsId,
      cl.conversationId,
      conversationId
    );

    // Get all messages for this conversation
    const messages = await databases.listDocuments(
      db.conversationsId,
      cl.messageId,
      [Query.equal('conversationId', conversationId)]
    );

    // Mark all messages as deleted for this user
    const messageUpdatePromises = messages.documents.map((message) => {
      const updatedMessageIsDeleted = [...(message.isDeleted || []), userId];
      return databases.updateDocument(
        db.conversationsId,
        cl.messageId,
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
        databases.deleteDocument(db.conversationsId, cl.messageId, message.$id)
      );

      await Promise.all(deleteMessagePromises);
      await databases.deleteDocument(
        db.conversationsId,
        cl.conversationId,
        conversationId
      );
    } else {
      // Soft delete conversation
      await databases.updateDocument(
        db.conversationsId,
        cl.conversationId,
        conversationId,
        { isDeleted: updatedIsDeleted }
      );
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}

// *** MESSAGE ***

// Create-Message
export async function createMessage(message: Message) {
  try {
    const encryptedContent = await MessageEncryption.encrypt(
      message.content,
      encrypt.messageEncryption
    );

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
      db.conversationsId,
      cl.messageId,
      ID.unique(),
      {
        ...message,
        content: encryptedContent,
      },
      senderPermissions
    );

    // Update the conversation's last message and timestamp
    await databases.updateDocument(
      db.conversationsId,
      cl.conversationId,
      message.conversationId,
      {
        lastMsgId: newMessage.$id,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      messageId: newMessage.$id,
      receiverAccountId,
    });

    await functions.createExecution(fn.messagePermissionId, payload, true);

    return newMessage;
  } catch (error) {
    console.error('Error creating message:', error);
    throw error;
  }
}

// Get-Message-By-Id
export async function getMessageById(messageId: string) {
  try {
    const message = await databases.getDocument(
      db.conversationsId,
      cl.messageId,
      messageId
    );

    return message;
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
  }
}

// Get-Messages
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
      db.conversationsId,
      cl.messageId,
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

// Delete-Message (Soft Delete and Hard Delete)
export async function deleteMessage(
  messageId: string,
  userId: string,
  conversationId: string
) {
  try {
    const message = await databases.getDocument(
      db.conversationsId,
      cl.messageId,
      messageId
    );

    const updatedIsDeleted = [...message.isDeleted, userId];

    if (
      updatedIsDeleted.includes(message.senderId) &&
      updatedIsDeleted.includes(message.receiverId)
    ) {
      const messages = await databases.listDocuments(
        db.conversationsId,
        cl.messageId,
        [Query.equal('conversationId', conversationId)]
      );

      if (messages.documents.length === 1) {
        await deleteConversation(conversationId, userId);
      }

      await databases.deleteDocument(
        db.conversationsId,
        cl.messageId,
        messageId
      );
    } else {
      await databases.updateDocument(
        db.conversationsId,
        cl.messageId,
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

// Mark-Message-As-Read
export async function markMessageAsRead(
  messageId: string,
  conversationId: string
) {
  try {
    await databases.updateDocument(
      db.conversationsId,
      cl.messageId,
      messageId,
      { isRead: true }
    );
    return { conversationId };
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
}

// *** UTILS ***

// Generate-Participants-Key
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
