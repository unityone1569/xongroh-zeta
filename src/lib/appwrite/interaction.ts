import { ID, Query } from 'appwrite';
import { appwriteConfig, databases } from './config';

// ****************
// ***** LIKE *****

export async function likePost(
  postId: string,
  userId: string,
  postType: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const collectionId = getPostCollectionId(postType);

    // Fetch the current post document to get the current likesCount
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      postId
    );
    const currentLikesCount = post.likesCount || 0;

    // Increment the likesCount manually
    const updatedLikesCount = currentLikesCount + 1;

    // Update the post with the new likesCount
    await Promise.all([
      databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        postId,
        {
          likesCount: updatedLikesCount,
        }
      ),
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.postLikesCollectionId,
        ID.unique(),
        {
          creatorId: userId,
          postId,
          postType,
        }
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error };
  }
}

export async function unlikePost(
  postId: string,
  userId: string,
  postType: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const collectionId = getPostCollectionId(postType);

    // Fetch current post document to get the current likesCount
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      postId
    );
    const currentLikesCount = post.likesCount || 0;

    // Decrement the likesCount manually
    const updatedLikesCount = currentLikesCount > 0 ? currentLikesCount - 1 : 0;

    // Find the document to delete in the 'postLikes' collection
    const likes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postLikesCollectionId,
      [Query.equal('creatorId', userId), Query.equal('postId', postId)]
    );

    if (likes.documents.length === 0) {
      throw new Error('Like document not found');
    }

    const likeDocumentId = likes.documents[0].$id; // Assuming there's only one match

    await Promise.all([
      databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        postId,
        {
          likesCount: updatedLikesCount,
        }
      ),
      databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.postLikesCollectionId,
        likeDocumentId
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { success: false, error };
  }
}

export async function likeItem(
  itemId: string,
  userId: string,
  itemType: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const collectionId = getItemCollectionId(itemType);

    // Fetch the current post document to get the current likesCount
    const item = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      itemId
    );
    const currentLikesCount = item.likesCount || 0;

    // Increment the likesCount manually
    const updatedLikesCount = currentLikesCount + 1;

    // Update the post with the new likesCount
    await Promise.all([
      databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        itemId,
        {
          likesCount: updatedLikesCount,
        }
      ),
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.interactionLikesCollectionId,
        ID.unique(),
        {
          creatorId: userId,
          itemId,
          itemType,
        }
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error liking post:', error);
    return { success: false, error };
  }
}

export async function unlikeItem(
  itemId: string,
  userId: string,
  postType: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const collectionId = getItemCollectionId(postType);

    // Fetch current post document to get the current likesCount
    const item = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      itemId
    );
    const currentLikesCount = item.likesCount || 0;

    // Decrement the likesCount manually
    const updatedLikesCount = currentLikesCount > 0 ? currentLikesCount - 1 : 0;

    // Find the document to delete in the 'postLikes' collection
    const likes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.interactionLikesCollectionId,
      [Query.equal('creatorId', userId), Query.equal('itemId', itemId)]
    );

    if (likes.documents.length === 0) {
      throw new Error('Like document not found');
    }

    const likeDocumentId = likes.documents[0].$id; // Assuming there's only one match

    await Promise.all([
      databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        itemId,
        {
          likesCount: updatedLikesCount,
        }
      ),
      databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.interactionLikesCollectionId,
        likeDocumentId
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error unliking post:', error);
    return { success: false, error };
  }
}

export async function checkPostLike(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const likes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postLikesCollectionId,
      [Query.equal('creatorId', userId), Query.equal('postId', postId)]
    );

    return likes.documents.length > 0;
  } catch (error) {
    console.error('Error checking post like:', error);
    return false;
  }
}

export async function checkItemLike(
  itemId: string,
  userId: string
): Promise<boolean> {
  try {
    const likes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.interactionLikesCollectionId,
      [Query.equal('creatorId', userId), Query.equal('itemId', itemId)]
    );

    return likes.documents.length > 0;
  } catch (error) {
    console.error('Error checking items like:', error);
    return false;
  }
}

export async function deleteAllPostLikes(postId: string) {
  if (!postId) return;

  try {
    // Find documents with the matching postId
    const postLikes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postLikesCollectionId,
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
        appwriteConfig.databaseId,
        appwriteConfig.postLikesCollectionId,
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

export async function deleteInteractionLike(itemId: string) {
  if (!itemId) return;

  try {
    // Find the document with the matching itemId
    const interactionLike = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.interactionLikesCollectionId,
      [Query.equal('itemId', itemId)]
    );

    // If no document is found, throw an error
    if (interactionLike.documents.length === 0) {
      // throw new Error(`No interaction like found with itemId: ${itemId}`);
      return;
    }

    // Get the document ID of the first matching document
    const interactionLikeId = interactionLike.documents[0].$id;

    // Delete the found document
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.interactionLikesCollectionId,
      interactionLikeId
    );

    if (!statusCode) {
      throw new Error(
        `Failed to delete interaction like with itemId: ${itemId}`
      );
    }

    return { status: 'Ok', interactionLikeId };
  } catch (error) {
    console.error(
      `Error deleting interaction like with itemId: ${itemId}`,
      error
    );
    throw error;
  }
}

// ****************
// ***** SAVE *****

export async function checkPostSave(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const saves = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal('creatorId', userId), Query.equal('postId', postId)]
    );

    return saves.documents.length > 0;
  } catch (error) {
    console.error('Error checking post save:', error);
    return false;
  }
}

export async function savePost(
  postId: string,
  userId: string,
  postType: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const collectionId = getPostCollectionId(postType);

    // Fetch the current post document to get the current savesCount
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      postId
    );

    const currentSavesCount = post.savesCount || 0;

    // Increment the savesCount manually
    const updatedSavesCount = currentSavesCount + 1;

    await Promise.all([
      databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        postId,
        {
          savesCount: updatedSavesCount,
        }
      ),
      databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        ID.unique(),
        {
          creatorId: userId,
          postId,
          postType,
        }
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error saving post:', error);
    return { success: false, error };
  }
}

export async function unsavePost(
  postId: string,
  userId: string,
  postType: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const collectionId = getPostCollectionId(postType);

    // Fetch current post document to get the current savesCount
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      collectionId,
      postId
    );
    const currentSavesCount = post.savesCount || 0;

    // Decrement the savesCount manually
    const updatedSavesCount = currentSavesCount > 0 ? currentSavesCount - 1 : 0;

    // Find the document to delete in the 'postSaves' collection
    const saves = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal('creatorId', userId), Query.equal('postId', postId)]
    );

    if (saves.documents.length === 0) {
      throw new Error('Save document not found');
    }

    const saveDocumentId = saves.documents[0].$id; // Assuming there's only one match

    await Promise.all([
      databases.updateDocument(
        appwriteConfig.databaseId,
        collectionId,
        postId,
        {
          savesCount: updatedSavesCount,
        }
      ),
      databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        saveDocumentId
      ),
    ]);

    return { success: true };
  } catch (error) {
    console.error('Error un-saving post:', error);
    return { success: false, error };
  }
}

export async function deleteAllPostSaves(postId: string) {
  if (!postId) return;

  try {
    // Find the document with the matching postId
    const postSaves = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal('postId', postId)]
    );

    // If no document is found, throw an error
    if (postSaves.documents.length === 0) {
      // throw new Error(`No saves found for postId: ${postId}`);
      return;
    }

    // Loop through each save and delete it
    for (const save of postSaves.documents) {
      const saveId = save.$id;

      const statusCode = await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.savesCollectionId,
        saveId
      );

      if (!statusCode) {
        throw new Error(`Failed to delete save with ID: ${saveId}`);
      }
    }

    return { status: 'Ok', postId };
  } catch (error) {
    console.error(`Error deleting saves for postId: ${postId}`, error);
    throw error;
  }
}

// *******************
// ***** SUPPORT *****

export async function checkSupportingUser(
  creatorId: string,
  supportingId: string
): Promise<boolean> {
  try {
    const supports = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.supportsCollectionId,
      [Query.equal('creatorId', creatorId)]
    );

    if (supports.documents.length > 0) {
      const supportDoc = supports.documents[0];
      const supportingIds = Array.isArray(supportDoc.supportingIds)
        ? supportDoc.supportingIds
        : [];

      return supportingIds.includes(supportingId);
    }

    return false; // No document found for creatorId
  } catch (error) {
    console.error('Error checking supporting user:', error);
    return false;
  }
}

export async function support(
  creatorId: string,
  supportingId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Fetch user document to update supportingCount
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      creatorId
    );

    // Update supportingCount in the user collection
    const currentSupportingCount = user.supportingCount || 0;
    const updatedSupportingCount = currentSupportingCount + 1;

    const updateUserPromise = databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      creatorId,
      { supportingCount: updatedSupportingCount }
    );

    // Manage supportingIds in the supports collection
    const supportsQuery = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.supportsCollectionId,
      [Query.equal('creatorId', creatorId)]
    );

    let updateSupportsPromise;

    if (supportsQuery.total > 0) {
      const supportDoc = supportsQuery.documents[0];

      // Ensure supportingIds is an array and append supportingId
      const currentSupportingIds = Array.isArray(supportDoc.supportingIds)
        ? supportDoc.supportingIds
        : [];
      const updatedSupportingIds = [
        ...new Set([...currentSupportingIds, supportingId]),
      ];

      // Update the existing document in supports collection
      updateSupportsPromise = databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.supportsCollectionId,
        supportDoc.$id,
        { supportingIds: updatedSupportingIds }
      );
    } else {
      // Create a new document in supports collection
      updateSupportsPromise = databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.supportsCollectionId,
        ID.unique(),
        {
          creatorId,
          supportingIds: [supportingId],
        }
      );
    }

    // Perform both updates concurrently
    await Promise.all([updateUserPromise, updateSupportsPromise]);

    return { success: true };
  } catch (error) {
    console.error('Error supporting creator:', error);
    return { success: false, error };
  }
}

export async function unsupport(
  creatorId: string,
  supportingId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Fetch user document to update supportingCount
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      creatorId
    );

    // Ensure supportingCount is not negative
    const currentSupportingCount = user.supportingCount || 0;
    const updatedSupportingCount = Math.max(0, currentSupportingCount - 1);

    const updateUserPromise = databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      creatorId,
      { supportingCount: updatedSupportingCount }
    );

    // Manage supportingIds in the supports collection
    const supportsQuery = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.supportsCollectionId,
      [Query.equal('creatorId', creatorId)]
    );

    let updateSupportsPromise;

    if (supportsQuery.total > 0) {
      const supportDoc = supportsQuery.documents[0];

      // Ensure supportingIds is an array and remove the supportingId
      const currentSupportingIds = Array.isArray(supportDoc.supportingIds)
        ? supportDoc.supportingIds
        : [];
      const updatedSupportingIds = currentSupportingIds.filter(
        (id) => id !== supportingId
      );

      // Update the supports document with the new supportingIds array
      updateSupportsPromise = databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.supportsCollectionId,
        supportDoc.$id,
        { supportingIds: updatedSupportingIds }
      );
    } else {
      // No document found, no need to update
      updateSupportsPromise = Promise.resolve();
    }

    // Perform both updates concurrently
    await Promise.all([updateUserPromise, updateSupportsPromise]);

    return { success: true };
  } catch (error) {
    console.error('Error unsupporting creator:', error);
    return { success: false, error };
  }
}

// *******************
// ***** COMMENT *****

export async function getComments(postId: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.commentsCollectionId,
      [Query.equal('postId', postId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

export async function addComment(
  postId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentsCollectionId,
      ID.unique(),
      {
        postId,
        creatorId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error };
  }
}

export async function deleteComment(commentId: string, postId: string) {
  if (!commentId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentsCollectionId,
      commentId
    );

    if (!statusCode) throw Error;

    await deleteAllCommentReplies(commentId);

    await deleteInteractionLike(commentId);

    return { status: 'Ok', postId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteAllCommentsForPost(postId: string) {
  if (!postId) return;

  try {
    const comments = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.commentsCollectionId,
      [Query.equal('postId', postId)]
    );

    for (const comment of comments.documents) {
      await deleteComment(comment.$id, postId);
      await deleteAllCommentReplies(comment.$id);
    }

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// ********************
// ***** FEEDBACK *****

export async function getFeedbacks(postId: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.feedbacksCollectionId,
      [Query.equal('postId', postId)] // Ensure only post creator or feedback giver can access
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
}

export async function addFeedback(
  postId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.feedbacksCollectionId,
      ID.unique(),
      {
        postId,
        creatorId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding feedback:', error);
    return { success: false, error };
  }
}

export async function deleteFeedback(feedbackId: string, postId: string) {
  if (!feedbackId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.feedbacksCollectionId,
      feedbackId
    );

    if (!statusCode) throw Error;

    await deleteAllFeedbackReplies(feedbackId);

    await deleteInteractionLike(feedbackId);

    return { status: 'Ok', postId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteAllFeedbacksForPost(postId: string) {
  if (!postId) return;

  try {
    const feedbacks = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.feedbacksCollectionId,
      [Query.equal('postId', postId)]
    );

    for (const feedback of feedbacks.documents) {
      await deleteFeedback(feedback.$id, postId);
      await deleteAllFeedbackReplies(feedback.$id);
    }

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// *************************
// ***** COMMENT-REPLY *****

export async function getCommentReplies(commentId: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.commentRepliesCollectionId,
      [Query.equal('commentId', commentId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    throw error;
  }
}

export async function addCommentReply(
  parentId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentRepliesCollectionId,
      ID.unique(),
      {
        commentId: parentId,
        creatorId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding comment reply:', error);
    return { success: false, error };
  }
}

export async function deleteCommentReply(
  commentReplyId: string,
  commentId: string
) {
  if (!commentReplyId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.commentRepliesCollectionId,
      commentReplyId
    );

    if (!statusCode) throw Error;

    await deleteInteractionLike(commentReplyId);

    return { status: 'Ok', commentId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteAllCommentReplies(commentId: string) {
  if (!commentId) return;

  try {
    const replies = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.commentRepliesCollectionId,
      [Query.equal('commentId', commentId)]
    );

    for (const reply of replies.documents) {
      await deleteCommentReply(reply.$id, commentId);
    }

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// **************************
// ***** FEEDBACK-REPLY *****

export async function getFeedbackReplies(feedbackId: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.feedbackRepliesCollectionId,
      [Query.equal('feedbackId', feedbackId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching feedback replies:', error);
    throw error;
  }
}

export async function addFeedbackReply(
  parentId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.feedbackRepliesCollectionId,
      ID.unique(),
      {
        feedbackId: parentId,
        creatorId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding feedback reply:', error);
    return { success: false, error };
  }
}

export async function deleteFeedbackReply(
  feedbackReplyId: string,
  feedbackId: string
) {
  if (!feedbackReplyId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.feedbackRepliesCollectionId,
      feedbackReplyId
    );

    if (!statusCode) throw Error;

    await deleteInteractionLike(feedbackReplyId);

    return { status: 'Ok', feedbackId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function deleteAllFeedbackReplies(feedbackId: string) {
  if (!feedbackId) return;

  try {
    const replies = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.feedbackRepliesCollectionId,
      [Query.equal('feedbackId', feedbackId)]
    );

    for (const reply of replies.documents) {
      await deleteFeedbackReply(reply.$id, feedbackId);
    }

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// *******************
// ***** HELPERS *****

function getPostCollectionId(postType: string): string {
  switch (postType) {
    case 'creationPost':
      return appwriteConfig.creationPostCollectionId;
    case 'communityPost':
      return appwriteConfig.communityPostCollectionId;
    case 'portfolioPost':
      return appwriteConfig.portfolioPostCollectionId;
    default:
      throw new Error('Unknown post type');
  }
}

function getItemCollectionId(itemType: string): string {
  switch (itemType) {
    case 'comment':
      return appwriteConfig.commentsCollectionId;
    case 'feedback':
      return appwriteConfig.feedbacksCollectionId;
    case 'commentReply':
      return appwriteConfig.commentRepliesCollectionId;
    case 'feedbackReply':
      return appwriteConfig.feedbackRepliesCollectionId;
    default:
      throw new Error('Unknown item type');
  }
}
