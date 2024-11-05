import { Client, Account, Databases, Storage, Avatars } from 'appwrite';

export const appwriteConfig = {
  // PROJECT
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  url: import.meta.env.VITE_APPWRITE_URL,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,

  // DB COLLECTIONS
  userCollectionId: import.meta.env.VITE_APPWRITE_USER_COLLECTION_ID,

  creationPostCollectionId: import.meta.env
    .VITE_APPWRITE_CREATION_POSTS_COLLECTION_ID,
  communityPostCollectionId: import.meta.env
    .VITE_APPWRITE_COMMUNITY_POSTS_COLLECTION_ID,
  portfolioPostCollectionId: import.meta.env
    .VITE_APPWRITE_PORTFOLIO_POSTS_COLLECTION_ID,

  savesCollectionId: import.meta.env.VITE_APPWRITE_SAVES_COLLECTION_ID,
  postLikesCollectionId: import.meta.env.VITE_APPWRITE_POST_LIKES_COLLECTION_ID,

  commentsCollectionId: import.meta.env.VITE_APPWRITE_COMMENTS_COLLECTION_ID,
  feedbacksCollectionId: import.meta.env.VITE_APPWRITE_FEEDBACKS_COLLECTION_ID,
  commentRepliesCollectionId: import.meta.env
    .VITE_APPWRITE_COMMENT_REPLIES_COLLECTION_ID,
  feedbackRepliesCollectionId: import.meta.env
    .VITE_APPWRITE_FEEDBACK_REPLIES_COLLECTION_ID,

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
