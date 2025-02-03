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
  userNotificationId:
    appwriteConfig.databases.notifications.collections.userNotification,
  communityNotificationId:
    appwriteConfig.databases.notifications.collections.communityNotification,
};

// Functions
const fn = {
  userNotificationPermissionId:
    appwriteConfig.functions.userNotificationPermission,
  communityNotificationPermissionId:
    appwriteConfig.functions.communityNotificationPermission,
};

// Create notification for likes
export async function createLikeNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.userNotificationId,
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

    await functions.createExecution(
      fn.userNotificationPermissionId,
      payload,
      true
    );

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
      cl.userNotificationId,
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

    await functions.createExecution(
      fn.userNotificationPermissionId,
      payload,
      true
    );

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
      cl.userNotificationId,
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

    await functions.createExecution(
      fn.userNotificationPermissionId,
      payload,
      true
    );

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
      cl.userNotificationId,
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
      cl.userNotificationId,
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
      cl.userNotificationId,
      notificationId
    );
    return { status: 'Ok' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// *### COMMUNITY NOTIFICATIONS ###*

// # Create community like notification
export async function createDiscussionLikeNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.communityNotificationId,
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

    await functions.createExecution(
      fn.communityNotificationPermissionId,
      payload,
      true
    );

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// # Create community comment notification
export async function createDiscussionCommentNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.communityNotificationId,
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

    await functions.createExecution(
      fn.communityNotificationPermissionId,
      payload,
      true
    );

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// # Create community reply notification
export async function createDiscussionReplyNotification(
  notification: Omit<INotification, 'isRead'>
) {
  try {
    const receiverAccountId = notification.receiverId;

    const newNotification = await databases.createDocument(
      db.notificationsId,
      cl.communityNotificationId,
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

    await functions.createExecution(
      fn.communityNotificationPermissionId,
      payload,
      true
    );

    return newNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// # Get community notifications
export async function getCommunityNotifications({
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
      cl.communityNotificationId,
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

// # Mark community notification as read
export async function markCommunityNotificationAsRead(notificationId: string) {
  try {
    return await databases.updateDocument(
      db.notificationsId,
      cl.communityNotificationId,
      notificationId,
      { isRead: true }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// # Delete community notification
export async function deleteCommunityNotification(notificationId: string) {
  try {
    await databases.deleteDocument(
      db.notificationsId,
      cl.communityNotificationId,
      notificationId
    );
    return { status: 'Ok' };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}
