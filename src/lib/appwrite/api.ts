import { ID, ImageGravity, Models, OAuthProvider, Query } from 'appwrite';
import { INewPost, INewUser, IUpdatePost } from '@/types';
import { account, appwriteConfig, avatars, databases, storage} from './config';

// AUTH

export async function createUserAccount(
  user: INewUser
): Promise<Models.Document | Error> {
  try {
    // Extract username from email (everything before "@")
    const username = user.email.split('@')[0];

    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw new Error('Failed to create account');

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      hometown: user.hometown,
      email: newAccount.email,
      dpUrl: avatarUrl,
      username: username, // Add the generated username
    });

    return newUser;
  } catch (error) {
    console.error('Error during account creation:', error);
    throw error;
  }
}

export async function signInAccount(user: {
  email: string;
  password: string;
}): Promise<any> {
  try {
    return await account.createEmailPasswordSession(user.email, user.password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

export async function loginWithGoogle(): Promise<void> {
  try {
    account.createOAuth2Session(
      OAuthProvider.Google,
      'http://localhost:5173/oauth/callback',
      'http://localhost:5173/sign-up'
    );
  } catch (error) {
    console.error('Error during Google OAuth session creation:', error);
    throw error;
  }
}

export async function createUserAccountWithGoogle(
  session: any
): Promise<Models.Document> {
  const existingUser = await checkUserExists(session.email);

  if (existingUser) {
    return existingUser;
  }

  try {
    const username = session.email.split('@')[0];
    const newUser = await saveUserToDB({
      accountId: session.$id,
      name: session.name,
      email: session.email,
      dpUrl: avatars.getInitials(session.name),
      username: username,
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Error creating user');
  }
}

export async function checkUserExists(
  email: string
): Promise<Models.Document | null> {
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('email', email)]
    );

    return users.documents?.[0] || null;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return null;
  }
}

async function saveUserToDB(user: {
  accountId: string;
  name: string;
  username: string;
  hometown?: string;
  email: string;
  dpUrl: URL;
}): Promise<Models.Document> {
  try {
    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );
  } catch (error) {
    console.error('Error saving user to the database:', error);
    throw new Error('Failed to save user to the database');
  }
}

export async function getAccount(): Promise<any | null> {
  try {
    const checkAccount = await account.get();
    return checkAccount || null;
  } catch (error) {
    console.log('Error in getAccount (no session found):', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<Models.Document | null> {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      return null;
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    );

    return currentUser.documents?.[0] || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function signOutAccount(): Promise<any> {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}



// POSTS


export async function createPost(post: INewPost) {
  try {
    // Upload file to storage
    const uploadedFile = await uploadFile(post.file[0]);

    if (!uploadedFile) throw Error;

    // Get file Url
    const fileUrl = getFilePreview(uploadedFile.$id);
    if (!fileUrl) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }

    // convert tags into an array
    const tags = post.tags?.replace(/ /g, '').split(',') || [];

    // Create the post
    const newPost = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      ID.unique(),
      {
        creator: post.userId,
        content: post.content,
        mediaUrl: fileUrl,
        mediaId: uploadedFile.$id,
        tags: tags,
      }
    );

    if (!newPost) {
      await deleteFile(uploadedFile.$id);
      throw Error;
    }
    return newPost;
  } catch (error) {
    console.log(error);
  }
}

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      appwriteConfig.postBucketId,
      ID.unique(),
      file
    );
    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.postBucketId,
      fileId,
      2000,
      2000,
      ImageGravity.Top,
      100
    );

    if (!fileUrl) throw Error;

    console.log(fileUrl);

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(appwriteConfig.postBucketId, fileId);

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
  }
}

export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let media = {
      mediaUrl: post.mediaUrl,
      mediaId: post.mediaId,
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get new file url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      media = { ...media, mediaUrl: fileUrl, mediaId: uploadedFile.$id };
    }

    // Convert tags into array
    const tags = post.tags?.replace(/ /g, '').split(',') || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.postCollectionId,
      post.postId,
      {
        content: post.content,
        mediaUrl: media.mediaUrl,
        mediaId: media.mediaId,
        location: post.location,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(media.mediaId);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.mediaId);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}