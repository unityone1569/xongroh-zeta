import { ID, Models, OAuthProvider, Query } from 'appwrite';
import { INewUser } from '@/types';
import { account, appwriteConfig, avatars, databases } from './config';

// AUTH

export async function createUserAccount(
  user: INewUser
): Promise<Models.Document | Error> {
  try {
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
    await account.createOAuth2Session(
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
    const newUser = await saveUserToDB({
      accountId: session.$id,
      name: session.name,
      email: session.email,
      dpUrl: avatars.getInitials(session.name),
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
