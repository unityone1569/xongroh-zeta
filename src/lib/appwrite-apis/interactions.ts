import { ID, Query } from 'appwrite';
import { appwriteConfig, databases, functions } from './config';

// *** APPWRITE ***

// Database
const db = {
  interactionsId: appwriteConfig.databases.interactions.databaseId,
};

// Collections
const cl = {
  postLikeId: appwriteConfig.databases.interactions.collections.postLike,
  itemLikeId: appwriteConfig.databases.interactions.collections.itemLike,
  saveId: appwriteConfig.databases.interactions.collections.save,
};

// Functions
const fn = {
  postLikePermissionId: appwriteConfig.functions.postLikePermission,
  itemLikePermissionId: appwriteConfig.functions.itemLikePermission,
  savePermissionId: appwriteConfig.functions.savePermission,
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
      [Query.equal('userId', userId), Query.equal('postId', postId)]
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
  userId: string
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
      [Query.equal('postId', postId), Query.equal('userId', userId)]
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
      [Query.equal('postId', postId)]
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
    [Query.equal('itemId', itemId)]
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
      [Query.equal('userId', userId), Query.equal('itemId', itemId)]
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
  authorId: string
): Promise<{ success: boolean; error?: unknown }> {
  if (!itemId || !userId || !authorId) {
    return { success: false };
  }

  try {
    // Save like record in item likes collection
    const itemLike = await databases.createDocument(
      db.interactionsId,
      cl.itemLikeId,
      ID.unique(),
      {
        userId: userId,
        itemId,
      }
    );

    // trigger function-permission
    const payload = JSON.stringify({
      itemLikeId: itemLike.$id,
      authorId,
    });

    await functions.createExecution(fn.itemLikePermissionId, payload, true);

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
      [Query.equal('itemId', itemId), Query.equal('userId', userId)]
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

// Delete-Item-Likes
export async function deleteItemLike(
  itemId: string
): Promise<{ status: string; interactionLikeId?: string }> {
  if (!itemId) return { status: 'Error: No itemId provided' };

  try {
    const interactionLike = await databases.listDocuments(
      db.interactionsId,
      cl.itemLikeId,
      [Query.equal('itemId', itemId)]
    );

    if (!interactionLike.documents.length) {
      return { status: 'Ok' }; // No documents to delete
    }

    const interactionLikeId = interactionLike.documents[0].$id;

    await databases.deleteDocument(
      db.interactionsId,
      cl.itemLikeId,
      interactionLikeId
    );

    return { status: 'Ok', interactionLikeId };
  } catch (error) {
    console.error(
      `Error deleting interaction like with itemId: ${itemId}`,
      error
    );
    throw error;
  }
}

// *** SAVE ***

// Get-Post-Saves-Count
export async function getPostSaveCount(postId: string): Promise<number> {
  if (!postId) return 0;

  try {
    const saves = await databases.listDocuments(db.interactionsId, cl.saveId, [
      Query.equal('postId', postId),
      Query.select(['postId']),
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
      [Query.equal('post', postId)]
    );

    if (postSaves.documents.length === 0) {
      return;
    }

    // Delete each save
    for (const save of postSaves.documents) {
      const saveId = save.$id;

      const statusCode = await databases.deleteDocument(
        db.interactionsId,
        cl.postLikeId,
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
