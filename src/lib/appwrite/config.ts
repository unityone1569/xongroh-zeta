import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const appwriteConfig = {
  // PROJECT
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  url: import.meta.env.VITE_APPWRITE_URL,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,

  // DB COLLECTIONS
  creatorCollectionId: import.meta.env.VITE_APPWRITE_CREATOR_COLLECTION_ID,
  supportsCollectionId: import.meta.env.VITE_APPWRITE_SUPPORTING_COLLECTION_ID,

  creationPostCollectionId: import.meta.env
    .VITE_APPWRITE_CREATION_POSTS_COLLECTION_ID,
  communityPostCollectionId: import.meta.env
    .VITE_APPWRITE_COMMUNITY_POSTS_COLLECTION_ID,
  portfolioPostCollectionId: import.meta.env
    .VITE_APPWRITE_PORTFOLIO_POSTS_COLLECTION_ID,

  savesCollectionId: import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID,
  postLikesCollectionId: import.meta.env.VITE_APPWRITE_POST_LIKES_COLLECTION_ID,
  interactionLikesCollectionId: import.meta.env
    .VITE_APPWRITE_INTERACTION_LIKES_COLLECTION_ID,

  commentsCollectionId: import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID,
  feedbacksCollectionId: import.meta.env.VITE_APPWRITE_FEEDBACKS_COLLECTION_ID,
  commentRepliesCollectionId: import.meta.env
    .VITE_APPWRITE_COMMENT_REPLIES_COLLECTION_ID,
  feedbackRepliesCollectionId: import.meta.env
    .VITE_APPWRITE_FEEDBACK_REPLIES_COLLECTION_ID,

  // Messages
  messageCollectionId: import.meta.env.VITE_APPWRITE_MESSAGE_COLLECTION_ID,
  conversationCollectionId: import.meta.env
    .VITE_APPWRITE_CONVERSATION_COLLECTION_ID,
  messageEncryptionKey: import.meta.env.VITE_APPWRITE_MESSAGE_ENCRYPTION_KEY,

  addConversationReceiverFunctionId: import.meta.env
    .VITE_APPWRITE_CONVERSATION_FUNCTION_ID,
  addMessageReceiverFunctionId: import.meta.env
    .VITE_APPWRITE_MESSAGE_FUNCTION_ID,

  // Vote
  voteCollectionId: import.meta.env.VITE_APPWRITE_VOTE_COLLECTION_ID,

  // BUCKETS
  userBucketId: import.meta.env.VITE_APPWRITE_USER_BUCKET_ID,
  postBucketId: import.meta.env.VITE_APPWRITE_POST_BUCKET_ID,
};

export const client = new Client();

client.setProject(appwriteConfig.projectId);
client.setEndpoint(appwriteConfig.url);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
