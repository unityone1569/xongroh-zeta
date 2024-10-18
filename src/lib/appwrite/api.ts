import { ID, ImageGravity, Models, OAuthProvider, Query } from 'appwrite';
import { INewPost, INewUser, IUpdatePost } from '@/types';
import { account, appwriteConfig, avatars, databases, storage } from './config';

// AUTH

export async function createUserAccount(
  user: INewUser
): Promise<Models.Document | Error> {
  try {
    // Extract username from email (everything before "@")
    const username = user.email.split('@')[0];

    // Create the account
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) {
      throw new Error('Account creation failed');
    }

    // Check if the user already exists in the database
    const existingUser = await checkUserExists(newAccount.email);
    if (existingUser) {
      console.log('User data already exists in the database');
      console.log(existingUser);

      // If the accountId doesn't match, update the accountId
      if (existingUser.accountId !== newAccount.$id) {
        const updatedUser = await updateUserAccountId(
          existingUser.$id,
          newAccount.$id
        );
        console.log('User accountId updated:', updatedUser);
        return updatedUser;
      }

      return existingUser;
    }

    // Generate avatar and save user data to the database
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
      'http://localhost:5173/sign-in'
    );
  } catch (error) {
    console.error('Error during Google OAuth session creation:', error);
    throw error;
  }
}

export async function createUserAccountWithGoogle(
  session: any
): Promise<Models.Document> {
  // Check if the user already exists in the database
  const existingUser = await checkUserExists(session.email);
  if (existingUser) {
    console.log('User data already exists in the database');
    console.log(existingUser);

    // If the accountId doesn't match, update the accountId
    if (existingUser.accountId !== session.$id) {
      const updatedUser = await updateUserAccountId(
        existingUser.$id,
        session.$id
      );
      console.log('User accountId updated:', updatedUser);
      return updatedUser;
    }

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
export async function updateUserAccountId(
  userId: string,
  newAccountId: string
): Promise<Models.Document> {
  try {
    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      { accountId: newAccountId }
    );
    return updatedUser;
  } catch (error) {
    console.error('Error updating user accountId:', error);
    throw error;
  }
}

// Function to save the user to the user collection
async function saveUserToDB(user: {
  accountId: string;
  name: string;
  username: string;
  hometown?: string;
  email: string;
  dpUrl: URL;
}): Promise<Models.Document> {
  try {
    // Save the user to the database
    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );
  } catch (error) {
    console.error('Error saving user to the database:', error);
    throw new Error('Failed to save user');
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
      appwriteConfig.creationPostCollectionId,
      ID.unique(),
      {
        creatorId: post.userId,
        content: post.content,
        mediaUrl: [fileUrl],
        mediaId: [uploadedFile.$id],
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

export async function getRecentPosts() {
  try {
    // Fetch recent posts
    const { documents: posts } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(20)]
    );

    if (!posts || posts.length === 0) {
      return []; // Return an empty array if no posts are found
    }

    // Create an array of user fetch promises
    const userFetchPromises = posts.map((post) =>
      databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId, // Replace with actual user collection ID
        post.creatorId
      )
    );

    // Resolve all user fetch promises in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine posts with their corresponding user details
    const postsWithUserDetails = posts.map((post, index) => ({
      ...post,
      creator: {
        name: users[index]?.name || '',
        username: users[index]?.username || '',
        dpUrl: users[index]?.dpUrl || null,
      },
    }));

    return postsWithUserDetails;
  } catch (error) {
    console.error('Error fetching posts or user data:', error);
    return []; // Return an empty array if an error occurs
  }
}

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
          accountId: userId,
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
      [Query.equal('accountId', userId), Query.equal('postId', postId)]
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
          accountId: userId,
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
      [Query.equal('accountId', userId), Query.equal('postId', postId)]
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

export async function checkPostLike(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const likes = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.postLikesCollectionId,
      [Query.equal('accountId', userId), Query.equal('postId', postId)]
    );

    return likes.documents.length > 0;
  } catch (error) {
    console.error('Error checking post like:', error);
    return false;
  }
}

export async function checkPostSave(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const saves = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal('accountId', userId), Query.equal('postId', postId)]
    );

    return saves.documents.length > 0;
  } catch (error) {
    console.error('Error checking post save:', error);
    return false;
  }
}

export async function getPostById(postId: string) {
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      postId
    );
    return post;
  } catch (error) {
    console.log(error);
  }
}

export async function getAuthorById(creatorId: string) {
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      creatorId
    );
    return post;
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
      appwriteConfig.creationPostCollectionId,
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

export async function deletePost(postId?: string, mediaId?: string) {
  if (!postId || !mediaId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(mediaId);

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
  }
}

export async function searchPosts(searchTerm: string) {
  try {
    const posts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      [Query.search('content', searchTerm)]
    );

    if (!posts) throw Error;

    return posts;
  } catch (error) {
    console.log(error);
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: posts } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      queries
    );

    if (!posts || posts.length === 0) return { documents: [] };

    const creatorIds = [...new Set(posts.map((post) => post.creatorId))];

    const { documents: authors } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('$id', creatorIds)]
    );

    const authorMap = new Map(authors.map((author) => [author.$id, author]));

    const postsWithAuthors = posts.map((post) => ({
      ...post,
      author: authorMap.get(post.creatorId) || null,
    }));

    return { documents: postsWithAuthors }; // Ensure returning documents
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}
