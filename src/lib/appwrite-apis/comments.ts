import { ID, Query } from 'appwrite';
import { appwriteConfig, databases, functions } from './config';
import { deleteItemLike } from './interactions';
import { getUserAccountId } from './users';

// *** APPWRITE ***

// Database
const db = {
  commentsId: appwriteConfig.databases.comments.databaseId,
};

// Collections
const cl = {
  commentId: appwriteConfig.databases.comments.collections.comment,
  feedbackId: appwriteConfig.databases.comments.collections.feedback,
  commentReplyId: appwriteConfig.databases.comments.collections.commentReply,
  feedbackReplyId: appwriteConfig.databases.comments.collections.feedbackReply,
};

// Functions
const fn = {
  commentPermissionId: appwriteConfig.functions.commentPermission,
  feedbackPermissionId: appwriteConfig.functions.feedbackPermission,
  commentReplyPermissionId: appwriteConfig.functions.commentReplyPermission,
  feedbackReplyPermissionId: appwriteConfig.functions.feedbackReplyPermission,
  feedbackReplyParentPermissionId:
    appwriteConfig.functions.feedbackReplyParentPermission,
};

// *** COMMENTS ***

// Get-Comment
export async function getComments(postId: string) {
  try {
    const response = await databases.listDocuments(
      db.commentsId,
      cl.commentId,
      [Query.equal('postId', postId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
}

// Create-Comment
export async function addComment(
  postId: string,
  authorId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const comment = await databases.createDocument(
      db.commentsId,
      cl.commentId,
      ID.unique(),
      {
        postId,
        userId,
        content,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      commentId: comment.$id,
      authorId,
    });

    await functions.createExecution(fn.commentPermissionId, payload, true);

    return { success: true };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error };
  }
}

// Delete-Comment
export async function deleteComment(commentId: string, postId: string) {
  if (!commentId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.commentsId,
      cl.commentId,
      commentId
    );

    if (!statusCode) throw Error;

    await deleteAllCommentReplies(commentId);

    await deleteItemLike(commentId);

    return { status: 'Ok', postId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Delete-All-Comments
export async function deleteAllCommentsForPost(postId: string) {
  if (!postId) return;

  try {
    const comments = await databases.listDocuments(
      db.commentsId,
      cl.commentId,
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

// *** FEEDBACK ***

// Get-Feedback
export async function getFeedbacks(postId: string) {
  try {
    const response = await databases.listDocuments(
      db.commentsId,
      cl.feedbackId,
      [Query.equal('postId', postId)] // Ensure only post creator or feedback giver can access
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
}

// Add-Feedback
export async function addFeedback(
  postId: string,
  authorId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const feedback = await databases.createDocument(
      db.commentsId,
      cl.feedbackId,
      ID.unique(),
      {
        postId,
        userId,
        content,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      feedbackId: feedback.$id,
      authorId,
    });

    await functions.createExecution(fn.feedbackPermissionId, payload, true);

    return { success: true };
  } catch (error) {
    console.error('Error adding feedback:', error);
    return { success: false, error };
  }
}

// Delete-Feedback
export async function deleteFeedback(feedbackId: string, postId: string) {
  if (!feedbackId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.commentsId,
      cl.feedbackId,
      feedbackId
    );

    if (!statusCode) throw Error;

    await deleteAllFeedbackReplies(feedbackId);

    await deleteItemLike(feedbackId);

    return { status: 'Ok', postId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Delete-All-Feedbacks
export async function deleteAllFeedbacksForPost(postId: string) {
  if (!postId) return;

  try {
    const feedbacks = await databases.listDocuments(
      db.commentsId,
      cl.feedbackId,
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

// *** COMMENT REPLIES ***

// Get-Comment-Replies
export async function getCommentReplies(commentId: string) {
  try {
    const response = await databases.listDocuments(
      db.commentsId,
      cl.commentReplyId,
      [Query.equal('commentId', commentId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    throw error;
  }
}

// Add-Comment-Reply
export async function addCommentReply(
  parentId: string,
  authorId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    const commentReply = await databases.createDocument(
      db.commentsId,
      cl.commentReplyId,
      ID.unique(),
      {
        commentId: parentId,
        userId,
        content,
      }
    );

    // Trigger the Appwrite Function to add receiver permissions
    const payload = JSON.stringify({
      commentReplyId: commentReply.$id,
      authorId,
    });

    await functions.createExecution(fn.commentReplyPermissionId, payload, true);

    return { success: true };
  } catch (error) {
    console.error('Error adding comment reply:', error);
    return { success: false, error };
  }
}

// Delete-Comment-Reply
export async function deleteCommentReply(
  commentReplyId: string,
  commentId: string
) {
  if (!commentReplyId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.commentsId,
      cl.commentReplyId,
      commentReplyId
    );

    if (!statusCode) throw Error;

    await deleteItemLike(commentReplyId);

    return { status: 'Ok', commentId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Delete-All-Comment-Replies
export async function deleteAllCommentReplies(commentId: string) {
  if (!commentId) return;

  try {
    const replies = await databases.listDocuments(
      db.commentsId,
      cl.commentReplyId,
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

// *** FEEDBACK REPLIES ***

// Get-Feedback-Replies
export async function getFeedbackReplies(feedbackId: string) {
  try {
    const response = await databases.listDocuments(
      db.commentsId,
      cl.feedbackReplyId,
      [Query.equal('feedbackId', feedbackId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching feedback replies:', error);
    throw error;
  }
}

// Add-Feedback-Reply
export async function addFeedbackReply(
  parentId: string,
  postAuthorId: string,
  authorId: string,
  userId: string,
  content: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Get parent feedback to identify creator
    const parentFeedback = await databases.listDocuments(
      db.commentsId,
      cl.feedbackId,
      [Query.equal('$id', parentId), Query.select(['userId'])]
    );

    const feedbackReply = await databases.createDocument(
      db.commentsId,
      cl.feedbackReplyId,
      ID.unique(),
      {
        feedbackId: parentId,
        userId,
        content,
      }
    );

    const parentAuthorId = await getUserAccountId(
      parentFeedback.documents[0].userId
    );

    // Determine which permission function to use
    const isAuthorReplying = userId === postAuthorId;
    const functionId = isAuthorReplying
      ? fn.feedbackReplyParentPermissionId // If author replies, give permission to feedback creator
      : fn.feedbackReplyPermissionId; // If user replies, give permission to author

    const payload = JSON.stringify({
      feedbackReplyId: feedbackReply.$id,
      authorId: isAuthorReplying ? parentAuthorId : authorId,
    });

    await functions.createExecution(functionId, payload, true);

    return { success: true };
  } catch (error) {
    console.error('Error adding feedback reply:', error);
    return { success: false, error };
  }
}

// Delete-Feedback-Reply
export async function deleteFeedbackReply(
  feedbackReplyId: string,
  feedbackId: string
) {
  if (!feedbackReplyId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.commentsId,
      cl.feedbackReplyId,
      feedbackReplyId
    );

    if (!statusCode) throw Error;

    await deleteItemLike(feedbackReplyId);

    return { status: 'Ok', feedbackId };
  } catch (error) {
    console.log(error);
    throw error;
  }
}

// Delete-All-Feedback-Replies
export async function deleteAllFeedbackReplies(feedbackId: string) {
  if (!feedbackId) return;

  try {
    const replies = await databases.listDocuments(
      db.commentsId,
      cl.feedbackReplyId,
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
