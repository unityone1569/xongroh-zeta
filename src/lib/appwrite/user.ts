import { ID, Models, OAuthProvider, Query } from 'appwrite';
import { INewUser, IUpdateUser } from '@/types';
import { account, appwriteConfig, avatars, databases } from './config';
import { deleteFile, getFilePreview, uploadFile } from './post';

// ****************
// ***** AUTH *****

// SIGN-UP

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

// SIGN-IN

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

// SIGN-OUT

export async function signOutAccount(): Promise<any> {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// HELPER

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

// *******************
// ***** PROFILE *****

// USER-DETAILS

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
      supportingCount: user.supportingCount,
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

// USER-SEARCH

export async function searchUsers(searchTerm: string) {
  try {
    const { documents: users } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.search('name', searchTerm)] // Adjust field as necessary
    );

    if (!users || users.length === 0) {
      return { documents: [] }; // Return empty array if no users found
    }

    return { documents: users };
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
}

export async function getInfiniteUsers({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(9)];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: users } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      queries
    );

    if (!users || users.length === 0) return { documents: [] };

    return { documents: users }; // Ensure consistent return format
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// USER-POSTS

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

// USER-PROJECTS
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
