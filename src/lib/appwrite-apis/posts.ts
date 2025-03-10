import { ID, Query } from 'appwrite';
import {
  INewCreation,
  INewProject,
  IUpdateCreation,
  IUpdateProject,
} from '@/types';
import { appwriteConfig, databases, storage } from './config';
import { deleteAllPostLikes, deleteAllPostSaves } from './interactions';
import {
  deleteAllCommentsForPost,
  deleteAllFeedbacksForPost,
} from './comments';

// *** APPWRITE ***

// Database
const db = {
  postsId: appwriteConfig.databases.posts.databaseId,
  usersId: appwriteConfig.databases.users.databaseId,
  interactionId: appwriteConfig.databases.interactions.databaseId,
};

// Collections
const cl = {
  creationId: appwriteConfig.databases.posts.collections.creation,
  projectId: appwriteConfig.databases.posts.collections.project,
  creatorId: appwriteConfig.databases.users.collections.creator,
  saveId: appwriteConfig.databases.interactions.collections.save,
  supportId: appwriteConfig.databases.users.collections.support,
};

// Buckets
const bk = {
  creationBucketId: appwriteConfig.storage.creationBucket,
};

// *** CREATIONS ***

// Get-Recent-Creations
export async function getRecentCreations({
  pageParam,
}: {
  pageParam: number | null;
}) {
  try {
    const queries: any[] = [
      Query.orderDesc('$createdAt'),
      Query.limit(6),
      Query.select([
        '$id',
        'content',
        'mediaUrl',
        'authorId',
        'tags',
        '$createdAt',
      ]),
    ];

    if (pageParam) {
      queries.push(Query.cursorAfter(pageParam.toString()));
    }

    // Fetch recent posts with pagination
    const { documents: creations } = await databases.listDocuments(
      db.postsId,
      cl.creationId,
      queries
    );

    if (!creations || creations.length === 0) {
      return { documents: [] };
    }

    // Create user fetch promises
    const userFetchPromises = creations.map((creation) =>
      databases.getDocument(db.usersId, cl.creatorId, creation.authorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    // Fetch all users in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine creations with user details
    const creationsWithUserDetails = creations.map((creation, index) => ({
      ...creation,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
    }));

    return { documents: creationsWithUserDetails };
  } catch (error) {
    console.error('Error:', error);
    return { documents: [] };
  }
}

// Get-Creation-By-Id
export async function getCreationById(CreationId: string) {
  try {
    const creation = await databases.getDocument(
      db.postsId,
      cl.creationId,
      CreationId
    );
    return creation;
  } catch (error) {
    console.log(error);
  }
}

//add-Creation
export async function addCreation(creation: INewCreation) {
  try {
    let fileUrl: string = '';
    let uploadedFileId = '';

    if (creation.file && creation.file.length > 0) {
      const uploadedFile = await uploadFile(creation.file[0]);
      if (!uploadedFile) throw new Error('File upload failed');

      // Get file Url
      fileUrl = String(getFilePreview(uploadedFile.$id));
      uploadedFileId = uploadedFile.$id;

      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw new Error('File preview generation failed');
      }
    }

    // convert tags into an array, splitting by both commas and spaces
    const tags =
      creation.tags?.split(/[\s,]+/).filter((tag) => tag.length > 0) || [];

    // Create the creation
    const newCreation = await databases.createDocument(
      db.postsId,
      cl.creationId,
      ID.unique(),
      {
        authorId: creation.authorId,
        content: creation.content,
        mediaUrl: fileUrl ? [fileUrl] : [],
        mediaId: uploadedFileId ? [uploadedFileId] : [],
        tags: tags,
      }
    );

    if (!newCreation && uploadedFileId) {
      await deleteFile(uploadedFileId);
      throw Error;
    }

    // Increment the projectsCount for the user
    await incrementUsercreationsCount(creation.authorId);
    return newCreation;
  } catch (error) {
    console.log(error);
  }
}

// Update-Creation
export async function updateCreation(creation: IUpdateCreation) {
  const hasFileToUpdate = creation.file.length > 0;

  try {
    let media = {
      mediaUrl: Array.isArray(creation.mediaUrl)
        ? creation.mediaUrl
        : [creation.mediaUrl],
      mediaId: Array.isArray(creation.mediaId)
        ? creation.mediaId
        : [creation.mediaId],
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(creation.file[0]);
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
    const tags = Array.isArray(creation.tags)
      ? creation.tags
      : creation.tags?.split(/[\s,]+/).filter((tag) => tag.length > 0) || [];

    //  Update post
    const updatedCreation = await databases.updateDocument(
      db.postsId,
      cl.creationId,
      creation.creationId,
      {
        content: creation.content,
        mediaUrl: media.mediaUrl,
        mediaId: media.mediaId,
        tags: tags,
      }
    );

    // Failed to update
    if (!updatedCreation) {
      // Delete new file that has been recently uploaded
      if (hasFileToUpdate) {
        await deleteFile(media.mediaId[0]);
      }

      // If no new file uploaded, just throw error
      throw Error;
    }

    // Safely delete old file after successful update
    if (hasFileToUpdate) {
      await deleteFile(creation.mediaId[0]);
    }

    return updatedCreation;
  } catch (error) {
    console.log(error);
  }
}

// Delete-Creation
export async function deleteCreation(
  creationId: string,
  mediaId: string,
  authorId: string
) {
  if (!creationId || !authorId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.postsId,
      cl.creationId,
      creationId
    );

    if (!statusCode) throw Error;

    if (mediaId && (!Array.isArray(mediaId) || mediaId.length > 0)) {
      await deleteFile(mediaId);
    }

    await deleteAllCommentsForPost(creationId);

    await deleteAllFeedbacksForPost(creationId);

    await decrementUserCreationsCount(authorId);

    await deleteAllPostLikes(creationId);

    await deleteAllPostSaves(creationId);

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
  }
}

// Increment-User-Creations-Count
async function incrementUsercreationsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      userId
    );

    // Increment the creationsCount attribute
    const updatedCreationsCount = (userDoc.creationsCount || 0) + 1;

    // Update the user document with the incremented creationsCoun
    await databases.updateDocument(db.usersId, cl.creatorId, userId, {
      creationsCount: updatedCreationsCount,
    });
  } catch (error) {
    console.error('Failed to increment creation count:', error);
  }
}

// Decrement-User-Creations-Count
async function decrementUserCreationsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      userId
    );

    // Ensure creationsCount is at least 1 before decrementing
    const updatedCreationsCount = Math.max(
      (userDoc.creationsCount || 0) - 1,
      0
    );

    // Update the user document with the decremented creationsCount
    await databases.updateDocument(db.usersId, cl.creatorId, userId, {
      creationsCount: updatedCreationsCount,
    });
  } catch (error) {
    console.error('Failed to decrement creation count:', error);
  }
}

// Get-Search-Creations
export async function getSearchCreations(searchTerm: string) {
  try {
    const { documents: creations } = await databases.listDocuments(
      db.postsId,
      cl.creationId,
      [Query.search('content', searchTerm)]
    );

    if (!creations || creations.length === 0) {
      // No posts found, return an empty response
      return { documents: [] };
    }

    // Create user fetch promises
    const userFetchPromises = creations.map((creation) =>
      databases.getDocument(db.usersId, cl.creatorId, creation.authorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    // Fetch all users in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine creations with user details
    const creationsWithUserDetails = creations.map((creation, index) => ({
      ...creation,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
    }));

    return { documents: creationsWithUserDetails };
  } catch (error) {
    console.error('Error fetching creations:', error);
    throw error;
  }
}

// Get-Infinite-Creations
export async function getInfiniteCreations({
  pageParam,
}: {
  pageParam: number;
}) {
  const queries: any[] = [
    Query.orderDesc('$updatedAt'),
    Query.limit(6),
    Query.select([
      '$id',
      'content',
      'mediaUrl',
      'authorId',
      'tags',
      '$createdAt',
    ]),
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

    // Create user fetch promises
    const userFetchPromises = creations.map((creation) =>
      databases.getDocument(db.usersId, cl.creatorId, creation.authorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    // Fetch all users in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine creations with user details
    const creationsWithUserDetails = creations.map((creation, index) => ({
      ...creation,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
    }));

    return { documents: creationsWithUserDetails };
    // return { documents: creationsWithAuthors }; // Ensure returning documents
  } catch (error) {
    console.error('Error fetching creations:', error);
    throw error;
  }
}

// Get-Saved-Creations
export async function getSavedCreations({
  pageParam,
  userId,
}: {
  pageParam: number | null;
  userId: string;
}) {
  try {
    // Query saved posts with descending order by creation date
    const queries: any[] = [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(5),
      Query.select(['$id', 'postId']),
    ];

    if (pageParam) {
      queries.push(Query.cursorAfter(pageParam.toString()));
    }

    // Get saved posts documents
    const savedCreations = await databases.listDocuments(
      db.interactionId,
      cl.saveId,
      queries
    );

    if (!savedCreations?.documents.length) return { documents: [] };

    const creationIds = savedCreations.documents.map((save) => save.postId);

    // Fetch actual posts ordered by save date
    const { documents: creations } = await databases.listDocuments(
      db.postsId,
      cl.creationId,
      [Query.equal('$id', creationIds)]
    );

    if (!creations?.length) return { documents: [] };

    // Fetch creator details
    const authors = await Promise.all(
      creations.map((creation) =>
        databases.getDocument(db.usersId, cl.creatorId, creation.authorId)
      )
    );

    // Map saved posts to maintain save order
    const creationsWithDetails = savedCreations.documents.map(
      (savedCreation) => {
        const creation = creations.find(
          (c1) => c1.$id === savedCreation.postId
        );
        const author = authors.find((c2) => c2.$id === creation?.authorId);

        return {
          ...creation,
          author: {
            name: author?.name || '',
            dpUrl: author?.dpUrl || null,
          },
          saveId: savedCreation.$id,
        };
      }
    );

    return { documents: creationsWithDetails };
  } catch (error) {
    console.error('Error fetching saved creations:', error);
    return { documents: [] };
  }
}

// Get-Following-Creations
export async function getSupportingCreations({
  pageParam,
  userId,
}: {
  pageParam: number | null;
  userId: string;
}) {
  try {
    // First get the list of creators the user is supporting
    const supports = await databases.listDocuments(db.usersId, cl.supportId, [
      Query.equal('creatorId', userId),
    ]);

    if (!supports?.documents.length) {
      return { documents: [] };
    }

    // Get the list of supported creator IDs
    const supportedCreatorIds = supports.documents[0].supportingIds || [];

    if (supportedCreatorIds.length === 0) {
      return { documents: [] };
    }

    // Query posts from supported creators with pagination
    const queries: any[] = [
      Query.equal('authorId', supportedCreatorIds),
      Query.orderDesc('$createdAt'),
      Query.limit(6),
      Query.select([
        '$id',
        'content',
        'mediaUrl',
        'authorId',
        'tags',
        '$createdAt',
      ]),
    ];

    if (pageParam) {
      queries.push(Query.cursorAfter(pageParam.toString()));
    }

    const { documents: creations } = await databases.listDocuments(
      db.postsId,
      cl.creationId,
      queries
    );

    if (!creations || creations.length === 0) {
      return { documents: [] };
    }

    // Get author details
    const userFetchPromises = creations.map((creation) =>
      databases.getDocument(db.usersId, cl.creatorId, creation.authorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    const users = await Promise.all(userFetchPromises);

    // Combine posts with author details
    const creationsWithUserDetails = creations.map((creation, index) => ({
      ...creation,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
    }));

    return { documents: creationsWithUserDetails };
  } catch (error) {
    console.error('Error fetching following creations:', error);
    return { documents: [] };
  }
}

// *** PROJECT ***

// Get-Project-By-Id
export async function getProjectById(projectId: string) {
  try {
    const project = await databases.getDocument(
      db.postsId,
      cl.projectId,
      projectId
    );
    return project;
  } catch (error) {
    console.log(error);
  }
}

// Add-Project
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
      ? project.links.split(/[\s,]+/).filter((link) => link.length > 0)
      : []; // Empty array if no links provided

    // Normalize tags to an array
    const tags = Array.isArray(project.tags)
      ? project.tags
      : project.tags?.split(/[\s,]+/).filter((tag) => tag.length > 0) || [];

    // Create the project document
    const newProject = await databases.createDocument(
      db.postsId,
      cl.projectId,
      ID.unique(),
      {
        authorId: project.authorId,
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
    await incrementUserProjectsCount(project.authorId);

    return newProject;
  } catch (error) {
    console.log(error);
  }
}

// Update-Project
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
      ? project.links.split(/[\s,]+/).filter((link) => link.length > 0)
      : [];

    const tags = Array.isArray(project.tags)
      ? project.tags
      : project.tags?.split(/[\s,]+/).filter((tag) => tag.length > 0) || [];

    // Update document in the database
    const updatedPost = await databases.updateDocument(
      db.postsId,
      cl.projectId,
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

// Delete-Project
export async function deleteProject(
  projectId: string,
  mediaId: string,
  authorId: string
) {
  if (!projectId || !authorId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.postsId,
      cl.projectId,
      projectId
    );

    if (!statusCode) throw Error;

    if (mediaId && (!Array.isArray(mediaId) || mediaId.length > 0)) {
      await deleteFile(mediaId);
    }

    await decrementUserProjectsCount(authorId);

    await deleteAllPostLikes(projectId);

    return { status: 'Ok' };
  } catch (error) {
    console.log(error);
  }
}

// Increment-User-Projects-Count
async function incrementUserProjectsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      userId
    );

    // Increment the projectsCount attribute
    const updatedProjectsCount = (userDoc.projectsCount || 0) + 1;

    // Update the user document with the incremented projectsCount
    await databases.updateDocument(db.usersId, cl.creatorId, userId, {
      projectsCount: updatedProjectsCount,
    });
  } catch (error) {
    console.error('Failed to increment projects count:', error);
  }
}

// Decrement-User-Projects-Count
async function decrementUserProjectsCount(userId: string) {
  try {
    // Retrieve the user document
    const userDoc = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      userId
    );

    // Ensure creationsCount is at least 1 before decrementing
    const updatedProjectCount = Math.max((userDoc.projectsCount || 0) - 1, 0);

    // Update the user document with the decremented creationsCount
    await databases.updateDocument(db.usersId, cl.creatorId, userId, {
      projectsCount: updatedProjectCount,
    });
  } catch (error) {
    console.error('Failed to decrement projects count:', error);
  }
}

// *** HELPER-FUNCTION ***

// Get-Authors-By-Id
export async function getAuthorById(creatorId: string) {
  try {
    const response = await databases.getDocument(
      db.usersId,
      cl.creatorId,
      creatorId
    );
    return response;
  } catch (error) {
    console.log(error);
  }
}

// File-Upload
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      bk.creationBucketId,
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
    const fileUrl = storage.getFileView(bk.creationBucketId, fileId);

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
    await storage.deleteFile(bk.creationBucketId, fileId);

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
  }
}
