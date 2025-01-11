import {
  Client,
  Account,
  Databases,
  Storage,
  Avatars,
  Functions,
} from 'appwrite';

interface DatabaseConfig {
  databaseId: string;
  collections: Record<string, string>;
}

interface AppwriteConfig {
  project: {
    id: string;
    url: string;
  };
  databases: {
    users: DatabaseConfig;
    posts: DatabaseConfig;
    comments: DatabaseConfig;
    interactions: DatabaseConfig;
    communities: DatabaseConfig;
    conversations: DatabaseConfig;
    notifications: DatabaseConfig;
    temps: DatabaseConfig;
  };
  functions: {
    conversationPermission: string;
    messagePermission: string;
    postLikePermission: string;
    itemLikePermission: string;
    savePermission: string;
    commentPermission: string;
    feedbackPermission: string;
    commentReplyPermission: string;
    feedbackReplyPermission: string;
    feedbackReplyParentPermission: string;
    notificationPermission: string;
  };
  storage: {
    creatorBucket: string;
    creationBucket: string;
    projectBucket: string;
  };

  oauth: {
    googleSuccessUrl: string;
    googleFailureUrl: string;
  };
  encryption: {
    messageEncryption: string;
  };
}

export const appwriteConfig: AppwriteConfig = {
  project: {
    id: import.meta.env.VITE_APPWRITE_PROJECT_ID,
    url: import.meta.env.VITE_APPWRITE_URL,
  },

  databases: {
    users: {
      databaseId: import.meta.env.VITE_APPWRITE_USERS_DATABASE_ID,
      collections: {
        creator: import.meta.env.VITE_APPWRITE_CREATOR_COLLECTION_ID,
        support: import.meta.env.VITE_APPWRITE_SUPPORT_COLLECTION_ID,
      },
    },

    posts: {
      databaseId: import.meta.env.VITE_APPWRITE_POSTS_DATABASE_ID,
      collections: {
        creation: import.meta.env.VITE_APPWRITE_CREATION_COLLECTION_ID,
        project: import.meta.env.VITE_APPWRITE_PROJECT_COLLECTION_ID,
      },
    },

    comments: {
      databaseId: import.meta.env.VITE_APPWRITE_COMMENTS_DATABASE_ID,
      collections: {
        comment: import.meta.env.VITE_APPWRITE_COMMENT_COLLECTION_ID,
        feedback: import.meta.env.VITE_APPWRITE_FEEDBACK_COLLECTION_ID,
        commentReply: import.meta.env.VITE_APPWRITE_COMMENT_REPLY_COLLECTION_ID,
        feedbackReply: import.meta.env
          .VITE_APPWRITE_FEEDBACK_REPLY_COLLECTION_ID,
      },
    },

    interactions: {
      databaseId: import.meta.env.VITE_APPWRITE_INTERACTIONS_DATABASE_ID,
      collections: {
        save: import.meta.env.VITE_APPWRITE_SAVE_COLLECTION_ID,
        postLike: import.meta.env.VITE_APPWRITE_POST_LIKE_COLLECTION_ID,
        itemLike: import.meta.env.VITE_APPWRITE_ITEM_LIKE_COLLECTION_ID,
      },
    },

    communities: {
      databaseId: import.meta.env.VITE_APPWRITE_COMMUNITIES_DATABASE_ID,
      collections: {
        discussion: import.meta.env.VITE_APPWRITE_DISCUSSION_COLLECTION_ID,
        member: import.meta.env.VITE_APPWRITE_MEMBER_COLLECTION_ID,
        community: import.meta.env.VITE_APPWRITE_COMMUNITY_COLLECTION_ID,
      },
    },

    conversations: {
      databaseId: import.meta.env.VITE_APPWRITE_CONVERSATIONS_DATABASE_ID,
      collections: {
        conversation: import.meta.env.VITE_APPWRITE_CONVERSATION_COLLECTION_ID,
        message: import.meta.env.VITE_APPWRITE_MESSAGE_COLLECTION_ID,
      },
    },

    notifications: {
      databaseId: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_DATABASE_ID,
      collections: {
        notification: import.meta.env.VITE_APPWRITE_NOTIFICATION_COLLECTION_ID,
      },
    },

    temps: {
      databaseId: import.meta.env.VITE_APPWRITE_TEMPS_DATABASE_ID,
      collections: {
        vote: import.meta.env.VITE_APPWRITE_VOTE_COLLECTION_ID,
      },
    },
  },

  functions: {
    conversationPermission: import.meta.env
      .VITE_APPWRITE_CONVERSATION_PERMISSION_FUNCTION_ID,

    messagePermission: import.meta.env
      .VITE_APPWRITE_MESSAGE_PERMISSION_FUNCTION_ID,

    postLikePermission: import.meta.env
      .VITE_APPWRITE_POST_LIKE_PERMISSION_FUNCTION_ID,

    itemLikePermission: import.meta.env
      .VITE_APPWRITE_ITEM_LIKE_PERMISSION_FUNCTION_ID,

    savePermission: import.meta.env.VITE_APPWRITE_SAVE_PERMISSION_FUNCTION_ID,

    commentPermission: import.meta.env
      .VITE_APPWRITE_COMMENT_PERMISSION_FUNCTION_ID,

    feedbackPermission: import.meta.env
      .VITE_APPWRITE_FEEDBACK_PERMISSION_FUNCTION_ID,

    commentReplyPermission: import.meta.env
      .VITE_APPWRITE_COMMENT_REPLY_PERMISSION_FUNCTION_ID,

    feedbackReplyPermission: import.meta.env
      .VITE_APPWRITE_FEEDBACK_REPLY_PERMISSION_FUNCTION_ID,

    feedbackReplyParentPermission: import.meta.env
      .VITE_APPWRITE_FEEDBACK_REPLY_PARENT_PERMISSION_FUNCTION_ID,

    notificationPermission: import.meta.env
      .VITE_APPWRITE_NOTIFICATION_PERMISSION_FUNCTION_ID,
  },

  storage: {
    creatorBucket: import.meta.env.VITE_APPWRITE_CREATOR_BUCKET_ID,
    creationBucket: import.meta.env.VITE_APPWRITE_CREATION_BUCKET_ID,
    projectBucket: import.meta.env.VITE_APPWRITE_PROJECT_BUCKET_ID,
  },

  oauth: {
    googleSuccessUrl: import.meta.env.VITE_GOOGLE_SUCCESS_URL,
    googleFailureUrl: import.meta.env.VITE_GOOGLE_FAILURE_URL,
  },

  encryption: {
    messageEncryption: import.meta.env.VITE_APPWRITE_MESSAGE_ENCRYPTION_KEY,
  },
};

// Initialize Appwrite client
export const client = new Client()
  .setProject(appwriteConfig.project.id)
  .setEndpoint(appwriteConfig.project.url);

// Export services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const avatars = new Avatars(client);
export const functions = new Functions(client);

// uses
// const collections = {
//   comment: appwriteConfig.databases.comments.collections.comment,
//   postLike: appwriteConfig.databases.interactions.collections.postLike
// };
