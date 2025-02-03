import { ID, ImageGravity, Models, OAuthProvider, Query } from 'appwrite';
import { INewUser, IUpdateUser } from '@/types';
import { account, appwriteConfig, avatars, databases, storage } from './config';

// *** APPWRITE ***

// Database
const db = {
  usersId: appwriteConfig.databases.users.databaseId,
  postsId: appwriteConfig.databases.posts.databaseId,
};

// Collections
const cl = {
  supportId: appwriteConfig.databases.users.collections.support,
  creatorId: appwriteConfig.databases.users.collections.creator,
  projectId: appwriteConfig.databases.posts.collections.project,
  creationId: appwriteConfig.databases.posts.collections.creation,
};

// Bucket
const bk = {
  creatorBucketId: appwriteConfig.storage.creatorBucket,
};

const url = {
  googleSuccessUrl: appwriteConfig.oauth.googleSuccessUrl,
  googleFailureUrl: appwriteConfig.oauth.googleFailureUrl,
};

// *** SUPPORT ***

// Check-Supporting-User
export async function checkSupportingUser(
  creatorId: string,
  supportingId: string
): Promise<boolean> {
  try {
    const supports = await databases.listDocuments(db.usersId, cl.supportId, [
      Query.equal('creatorId', creatorId),
    ]);

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

// Support-Creator
export async function support(
  creatorId: string,
  supportingId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Fetch user document to update supportingCount
    const user = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      creatorId
    );

    // Update supportingCount in the user collection
    const currentSupportingCount = user.supportingCount || 0;
    const updatedSupportingCount = currentSupportingCount + 1;

    const updateUserPromise = databases.updateDocument(
      db.usersId,
      cl.creatorId,
      creatorId,
      { supportingCount: updatedSupportingCount }
    );

    // Manage supportingIds in the supports collection
    const supportsQuery = await databases.listDocuments(
      db.usersId,
      cl.supportId,
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
        db.usersId,
        cl.supportId,
        supportDoc.$id,
        { supportingIds: updatedSupportingIds }
      );
    } else {
      // Create a new document in supports collection
      updateSupportsPromise = databases.createDocument(
        db.usersId,
        cl.supportId,
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

// Unsupport-Creator
export async function unsupport(
  creatorId: string,
  supportingId: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Fetch user document to update supportingCount
    const user = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      creatorId
    );

    // Ensure supportingCount is not negative
    const currentSupportingCount = user.supportingCount || 0;
    const updatedSupportingCount = Math.max(0, currentSupportingCount - 1);

    const updateUserPromise = databases.updateDocument(
      db.usersId,
      cl.creatorId,
      creatorId,
      { supportingCount: updatedSupportingCount }
    );

    // Manage supportingIds in the supports collection
    const supportsQuery = await databases.listDocuments(
      db.usersId,
      cl.supportId,
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
        db.usersId,
        cl.supportId,
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

// *** CREATOR ***

// * AUTH *

// Create-User-Account
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
    // create a new session
    await account.createEmailPasswordSession(user.email, user.password);

    // Send verification email
    await sendVerificationEmail();

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
    const agreedUserAgreements = true;
    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      hometown: user.hometown,
      email: newAccount.email,
      dpUrl: avatarUrl,
      username: username, // Add the generated username
      agreeUserAgreements: agreedUserAgreements,
    });

    return newUser;
  } catch (error) {
    console.error('Error during account creation:', error);
    throw error;
  }
}

// Create-User-Account-With-Google
export async function createUserAccountWithGoogle(
  session: any
): Promise<Models.Document> {
  // Check if the user already exists in the database
  const existingUser = await checkUserExists(session.email);
  if (existingUser) {
    // console.log('User data already exists in the database');
    // console.log(existingUser);

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
    const agreedUserAgreements = true;
    const newUser = await saveUserToDB({
      accountId: session.$id,
      name: session.name,
      email: session.email,
      dpUrl: avatars.getInitials(session.name),
      username: username,
      agreeUserAgreements: agreedUserAgreements,
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Error creating user');
  }
}

// Sign-In
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

// Sign-In-With-Google
export async function loginWithGoogle(): Promise<void> {
  try {
    account.createOAuth2Session(
      OAuthProvider.Google,
      url.googleSuccessUrl,
      url.googleFailureUrl
    );
  } catch (error) {
    console.error('Error during Google OAuth session creation:', error);
    throw error;
  }
}

// Sign-Out
export async function signOutAccount(): Promise<any> {
  try {
    return await account.deleteSession('current');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

// Save-User-To-DB
async function saveUserToDB(user: {
  accountId: string;
  name: string;
  username: string;
  hometown?: string;
  email: string;
  dpUrl: URL;
  agreeUserAgreements: Boolean;
}): Promise<Models.Document> {
  try {
    // Save the user to the database
    return await databases.createDocument(
      db.usersId,
      cl.creatorId,
      ID.unique(),
      user
    );
  } catch (error) {
    console.error('Error saving user to the database:', error);
    throw new Error('Failed to save user');
  }
}

// Update-User-Account-Id
export async function updateUserAccountId(
  userId: string,
  newAccountId: string
): Promise<Models.Document> {
  try {
    const updatedUser = await databases.updateDocument(
      db.usersId,
      cl.creatorId,
      userId,
      { accountId: newAccountId }
    );
    return updatedUser;
  } catch (error) {
    console.error('Error updating user accountId:', error);
    throw error;
  }
}

// Check-User-Exists
export async function checkUserExists(
  email: string
): Promise<Models.Document | null> {
  try {
    const users = await databases.listDocuments(db.usersId, cl.creatorId, [
      Query.equal('email', email),
    ]);

    return users.documents?.[0] || null;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return null;
  }
}

// Send-Verification-Email
export async function sendVerificationEmail(): Promise<void> {
  try {
    // Update with your actual verification endpoint
    await account.createVerification(
      `${window.location.origin}/verify-success`
    );
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

// Verify-Email
export async function verifyEmail(
  userId: string,
  secret: string
): Promise<boolean> {
  try {
    const response = await account.updateVerification(userId, secret);
    // Return true if verification was successful
    return Boolean(response.$id);
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
}

// Is-Email-Verified
export async function isEmailVerified(): Promise<boolean> {
  try {
    const session = await getAccount();
    return session?.emailVerification || false;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

// Reset-Password
export async function resetPassword(email: string): Promise<void> {
  try {
    await account.createRecovery(
      email,
      `${window.location.origin}/new-password`
    );
  } catch (error) {
    console.error('Error creating password reset:', error);
    throw error;
  }
}

// Confirm-Password-Reset
export async function confirmPasswordReset(
  userId: string,
  secret: string,
  newPassword: string
): Promise<void> {
  try {
    await account.updateRecovery(userId, secret, newPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

// * USER MANAGEMENT *

// Get-User
export async function getAccount(): Promise<any | null> {
  try {
    const checkAccount = await account.get();
    return checkAccount || null;
  } catch (error) {
    console.log('Error in getAccount (no session found):', error);
    return null;
  }
}

// Get-Current-User
export async function getCurrentUser(): Promise<Models.Document> {
  try {
    const currentAccount = await getAccount();

    if (!currentAccount) {
      throw new Error('No current account found.');
    }

    const currentUser = await databases.listDocuments(
      db.usersId,
      cl.creatorId,
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

// Get-User-Account-Id
export async function getUserAccountId(userId: string): Promise<string> {
  try {
    const userDocument = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      userId
    );

    // Assuming userDocument has an 'accountId' field
    const accountId = userDocument.accountId;

    if (!accountId) {
      throw new Error(`Account ID not found for user ID ${userId}`);
    }

    return accountId;
  } catch (error) {
    console.error('Error fetching user account ID:', error);
    throw error;
  }
}

// Get-User-Info
export async function getUserInfo(accountId: string) {
  try {
    const user = await databases.getDocument(
      db.usersId,
      cl.creatorId,
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
      verifiedUser: user.verifiedUser,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return { name: 'Unknown', dpUrl: '' };
  }
}

// Get-User-ById
export async function getUserById(userId: string) {
  try {
    const user = await databases.getDocument(db.usersId, cl.creatorId, userId);
    return user;
  } catch (error) {
    console.log(error);
  }
}

// Update-Profile
export async function updateProfile(user: IUpdateUser) {
  try {
    let profileMedia = {
      dpUrl: user.dpUrl || '',
      dpId: user.dpId || '',
    };
    let coverMedia = {
      coverUrl: user.coverUrl || null,
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
      db.usersId,
      cl.creatorId,
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

// Search-Users
export async function searchUsers(searchTerm: string) {
  try {
    const { documents: users } = await databases.listDocuments(
      db.usersId,
      cl.creatorId,
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

// Upload-File
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      bk.creatorBucketId,
      ID.unique(),
      file
    );
    return uploadedFile;
  } catch (error) {
    console.log(error);
  }
}

// Get-File-Preview
export function getFilePreview(fileId: string) {
  try {
    const fileUrl = storage.getFilePreview(
      bk.creatorBucketId,
      fileId,
      0,
      0,
      ImageGravity.Center,
      50
    );

    if (!fileUrl) throw Error;

    // console.log(fileUrl);

    return fileUrl;
  } catch (error) {
    console.log(error);
  }
}

// Delete-File
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(bk.creatorBucketId, fileId);

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
  }
}

// * CREATORS *

// Get-Top-Creators
export async function getTopCreators() {
  try {
    const creators = await databases.listDocuments(db.usersId, cl.creatorId, [
      Query.orderDesc('creationsCount'),
      Query.limit(10),
    ]);

    if (!creators) throw Error;

    return creators;
  } catch (error) {
    console.error('Error fetching top creators:', error);
    throw error;
  }
}

// Get-Infinite-Users
export async function getInfiniteUsers({ pageParam }: { pageParam: number }) {
  const queries: any[] = [
    Query.orderDesc('$updatedAt'),
    Query.equal('hasSeenWelcome', true),
    Query.limit(10),
    Query.select(['$id', 'name', 'profession', 'hometown', 'dpUrl']),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: users } = await databases.listDocuments(
      db.usersId,
      cl.creatorId,
      queries
    );

    if (!users || users.length === 0) return { documents: [] };

    return { documents: users }; // Ensure consistent return format
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// * USER POSTS *

// Get-User-Posts
export async function getUserCreations({
  pageParam,
  authorId,
}: {
  pageParam: number;
  authorId: string;
}) {
  const queries: any[] = [
    Query.orderDesc('$createdAt'),
    Query.equal('authorId', authorId), // Filter by authorId
    Query.limit(9),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: creations } = await databases.listDocuments(
      db.postsId,
      cl.creationId,
      queries
    );

    if (!creations || creations.length === 0) return { documents: [] };

    const authorFetchPromises = creations.map((creation) =>
      databases.getDocument(db.usersId, cl.creatorId, creation.authorId)
    );

    // Resolve all user fetch promises in parallel
    const users = await Promise.all(authorFetchPromises);

    // Combine posts with their corresponding user details
    const creationsWithAuthorDetails = creations.map((creation, index) => ({
      ...creation,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
      },
    }));
    return { documents: creationsWithAuthorDetails };
  } catch (error) {
    console.error('Error fetching creations:', error);
    throw error;
  }
}

// Get-User-Projects
export async function getUserProjects({
  pageParam,
  authorId,
}: {
  pageParam: number;
  authorId: string;
}) {
  const queries: any[] = [
    Query.orderDesc('$createdAt'),
    Query.equal('authorId', authorId), // Filter by authorId
    Query.limit(9),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: projects } = await databases.listDocuments(
      db.postsId,
      cl.projectId,
      queries
    );

    if (!projects || projects.length === 0) return { documents: [] };

    const authorFetchPromises = projects.map((project) =>
      databases.getDocument(
        db.usersId,
        cl.creatorId, // Replace with actual user collection ID
        project.authorId
      )
    );

    // Resolve all user fetch promises in parallel
    const users = await Promise.all(authorFetchPromises);

    // Combine posts with their corresponding user details
    const projectsWithAuthorDetails = projects.map((project, index) => ({
      ...project,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
      },
    }));
    return { documents: projectsWithAuthorDetails };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
}

export async function updateWelcomeStatus(userId: string) {
  try {
    return await databases.updateDocument(db.usersId, cl.creatorId, userId, {
      hasSeenWelcome: true,
    });
  } catch (error) {
    console.error('Error updating welcome status:', error);
    throw error;
  }
}
