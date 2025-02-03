import { ID, Query } from 'appwrite';
import { appwriteConfig, databases, functions } from './config';
import {
  createDiscussionLikeNotification,
  createLikeNotification,
} from './notification';
import { getUserAccountId } from './users';
import { getAdminAccountId } from './community';

interface DbInfo {
  databaseId: string;
  collectionId: string;
}

// *** APPWRITE ***

// Database
const db = {
  interactionsId: appwriteConfig.databases.interactions.databaseId,
  commentsId: appwriteConfig.databases.comments.databaseId,
};

// Collections
const cl = {
  postLikeId: appwriteConfig.databases.interactions.collections.postLike,
  itemLikeId: appwriteConfig.databases.interactions.collections.itemLike,
  saveId: appwriteConfig.databases.interactions.collections.save,
  commentId: appwriteConfig.databases.comments.collections.comment,
  feedbackId: appwriteConfig.databases.comments.collections.feedback,
  commentReplyId: appwriteConfig.databases.comments.collections.commentReply,
  feedbackReplyId: appwriteConfig.databases.comments.collections.feedbackReply,
};

// Functions
const fn = {
  postLikePermissionId: appwriteConfig.functions.postLikePermission,
  itemLikePermissionId: appwriteConfig.functions.itemLikePermission,
  savePermissionId: appwriteConfig.functions.savePermission,
  discussionLikePermissionId: appwriteConfig.functions.discussionLikePermission,
  discussionItemLikePermissionId:
    appwriteConfig.functions.discussionItemLikePermission,
  discussionSavePermissionId: appwriteConfig.functions.discussionSavePermission,
};

// *** POST-LIKE ***

// Get-Post-Likes-Count
export async function getPostLikeCount(postId: string): Promise<number> {
  if (!postId) return 0;

  try {
    const likes = await databases.listDocuments(
      db.interactionsId,
      cl.postLikeId,
      [Query.equal('postId', postId), Query.select(['userId'])]
    );
    return likes.total;
  } catch (error) {
    console.error('Error getting post likes count:', error);
    return 0;
  }
}

// Check-Post-Like
export async function checkPostLike(
  postId: string,
  userId: string
): Promise<boolean> {
  if (!postId || !userId) return false;

  try {
    const likes = await databases.listDocuments(
      db.interactionsId,
      cl.postLikeId,
      [
        Query.equal('userId', userId),
        Query.equal('postId', postId),
        Query.select(['userId']),
      ]
    );

    return likes.documents.length > 0;
  } catch (error) {
    console.error('Error checking post like:', error);
    return false;
  }
}

// Like-Post
export async function likePost(
  postId: string,
  authorId: string,
  userId: string,
  postType: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!postId || !userId || !authorId) return { success: false };

  try {
    // Save like record in post likes collection
    const postLike = await databases.createDocument(
      db.interactionsId,
      cl.postLikeId,
      ID.unique(),
      {
        userId,
        postId,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      postLikeId: postLike.$id,
      authorId,
    });

    await functions.createExecution(fn.postLikePermissionId, payload, true);

    // Create notification for post author
    // note: authorId is actually the accountId of the post author
    const userAccountId = await getUserAccountId(userId);

    if (authorId !== userAccountId) {
      let notificationMessage = 'liked your post.'; // default message
      if (postType === 'creation') {
        notificationMessage = 'liked your creation.';
      } else if (postType === 'project') {
        notificationMessage = 'liked your project.';
      }

      await createLikeNotification({
        receiverId: authorId,
        senderId: userId,
        type: 'like',
        resourceId: postId,
        message: notificationMessage,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error };
  }
}

// Unlike-Post
export async function unlikePost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!postId || !userId) return { success: false };
  try {
    // Find and delete like record
    const likes = await databases.listDocuments(
      db.interactionsId,
      cl.postLikeId,
      [
        Query.equal('postId', postId),
        Query.equal('userId', userId),
        Query.select(['$id']),
      ]
    );

    if (!likes.documents.length) throw Error;

    // Delete the like document
    await databases.deleteDocument(
      db.interactionsId,
      cl.postLikeId,
      likes.documents[0].$id
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { success: false, error };
  }
}

// Delete-All-Post-Likes
export async function deleteAllPostLikes(postId: string) {
  if (!postId) return;

  try {
    // Find documents with the matching postId
    const postLikes = await databases.listDocuments(
      db.interactionsId,
      cl.postLikeId,
      [Query.equal('postId', postId), Query.select(['$id'])]
    );

    // If no documents are found, throw an error
    if (postLikes.documents.length === 0) {
      // throw new Error(`No likes found for postId: ${postId}`);
      return;
    }

    // Loop through each like and delete it
    for (const like of postLikes.documents) {
      const likeId = like.$id;

      const statusCode = await databases.deleteDocument(
        db.interactionsId,
        cl.postLikeId,
        likeId
      );

      if (!statusCode) {
        throw new Error(`Failed to delete like with ID: ${likeId}`);
      }
    }

    return { status: 'Ok', postId };
  } catch (error) {
    console.error(`Error deleting likes for postId: ${postId}`, error);
    throw error;
  }
}

// *** ITEM-LIKE ***

// Helper function to get likes count
async function getLikesCount(itemId: string): Promise<number> {
  const likes = await databases.listDocuments(
    db.interactionsId,
    cl.itemLikeId,
    [Query.equal('itemId', itemId), Query.select(['userId'])]
  );
  return likes.total;
}

// Check-Item-Like
export async function checkItemLike(
  itemId: string,
  userId: string
): Promise<boolean> {
  if (!itemId || !userId) return false;

  try {
    const likes = await databases.listDocuments(
      db.interactionsId,
      cl.itemLikeId,
      [
        Query.equal('userId', userId),
        Query.equal('itemId', itemId),
        Query.select(['userId']),
      ]
    );

    return likes.documents.length > 0;
  } catch (error) {
    console.error('Error checking items like:', error);
    return false;
  }
}

// Get-Item-Likes-Count
export const getItemLikesCount = async (itemId: string): Promise<number> => {
  if (!itemId) return 0;

  try {
    return await getLikesCount(itemId);
  } catch (error) {
    console.error('Error getting item likes count:', error);
    return 0;
  }
};

// Like-Item
export async function likeItem(
  itemId: string,
  userId: string,
  authorId: string,
  postId: string,
  itemType: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!itemId || !userId || !authorId || !postId) {
    return { success: false };
  }

  try {
    // Get correct database and collection IDs
    const dbInfo = await getDbInfoByItemType(itemId, itemType);

    // Fetch item using correct database and collection
    const item = await databases.getDocument(
      dbInfo.databaseId,
      dbInfo.collectionId,
      itemId
    );

    // Convert item author's userId to accountId
    const receiverAccountId = await getUserAccountId(item.userId);

    // Save like record in item likes collection
    const itemLike = await databases.createDocument(
      db.interactionsId,
      cl.itemLikeId,
      ID.unique(),
      {
        userId: userId,
        itemId,
        postId,
      }
    );

    // trigger function-permission
    const payload = JSON.stringify({
      itemLikeId: itemLike.$id,
      authorId,
      receiverAccountId,
    });

    await functions.createExecution(fn.itemLikePermissionId, payload, true);

    // Check if item author is different from liker
    if (item.userId !== userId) {
      let notificationMessage = 'liked your item.';
      if (itemType === 'comment') {
        notificationMessage = 'liked your comment.';
      } else if (itemType === 'feedback') {
        notificationMessage = 'liked your feedback.';
      } else if (itemType === 'reply') {
        notificationMessage = 'liked your reply.';
      }

      await createLikeNotification({
        receiverId: receiverAccountId,
        senderId: userId,
        type: 'like',
        resourceId: postId,
        message: notificationMessage,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error liking item:', error);
    return {
      success: false,
      error,
    };
  }
}

// Unlike-Item
export async function unlikeItem(
  itemId: string,
  userId: string
): Promise<{ success: boolean; error?: unknown; likesCount?: number }> {
  if (!itemId || !userId) {
    return { success: false };
  }

  try {
    // Find and delete like record
    const likes = await databases.listDocuments(
      db.interactionsId,
      cl.itemLikeId,
      [
        Query.equal('itemId', itemId),
        Query.equal('userId', userId),
        Query.select(['$id']),
      ]
    );

    if (!likes.documents.length) {
      return { success: false };
    }

    // Delete the like document
    await databases.deleteDocument(
      db.interactionsId,
      cl.itemLikeId,
      likes.documents[0].$id
    );

    // Get updated likes count
    const likesCount = await getLikesCount(itemId);

    return { success: true, likesCount };
  } catch (error) {
    console.error('Error unliking item:', error);
    return { success: false, error };
  }
}

// Delete-All-Item-Likes
export async function deleteAllItemLikes(
  itemId: string
): Promise<{ status: string; interactionLikeIds?: string[] }> {
  if (!itemId) return { status: 'Error: No itemId provided' };

  try {
    const interactionLikes = await databases.listDocuments(
      db.interactionsId,
      cl.itemLikeId,
      [Query.equal('itemId', itemId), Query.select(['$id'])]
    );

    if (!interactionLikes.documents.length) {
      return { status: 'Ok' }; // No documents to delete
    }

    const interactionLikeIds = interactionLikes.documents.map(doc => doc.$id);

    await Promise.all(
      interactionLikeIds.map(id =>
        databases.deleteDocument(db.interactionsId, cl.itemLikeId, id)
      )
    );

    return { status: 'Ok', interactionLikeIds };
  } catch (error) {
    console.error(
      `Error deleting interaction likes with itemId: ${itemId}`,
      error
    );
    throw error;
  }
}

// Helper Function

async function getDbInfoByItemType(
  itemId: string,
  itemType: string
): Promise<DbInfo> {
  if (itemType === 'comment') {
    return {
      databaseId: appwriteConfig.databases.comments.databaseId,
      collectionId: appwriteConfig.databases.comments.collections.comment,
    };
  }

  if (itemType === 'feedback') {
    return {
      databaseId: appwriteConfig.databases.comments.databaseId,
      collectionId: appwriteConfig.databases.comments.collections.feedback,
    };
  }

  if (itemType === 'reply') {
    const {
      databaseId,
      collections: { commentReply, feedbackReply },
    } = appwriteConfig.databases.comments;

    try {
      const doc = await databases.getDocument(databaseId, commentReply, itemId);

      return {
        databaseId,
        collectionId: doc ? commentReply : feedbackReply,
      };
    } catch (error) {
      // If commentReply not found, use feedbackReply
      return {
        databaseId,
        collectionId: feedbackReply,
      };
    }
  }

  throw new Error('Invalid item type');
}

// *** SAVE ***

// Get-Post-Saves-Count
export async function getPostSaveCount(postId: string): Promise<number> {
  if (!postId) return 0;

  try {
    const saves = await databases.listDocuments(db.interactionsId, cl.saveId, [
      Query.equal('postId', postId),
      Query.select(['userId']),
    ]);
    return saves.total;
  } catch (error) {
    console.error('Error getting post saves count:', error);
    return 0;
  }
}

// Check-Post-Save
export async function checkPostSave(
  postId: string,
  userId: string
): Promise<boolean> {
  if (!postId || !userId) return false;
  try {
    const saves = await databases.listDocuments(db.interactionsId, cl.saveId, [
      Query.equal('userId', userId),
      Query.equal('postId', postId),
      Query.select(['userId']),
    ]);

    return saves.documents.length > 0;
  } catch (error) {
    console.error('Error checking post save:', error);
    return false;
  }
}

// Save-Post
export async function savePost(
  postId: string,
  authorId: string,
  userId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!postId || !userId || !authorId) return { success: false };

  try {
    // Save record in saves collection
    const saveRecord = await databases.createDocument(
      db.interactionsId,
      cl.saveId,
      ID.unique(),
      {
        userId,
        postId,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      saveId: saveRecord.$id,
      authorId,
    });

    await functions.createExecution(fn.savePermissionId, payload, true);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error };
  }
}

// Unsave-Post
export async function unsavePost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!postId || !userId) return { success: false };

  try {
    // Find save record
    const saves = await databases.listDocuments(db.interactionsId, cl.saveId, [
      Query.equal('postId', postId),
      Query.equal('userId', userId),
      Query.select(['$id']),
    ]);

    if (!saves.documents.length) throw Error;

    // Delete the save document
    await databases.deleteDocument(
      db.interactionsId,
      cl.saveId,
      saves.documents[0].$id
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error unsaving post:', error);
    return { success: false, error };
  }
}

// Delete-All-Post-Saves
export async function deleteAllPostSaves(postId: string) {
  if (!postId) return;

  try {
    // Find documents with the matching postId
    const postSaves = await databases.listDocuments(
      db.interactionsId,
      cl.saveId,
      [Query.equal('postId', postId), Query.select(['$id'])]
    );

    if (postSaves.documents.length === 0) {
      return;
    }

    // Delete each save
    for (const save of postSaves.documents) {
      const saveId = save.$id;

      const statusCode = await databases.deleteDocument(
        db.interactionsId,
        cl.saveId,
        saveId
      );

      if (!statusCode) {
        throw new Error(`Failed to delete like with ID: ${saveId}`);
      }
    }

    return { status: 'Ok', postId };
  } catch (error) {
    console.error(`Error deleting saves for postId: ${postId}`, error);
    throw error;
  }
}

// * ### COMMUNITY ### *

//  * # Community Likes # *

// Like-Discussion
export async function discussionLike(
  discussionId: string,
  authorId: string,
  userId: string,
  communityId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!discussionId || !userId || !authorId || !communityId)
    return { success: false };

  try {
    // Save like record in discussion likes collection
    const discussionLike = await databases.createDocument(
      db.interactionsId,
      cl.postLikeId,
      ID.unique(),
      {
        userId,
        postId: discussionId,
      }
    );

    // *# Note: We store AccountIds as adminIds in the community document directly. No need to convert it to accountId.
    const adminId = await getAdminAccountId(communityId);

    // TODO 1: update fn to add all adminIds permissions to the discussion

    // Todo 2: Do not forget to update the AppWrite-Funtion to add all adminIds permissions to the discussion

    // *# Note: This is a temporary solution to add only the first adminId
    const payload = JSON.stringify({
      postLikeId: discussionLike.$id,
      authorId,
      adminId,
    });

    await functions.createExecution(
      fn.discussionLikePermissionId,
      payload,
      true
    );

    // Create notification for post author
    // note: authorId is actually the accountId of the post author
    const userAccountId = await getUserAccountId(userId);

    // Create notification for discussion author
    if (authorId !== userAccountId) {
      await createDiscussionLikeNotification({
        receiverId: authorId,
        senderId: userId,
        type: 'like',
        resourceId: discussionId,
        message: 'liked your discussion.',
      });
    }
    return {
      success: true,
    };
  } catch (error) {
    console.error('Error liking discussion:', error);
    return { success: false, error };
  }
}

// Discussion-Like-Item
export async function discussionItemLike(
  itemId: string,
  userId: string,
  authorId: string,
  postId: string,
  itemType: string,
  communityId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!itemId || !userId || !authorId || !postId) {
    return { success: false };
  }

  try {
    // Get correct database and collection IDs
    const dbInfo = await getDbInfoByItemType(itemId, itemType);

    // Fetch item using correct database and collection
    const item = await databases.getDocument(
      dbInfo.databaseId,
      dbInfo.collectionId,
      itemId
    );

    // Convert item author's userId to accountId
    const receiverAccountId = await getUserAccountId(item.userId);

    // Save like record in item likes collection
    const itemLike = await databases.createDocument(
      db.interactionsId,
      cl.itemLikeId,
      ID.unique(),
      {
        userId: userId,
        itemId,
        postId,
      }
    );

    // *# Note: We store AccountIds as adminIds in the community document directly. No need to convert it to accountId.
    const adminId = await getAdminAccountId(communityId);

    // TODO: update fn to add all adminIds permissions to the discussion

    // *# Note: This is a temporary solution to add only the first adminId
    const payload = JSON.stringify({
      itemLikeId: itemLike.$id,
      authorId,
      receiverAccountId,
      adminId,
    });

    await functions.createExecution(
      fn.discussionItemLikePermissionId,
      payload,
      true
    );

    // Check if item author is different from liker
    if (item.userId !== userId) {
      let notificationMessage = 'liked your item.';
      if (itemType === 'comment') {
        notificationMessage = 'liked your comment.';
      } else if (itemType === 'reply') {
        notificationMessage = 'liked your reply.';
      }

      await createDiscussionLikeNotification({
        receiverId: receiverAccountId,
        senderId: userId,
        type: 'like',
        resourceId: postId,
        message: notificationMessage,
      });
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error liking item:', error);
    return {
      success: false,
      error,
    };
  }
}

// * # Community Saves # *

// Save-Discussion
export async function discussionSave(
  discussionId: string,
  authorId: string,
  userId: string,
  communityId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!discussionId || !userId || !authorId) return { success: false };

  try {
    // Save record in saves collection
    const saveRecord = await databases.createDocument(
      db.interactionsId,
      cl.saveId,
      ID.unique(),
      {
        userId,
        postId: discussionId,
      }
    );

    // *# Note: We store AccountIds as adminIds in the community document directly. No need to convert it to accountId.
    const adminId = await getAdminAccountId(communityId);

    // TODO: update fn to add all adminIds permissions to the discussion

    // *# Note: This is a temporary solution to add only the first adminId
    const payload = JSON.stringify({
      saveId: saveRecord.$id,
      authorId,
      adminId,
    });

    await functions.createExecution(
      fn.discussionSavePermissionId,
      payload,
      true
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error };
  }
}
