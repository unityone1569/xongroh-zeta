// src/lib/appwrite-apis/notifications.ts
import { ID, Query } from 'appwrite';
import { appwriteConfig, databases, functions } from './config';
import { INotification } from '@/types';

// Collections
const db = {
  notificationsId: appwriteConfig.databases.notifications.databaseId,
};

// Collections
const cl = {
  notificationId:
    appwriteConfig.databases.notifications.collections.notification,
};

// Functions
const fn = {
  notificationPermissionId: appwriteConfig.functions.notificationPermission,
};

// Create notification
export async function createLikeNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.notificationId,
      ID.unique(),
      {
        ...notification,
        isRead: false,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      notificationId: newNotification.$id,
      receiverAccountId,
    });

    await functions.createExecution(fn.notificationPermissionId, payload, true);

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// notification for comments/feedbacks
export async function createCommentNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.notificationId,
      ID.unique(),
      {
        ...notification,
        isRead: false,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      notificationId: newNotification.$id,
      receiverAccountId,
    });

    await functions.createExecution(fn.notificationPermissionId, payload, true);

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// notification for replies
export async function createReplyNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.notificationId,
      ID.unique(),
      {
        ...notification,
        isRead: false,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      notificationId: newNotification.$id,
      receiverAccountId,
    });

    await functions.createExecution(fn.notificationPermissionId, payload, true);

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Get user notifications
export async function getUserNotifications({
  pageParam,
  receiverId,
}: {
  pageParam: string | null;
  receiverId: string;
}) {
  const queries: any[] = [
    Query.equal('receiverId', receiverId),
    Query.orderDesc('$createdAt'),
    Query.limit(15),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: notifications } = await databases.listDocuments(
      db.notificationsId,
      cl.notificationId,
      queries
    );

    if (!notifications || notifications.length === 0) {
      return { documents: [] };
    }

    return { documents: notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    return await databases.updateDocument(
      db.notificationsId,
      cl.notificationId,
      notificationId,
      { isRead: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  try {
    await databases.deleteDocument(
      db.notificationsId, 
      cl.notificationId,
      notificationId
    );
    return { status: 'Ok' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}