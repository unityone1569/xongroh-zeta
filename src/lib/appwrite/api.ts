import { ID, ImageGravity, Models, OAuthProvider, Query } from 'appwrite';
import {
  INewPost,
  INewProject,
  INewUser,
  IUpdatePost,
  IUpdateProject,
  IUpdateUser,
} from '@/types';
import { account, appwriteConfig, avatars, databases, storage } from './config';

// ***** AUTH *****

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
      coverUrl: new URL(
        'https://cloud.appwrite.io/v1/storage/buckets/66eb8c5f0005ac84ff73/files/67334e3c0020012b0960/view?project=66e2a98a00192795ca51&project=66e2a98a00192795ca51&mode=admin'
      ),
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
      coverUrl: new URL(
        'https://cloud.appwrite.io/v1/storage/buckets/66eb8c5f0005ac84ff73/files/67334e3c0020012b0960/view?project=66e2a98a00192795ca51&project=66e2a98a00192795ca51&mode=admin'
      ),
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
  coverUrl: URL;
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

export async function getCurrentUser(): Promise<Models.Document> {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      throw new Error('No current account found.');
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    );

    const user = currentUser.documents?.[0];
    if (!user) {
      throw new Error('No user document found for the current account.');
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error; // Re-throw error to be handled by the calling code
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

// Function to fetch user details based on accountId
export async function getUserInfo(accountId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      accountId
    );
    return {
      name: user.name,
      dp: user.dpUrl,
      cover: user.coverUrl,
      bio: user.bio,
      about: user.about,
      hometown: user.hometown,
      profession: user.profession,
      projectsCount: user.projectsCount,
      creationsCount: user.creationsCount,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return { name: 'Unknown', dpUrl: '' };
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );
    return user;
  } catch (error) {
    console.log(error);
  }
}

// ** updateProfile **
export async function updateProfile(user: IUpdateUser) {
  try {
    let profileMedia = {
      dpUrl: user.dpUrl || '',
      dpId: user.dpId || '',
    };
    let coverMedia = {
      coverUrl: user.coverUrl || '',
      coverId: user.coverId || '',
    };

    // Upload new dpFile if provided
    if (user.dpFile) {
      const uploadedDpFile = await uploadFile(user.dpFile);
      if (!uploadedDpFile) throw new Error('File upload failed');
      const dpFileUrl = getFilePreview(uploadedDpFile.$id);
      if (!dpFileUrl) {
        await deleteFile(uploadedDpFile.$id);
        throw new Error('File preview generation failed');
      }

      profileMedia = {
        dpUrl: dpFileUrl,
        dpId: uploadedDpFile.$id,
      };
    }

    // Upload new coverFile if provided
    if (user.coverFile) {
      const uploadedCoverFile = await uploadFile(user.coverFile);
      if (!uploadedCoverFile) throw new Error('File upload failed');
      const coverFileUrl = getFilePreview(uploadedCoverFile.$id);
      if (!coverFileUrl) {
        await deleteFile(uploadedCoverFile.$id);
        throw new Error('File preview generation failed');
      }

      coverMedia = {
        coverUrl: coverFileUrl,
        coverId: uploadedCoverFile.$id,
      };
    }

    const updatedUser = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      user.userId,
      {
        name: user.name,
        username: user.username,
        hometown: user.hometown,
        profession: user.profession,
        bio: user.bio,
        about: user.about,
        dpUrl: profileMedia.dpUrl,
        dpId: profileMedia.dpId,
        coverUrl: coverMedia.coverUrl,
        coverId: coverMedia.coverId,
      }
    );

    // If update failed, delete newly uploaded file (if any)
    if (!updatedUser && user.dpFile) {
      await deleteFile(profileMedia.dpId);
      throw new Error('Document update failed');
    }
    if (!updatedUser && user.coverFile) {
      await deleteFile(coverMedia.coverId);
      throw new Error('Document update failed');
    }

    // Safely delete the old file after a successful update
    if (user.dpFile && user.dpId) {
      await deleteFile(user.dpId);
    }
    if (user.coverFile && user.coverId) {
      await deleteFile(user.coverId);
    }

    return updatedUser;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Profile update failed');
  }
}

//***** POSTS, PROJECTS & DISCUSSIONS *****

// ** createPost **
export async function createPost(post: INewPost) {
  try {
    let fileUrl: string = '';
    let uploadedFileId = '';

    if (post.file && post.file.length > 0) {
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw Error;

      // Get file Url
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }
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
        mediaUrl: fileUrl ? [fileUrl] : [],
        mediaId: uploadedFileId ? [uploadedFileId] : [],
        tags: tags,
      }
    );

    if (!newPost && uploadedFileId) {
      await deleteFile(uploadedFileId);
      throw Error;
    }

    // Increment the projectsCount for the user
    await incrementUsercreationsCount(post.userId);
    return newPost;
  } catch (error) {
    console.log(error);
  }
}

async function incrementUsercreationsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    // Increment the projectsCount attribute
    const updatedCreationsCount = (userDoc.creationsCount || 0) + 1;

    // Update the user document with the incremented projectsCount
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      { creationsCount: updatedCreationsCount }
    );
  } catch (error) {
    console.error('Failed to increment projects count:', error);
  }
}

// ** addProject **
export async function addProject(project: INewProject) {
  try {
    let fileUrl: string = ''; // Explicitly set fileUrl as string
    let uploadedFileId = ''; // Default to an empty string

    // Check if a file is provided
    if (project.file && project.file.length > 0) {
      // Upload file to storage
      const uploadedFile = await uploadFile(project.file[0]);
      if (!uploadedFile) throw new Error('File upload failed');

      // Get file URL and cast it to string
      fileUrl = String(getFilePreview(uploadedFile.$id));
      uploadedFileId = uploadedFile.$id;

      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error('File preview generation failed');
      }
    }

    // Normalize links to an array
    const links = Array.isArray(project.links)
      ? project.links
      : project.links
      ? project.links.replace(/ /g, '').split(',')
      : []; // Empty array if no links provided

    // Normalize tags to an array
    const tags = Array.isArray(project.tags)
      ? project.tags
      : project.tags?.replace(/ /g, '').split(',') || [];

    // Create the project document
    const newProject = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.portfolioPostCollectionId,
      ID.unique(),
      {
        creatorId: project.userId,
        title: project.title,
        description: project.description,
        mediaUrl: fileUrl ? [fileUrl] : [],
        mediaId: uploadedFileId ? [uploadedFileId] : [],
        links: links,
        tags: tags,
      }
    );

    if (!newProject && uploadedFileId) {
      await deleteFile(uploadedFileId);
      throw new Error('Project creation failed');
    }

    // Increment the projectsCount for the user
    await incrementUserProjectsCount(project.userId);

    return newProject;
  } catch (error) {
    console.log(error);
  }
}

// Function to increment the projectsCount in the Users collection
async function incrementUserProjectsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId
    );

    // Increment the projectsCount attribute
    const updatedProjectsCount = (userDoc.projectsCount || 0) + 1;

    // Update the user document with the incremented projectsCount
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      userId,
      { projectsCount: updatedProjectsCount }
    );
  } catch (error) {
    console.error('Failed to increment projects count:', error);
  }
}

//  ** uploadFile **
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

// ** updatePost **
export async function updatePost(post: IUpdatePost) {
  const hasFileToUpdate = post.file.length > 0;

  try {
    let media = {
      mediaUrl: Array.isArray(post.mediaUrl) ? post.mediaUrl : [post.mediaUrl],
      mediaId: Array.isArray(post.mediaId) ? post.mediaId : [post.mediaId],
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

      media = {
        mediaUrl: [fileUrl],
        mediaId: [uploadedFile.$id],
      };
    }

    // Convert tags into array
    const tags = Array.isArray(post.tags)
      ? post.tags
      : post.tags?.replace(/ /g, '').split(',') || [];

    //  Update post
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      post.postId,
      {
        content: post.content,
        mediaUrl: media.mediaUrl,
        mediaId: media.mediaId,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedPost) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(media.mediaId[0]);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(post.mediaId[0]);
    }

    return updatedPost;
  } catch (error) {
    console.log(error);
  }
}

// ** updateProject **
export async function updateProject(project: IUpdateProject) {
  const hasFileToUpdate = project.file.length > 0;

  try {
    // Normalize mediaUrl and mediaId as single-level arrays
    let media = {
      mediaUrl: Array.isArray(project.mediaUrl)
        ? project.mediaUrl
        : [project.mediaUrl],
      mediaId: Array.isArray(project.mediaId)
        ? project.mediaId
        : [project.mediaId],
    };

    if (hasFileToUpdate) {
      // Upload new file to Appwrite storage
      const uploadedFile = await uploadFile(project.file[0]);
      if (!uploadedFile) throw new Error('File upload failed');

      // Get new file URL
      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error('File preview generation failed');
      }

      // Update media with new URL and file ID, ensuring they are arrays
      media = {
        mediaUrl: [fileUrl],
        mediaId: [uploadedFile.$id],
      };
    }

    const links = Array.isArray(project.links)
      ? project.links
      : project.links
      ? project.links.replace(/ /g, '').split(',')
      : [];

    const tags = Array.isArray(project.tags)
      ? project.tags
      : project.tags?.replace(/ /g, '').split(',') || [];

    // Update document in the database
    const updatedPost = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.portfolioPostCollectionId,
      project.projectId,
      {
        title: project.title,
        description: project.description,
        mediaUrl: media.mediaUrl, // Ensured to be a single-level array
        mediaId: media.mediaId, // Ensured to be a single-level array
        links: links,
        tags: tags,
      }
    );

    // If update failed, delete newly uploaded file (if any)
    if (!updatedPost && hasFileToUpdate) {
      await deleteFile(media.mediaId[0]);
      throw new Error('Document update failed');
    }

    // Safely delete the old file after a successful update
    if (
      hasFileToUpdate &&
      Array.isArray(project.mediaId) &&
      project.mediaId.length > 0
    ) {
      await deleteFile(project.mediaId[0]);
    }

    return updatedPost;
  } catch (error) {
    console.error(error);
  }
}

export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      appwriteConfig.postBucketId,
      fileId,
      0,
      0,
      ImageGravity.Center,
      60
    );

    if (!fileUrl) throw Error;

    // console.log(fileUrl);

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

export async function getProjectById(projectId: string) {
  try {
    const project = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.portfolioPostCollectionId,
      projectId
    );
    return project;
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
    const { documents: posts } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      [Query.search('content', searchTerm)]
    );

    if (!posts) throw Error;

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

    return { documents: postsWithAuthors };
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

// User Posts
export async function getUserPosts({
  pageParam,
  userId,
}: {
  pageParam: number;
  userId: string;
}) {
  const queries: any[] = [
    Query.orderDesc('$createdAt'),
    Query.equal('creatorId', userId), // Filter by userId
    Query.limit(9),
  ];

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
        dpUrl: users[index]?.dpUrl || null,
      },
    }));
    return { documents: postsWithUserDetails };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

// User Projects
export async function getUserProjects({
  pageParam,
  userId,
}: {
  pageParam: number;
  userId: string;
}) {
  const queries: any[] = [
    Query.orderDesc('$createdAt'),
    Query.equal('creatorId', userId), // Filter by userId
    Query.limit(9),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: projects } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.portfolioPostCollectionId,
      queries
    );

    if (!projects || projects.length === 0) return { documents: [] };

    const userFetchPromises = projects.map((project) =>
      databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId, // Replace with actual user collection ID
        project.creatorId
      )
    );

    // Resolve all user fetch promises in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine posts with their corresponding user details
    const projectsWithUserDetails = projects.map((project, index) => ({
      ...project,
      creator: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
      },
    }));
    return { documents: projectsWithUserDetails };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

// ***** LIKE & SAVE *****

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



// ***** COMMENT & FEEDBACK *****

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
        accountId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error };
  }
}

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
        accountId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding feedback:', error);
    return { success: false, error };
  }
}

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
        accountId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding comment reply:', error);
    return { success: false, error };
  }
}

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
        accountId: userId,
        content,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error adding feedback reply:', error);
    return { success: false, error };
  }
}
