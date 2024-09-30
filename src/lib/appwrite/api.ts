import { ID, Models, OAuthProvider, Query } from 'appwrite';
import { INewUser } from '@/types';
import { account, appwriteConfig, avatars, databases } from './config';

// AUTH

export async function createUserAccount(user: INewUser) {
  try {
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.name
    );

    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(user.name);

    const newUser = await saveUserToDB({
      accountId: newAccount.$id,
      name: newAccount.name,
      hometown: user.hometown,
      email: newAccount.email,
      dpUrl: avatarUrl,
    });

    return newUser;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// loginWithGoogle function
export async function loginWithGoogle() {
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


// Helper function to check if a user exists

export const createUserAccountWithGoogle = async (session: any) => {
  console.log('Session passed to createUserAccountWithGoogle:', session);

  // Check if user already exists in the database
  const existingUser = await checkUserExists(session.$id);
  console.log('Existing user check result:', existingUser);

  if (existingUser) {
    console.log('User already exists in the database.');
    return existingUser; // Return the existing user if found
  }

  // Create the user if they don't exist
  try {
    const newUser = await saveUserToDB({
      accountId: session.$id,
      name: session.name,
      email: session.email,
      dpUrl: avatars.getInitials(session.name),
    });

    console.log('User created successfully:', newUser);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Error creating user');
  }
};

export async function checkUserExists(
  email: string
): Promise<Models.Document | null> {
  try {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('email', email)] // Query to filter by email
    );

    console.log('Users found in checkUserExists:', users);

    // Check if there are any documents and return the first one or null
    return users.documents?.[0] || null;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return null;
  }
}

// Helper function to save a new user to the database
async function saveUserToDB(user: {
  accountId: string;
  name: string;
  hometown?: string;
  email: string;
  dpUrl: URL;
}) {
  try {
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      user
    );
    return newUser;
  } catch (error) {
    console.error('Error saving user to the database:', error);
    throw new Error('Failed to save user to the database');
  }
}

export async function signInAccount(user: { email: string; password: string }) {
  try {
    const session = await account.createEmailPasswordSession(
      user.email,
      user.password
    );
    return session;
  } catch (error) {
    console.log(error);
  }
}

export async function getAccount() {
  try {
    const checkAccount = await account.get();
    console.log('Account retrieved successfully:', checkAccount);
    return checkAccount;
  } catch (error) {
    console.log('Error in getAccount (no session found):', error);
    return null; // Explicitly return null if session is not found
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await getAccount();
    console.log('Current account in getCurrentUser:', currentAccount);

    if (!currentAccount) {
      console.log('No account found in getCurrentUser');
      return null;
    }

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    );

    if (!currentUser || currentUser.documents.length === 0) {
      console.log('No user found in the database for this account ID.');
      return null;
    }

    console.log('User found in database:', currentUser.documents[0]);
    return currentUser.documents[0];
  } catch (error) {
    console.error('Error getting current user:', error);
    return null; // Return null if there's an error
  }
}

export async function signOutAccount() {
  try {
    const session = await account.deleteSession('current');
    return session;
  } catch (error) {
    console.log(error);
  }
}
