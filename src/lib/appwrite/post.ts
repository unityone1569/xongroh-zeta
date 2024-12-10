import { ID, Query } from 'appwrite';
import { INewPost, INewProject, IUpdatePost, IUpdateProject } from '@/types';
import { appwriteConfig, databases, storage } from './config';
import {
  deleteAllCommentsForPost,
  deleteAllFeedbacksForPost,
  deleteAllPostLikes,
  deleteAllPostSaves,
} from './interaction';

// ****************
// ***** POST *****

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
        appwriteConfig.creatorCollectionId, // Replace with actual user collection ID
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

export async function createPost(post: INewPost) {
  try {
    let fileUrl: string = '';
    let uploadedFileId = '';

    if (post.file && post.file.length > 0) {
      const uploadedFile = await uploadFile(post.file[0]);
      if (!uploadedFile) throw new Error('File upload failed');

      // Get file Url
      fileUrl = String(getFilePreview(uploadedFile.$id));
      uploadedFileId = uploadedFile.$id;

      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error('File preview generation failed');
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

export async function deletePost(
  postId: string,
  mediaId: string,
  creatorId: string
) {
  if (!postId || !creatorId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(mediaId);

    await deleteAllCommentsForPost(postId);

    await deleteAllFeedbacksForPost(postId);

    await decrementUserCreationsCount(creatorId);

    await deleteAllPostLikes(postId);

    await deleteAllPostSaves(postId);

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
  }
}

async function incrementUsercreationsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId
    );

    // Increment the projectsCount attribute
    const updatedCreationsCount = (userDoc.creationsCount || 0) + 1;

    // Update the user document with the incremented projectsCount
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId,
      { creationsCount: updatedCreationsCount }
    );
  } catch (error) {
    console.error('Failed to increment projects count:', error);
  }
}

async function decrementUserCreationsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId
    );

    // Ensure creationsCount is at least 1 before decrementing
    const updatedCreationsCount = Math.max(
      (userDoc.creationsCount || 0) - 1,
      0
    );

    // Update the user document with the decremented creationsCount
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId,
      { creationsCount: updatedCreationsCount }
    );
  } catch (error) {
    console.error('Failed to decrement projects count:', error);
  }
}

// SEARCH-POST

export async function searchPosts(searchTerm: string) {
  try {
    const { documents: posts } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      [Query.search('content', searchTerm)]
    );

    if (!posts || posts.length === 0) {
      // No posts found, return an empty response
      return { documents: [] };
    }

    const creatorIds = [...new Set(posts.map((post) => post.creatorId))];

    // Handle case where creatorIds is empty
    if (creatorIds.length === 0) {
      return { documents: posts.map((post) => ({ ...post, author: null })) };
    }

    const { documents: authors } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      [Query.equal('$id', creatorIds)]
    );

    const authorMap = new Map(authors.map((author) => [author.$id, author]));

    const postsWithAuthors = posts.map((post) => ({
      ...post,
      author: authorMap.get(post.creatorId) || null,
    }));

    return { documents: postsWithAuthors };
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

export async function getInfinitePosts({ pageParam }: { pageParam: number }) {
  const queries: any[] = [Query.orderDesc('$updatedAt'), Query.limit(6)];

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
      appwriteConfig.creatorCollectionId,
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

export async function getSavedPosts(userId: string) {
  try {
    const savedPosts = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.savesCollectionId,
      [Query.equal('creatorId', userId)]
    );

    if (!savedPosts) return [];

    return savedPosts.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getPostsByIds(postIds: string[]) {
  if (!postIds.length) return [];
  
  try {
    const { documents: posts } = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.creationPostCollectionId,
      [Query.equal('$id', [...postIds])]
    );

    if (!posts || posts.length === 0) return [];

    // Fetch creator details
    const userFetchPromises = posts.map((post) =>
      databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.creatorCollectionId,
        post.creatorId
      )
    );

    const users = await Promise.all(userFetchPromises);

    // Combine posts with creator details
    const postsWithUserDetails = posts.map((post, index) => ({
      ...post,
      creator: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
      },
    }));

    return postsWithUserDetails;
  } catch (error) {
    console.error('Error fetching posts or creator data:', error);
    return [];
  }
}

// *******************
// ***** PROJECT *****

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

export async function deleteProject(
  postId: string,
  mediaId: string,
  creatorId: string
) {
  if (!postId || !creatorId) return;

  try {
    const statusCode = await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.portfolioPostCollectionId,
      postId
    );

    if (!statusCode) throw Error;

    await deleteFile(mediaId);

    await decrementUserProjectsCount(creatorId);

    await deleteAllPostLikes(postId);

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
  }
}

async function incrementUserProjectsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId
    );

    // Increment the projectsCount attribute
    const updatedProjectsCount = (userDoc.projectsCount || 0) + 1;

    // Update the user document with the incremented projectsCount
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId,
      { projectsCount: updatedProjectsCount }
    );
  } catch (error) {
    console.error('Failed to increment projects count:', error);
  }
}

async function decrementUserProjectsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId
    );

    // Ensure creationsCount is at least 1 before decrementing
    const updatedProjectCount = Math.max((userDoc.projectsCount || 0) - 1, 0);

    // Update the user document with the decremented creationsCount
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      userId,
      { projectsCount: updatedProjectCount }
    );
  } catch (error) {
    console.error('Failed to decrement projects count:', error);
  }
}

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

// ******************
// ***** HELPER *****

export async function getAuthorById(creatorId: string) {
  try {
    const post = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.creatorCollectionId,
      creatorId
    );
    return post;
  } catch (error) {
    console.log(error);
  }
}

//FILE

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
    const fileUrl = storage.getFileView(
      appwriteConfig.postBucketId,
      fileId,
    
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


