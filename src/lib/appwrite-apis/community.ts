import { ID, Query } from 'appwrite';
import { appwriteConfig, databases, functions, storage } from './config';
import { INewDiscussion, IUpdateDiscussion } from '@/types';
import { deleteAllCommentsForPost } from './comments';
import {
  deleteAllPostLikes,
  deleteAllPostSaves,
  getPostLikeCount,
} from './interactions';

// Database
const db = {
  communitiesId: appwriteConfig.databases.communities.databaseId,
  usersId: appwriteConfig.databases.users.databaseId,
  interactionId: appwriteConfig.databases.interactions.databaseId,
};

// Collections
const cl = {
  discussionId: appwriteConfig.databases.communities.collections.discussion,
  memberId: appwriteConfig.databases.communities.collections.member,
  communityId: appwriteConfig.databases.communities.collections.community,
  topicId: appwriteConfig.databases.communities.collections.topic,
  creatorId: appwriteConfig.databases.users.collections.creator,
  saveId: appwriteConfig.databases.interactions.collections.save,
  pingId: appwriteConfig.databases.communities.collections.ping,
};

// Functions
const fn = {
  communityDiscussionPermissionId:
    appwriteConfig.functions.communityDiscussionPermission,
};

// Buckets
const bk = {
  communityBucketId: appwriteConfig.storage.communityBucket,
  discussionBucketId: appwriteConfig.storage.discussionBucket,
};

// *** COMMUNITIES ***

// Get-Communities
export async function getCommunities({
  pageParam,
}: {
  pageParam: number | null;
}) {
  const queries: any[] = [
    Query.orderDesc('$createdAt'),
    Query.limit(10),
    Query.select(['$id', 'name', 'about', 'imageUrl']),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: communities } = await databases.listDocuments(
      db.communitiesId,
      cl.communityId,
      queries
    );

    if (!communities || communities.length === 0) {
      return { documents: [] };
    }

    // Fetch member counts for each community
    const enrichedCommunities = await Promise.all(
      communities.map(async (community) => {
        const members = await databases.listDocuments(
          db.communitiesId,
          cl.memberId,
          [Query.equal('communityId', community.$id)]
        );

        return {
          ...community,
          membersCount: members.total,
        };
      })
    );

    return { documents: enrichedCommunities };
  } catch (error) {
    console.error('Error fetching communities:', error);
    return { documents: [] };
  }
}

// Get-Community-By-Id
export async function getCommunityById(communityId: string) {
  const queries: any[] = [
    Query.select(['$id', 'name', 'about', 'imageUrl', 'rules']),
  ];

  try {
    const community = await databases.getDocument(
      db.communitiesId,
      cl.communityId,
      communityId,
      queries
    );

    return community;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
}

// get-user-Communities
export async function getUserCommunities({
  pageParam,
  userId,
}: {
  pageParam: string | null;
  userId: string;
}) {
  try {
    // Step 1: Get memberships with pagination
    const membershipQueries = [
      Query.equal('creatorId', userId),
      Query.orderDesc('$createdAt'),
      Query.limit(10),
    ];

    if (pageParam) {
      membershipQueries.push(Query.cursorAfter(pageParam));
    }

    const memberships = await databases.listDocuments(
      db.communitiesId,
      cl.memberId,
      membershipQueries
    );

    if (!memberships.documents.length) {
      return { documents: [], memberships: [] };
    }

    // Step 2: Get unique community IDs maintaining order
    const communityIds = memberships.documents.map((m) => m.communityId);

    // Step 3: Fetch communities and member counts in parallel
    const [communities, membersCounts] = await Promise.all([
      databases.listDocuments(db.communitiesId, cl.communityId, [
        Query.equal('$id', communityIds),
        Query.select(['$id', 'name', 'about', 'imageUrl']),
      ]),
      Promise.all(
        communityIds.map((id) =>
          databases.listDocuments(db.communitiesId, cl.memberId, [
            Query.equal('communityId', id),
          ])
        )
      ),
    ]);

    // Step 4: Create a map for quick community lookup
    const communityMap = new Map(
      communities.documents.map((community) => [community.$id, community])
    );

    // Step 5: Map communities in membership order with member counts
    const enrichedCommunities = communityIds
      .map((id, index) => {
        const community = communityMap.get(id);
        if (!community) return null;

        return {
          ...community,
          membersCount: membersCounts[index].total,
        };
      })
      .filter(Boolean);

    return {
      documents: enrichedCommunities,
      memberships: memberships.documents,
    };
  } catch (error) {
    console.error('Error fetching user communities:', error);
    return { documents: [], memberships: [] };
  }
}

// Get-Community-Topics
export async function getCommunityTopics({
  communityId,
  pageParam,
}: {
  communityId: string;
  pageParam: number | null;
}) {
  const queries: any[] = [
    Query.equal('communityId', communityId),
    Query.orderAsc('$createdAt'),
    Query.limit(10),
    Query.select(['$id', 'topicName']),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: topics } = await databases.listDocuments(
      db.communitiesId,
      cl.topicId,
      queries
    );

    return { documents: topics };
  } catch (error) {
    console.error('Error fetching topics:', error);
    return { documents: [] };
  }
}

// Get-Community-Members
export async function getCommunityMembers({
  communityId,
  pageParam,
}: {
  communityId: string;
  pageParam: number | null;
}) {
  const queries: any[] = [
    Query.equal('communityId', communityId),
    Query.orderDesc('$createdAt'),
    Query.limit(10),
    Query.select(['$id', 'creatorId', 'role']),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: members } = await databases.listDocuments(
      db.communitiesId,
      cl.memberId,
      queries
    );

    if (!members || members.length === 0) {
      return { documents: [] };
    }

    // Create user fetch promises
    const userFetchPromises = members.map((member) =>
      databases.getDocument(db.usersId, cl.creatorId, member.creatorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    // Fetch all users in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine members with user details
    const membersWithUserDetails = members.map((member, index) => ({
      ...member,
      user: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
    }));

    return { documents: membersWithUserDetails };
  } catch (error) {
    console.error('Error fetching members:', error);
    return { documents: [] };
  }
}

// Get-Search-Communities
export async function getSearchCommunities(searchTerm: string) {
  try {
    const { documents: communities } = await databases.listDocuments(
      db.communitiesId,
      cl.communityId,
      [
        Query.search('name', searchTerm),
        Query.select(['$id', 'name', 'about', 'imageUrl']),
      ]
    );

    if (!communities || communities.length === 0) {
      return { documents: [] };
    }

    // Fetch member counts for each community
    const enrichedCommunities = await Promise.all(
      communities.map(async (community) => {
        const members = await databases.listDocuments(
          db.communitiesId,
          cl.memberId,
          [Query.equal('communityId', community.$id)]
        );

        return {
          ...community,
          membersCount: members.total,
        };
      })
    );

    return { documents: enrichedCommunities };
  } catch (error) {
    console.error('Error searching communities:', error);
    return { documents: [] };
  }
}

// Join-Community
export async function joinCommunity(userId: string, communityId: string) {
  try {
    // Check if already a member
    const existingMembership = await databases.listDocuments(
      db.communitiesId,
      cl.memberId,
      [
        Query.equal('creatorId', userId),
        Query.equal('communityId', communityId),
      ]
    );

    if (existingMembership.documents.length > 0) {
      throw new Error('Already a member');
    }

    // Create new membership
    const newMember = await databases.createDocument(
      db.communitiesId,
      cl.memberId,
      ID.unique(),
      {
        creatorId: userId,
        communityId: communityId,
        role: 'Member', // Default role
      }
    );

    return newMember;
  } catch (error) {
    console.error('Error joining community:', error);
    return null;
  }
}

// Leave-Community
export async function leaveCommunity(userId: string, communityId: string) {
  try {
    // Find membership document
    const membership = await databases.listDocuments(
      db.communitiesId,
      cl.memberId,
      [
        Query.equal('creatorId', userId),
        Query.equal('communityId', communityId),
      ]
    );

    if (!membership.documents.length) {
      throw new Error('Not a member');
    }

    // Delete membership
    await databases.deleteDocument(
      db.communitiesId,
      cl.memberId,
      membership.documents[0].$id
    );

    return { status: 'ok' };
  } catch (error) {
    console.error('Error leaving community:', error);
    return null;
  }
}

// Check-Membership-Status
export async function checkMembershipStatus(
  userId: string,
  communityId: string
) {
  try {
    const membership = await databases.listDocuments(
      db.communitiesId,
      cl.memberId,
      [
        Query.equal('creatorId', userId),
        Query.equal('communityId', communityId),
      ]
    );

    return membership.documents.length > 0;
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
}

// TODO: Add api-functions for communities - add, delete, update, etc.

// *** TOPICS ***

// get-topic-by-id
export async function getTopicById(topicId: string) {
  const queries: any[] = [Query.select(['$id', 'topicName'])];

  try {
    const topic = await databases.getDocument(
      db.communitiesId,
      cl.topicId,
      topicId,
      queries
    );

    return topic;
  } catch (error) {
    console.error('Error fetching topic:', error);
    return null;
  }
}

// TODO: Add api-functions for topics - add, delete, update, etc.

// *** DISCUSSIONS ***

// Get-Discussions
export async function getDiscussions({
  topicId,
  pageParam,
}: {
  topicId: string;
  pageParam: number | null;
}) {
  const queries: any[] = [
    Query.equal('topicId', topicId),
    Query.orderDesc('$createdAt'),
    Query.limit(10),
    Query.select([
      '$id',
      'authorId',
      'topicId',
      'content',
      'mediaUrl',
      'tags',
      'type',
      '$createdAt',
    ]),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: discussions } = await databases.listDocuments(
      db.communitiesId,
      cl.discussionId,
      queries
    );

    if (!discussions || discussions.length === 0) {
      return { documents: [] };
    }

    // Create user fetch promises and like count promises in parallel
    const [users, likeCounts] = await Promise.all([
      Promise.all(
        discussions.map((discussion) =>
          databases.getDocument(db.usersId, cl.creatorId, discussion.authorId, [
            Query.select(['name', 'dpUrl', 'verifiedUser']),
          ])
        )
      ),
      Promise.all(
        discussions.map((discussion) => getPostLikeCount(discussion.$id))
      ),
    ]);

    // Combine discussions with user details and like counts
    const discussionsWithDetails = discussions.map((discussion, index) => ({
      ...discussion,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
      likesCount: likeCounts[index],
    }));

    return { documents: discussionsWithDetails };
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return { documents: [] };
  }
}

// Get-Discussion-By-Id
export async function getDiscussionById(discussionId: string) {
  const queries: any[] = [
    Query.select([
      '$id',
      'authorId',
      'topicId',
      'content',
      'mediaUrl',
      'tags',
      'type',
      '$createdAt',
    ]),
  ];

  try {
    const discussion = await databases.getDocument(
      db.communitiesId,
      cl.discussionId,
      discussionId,
      queries
    );

    return discussion;
  } catch (error) {
    console.error('Error fetching discussion:', error);
    return null;
  }
}

// get-User-Discussions
export async function getUserDiscussions({
  userId,
  pageParam,
}: {
  userId: string;
  pageParam: number | null;
}) {
  const queries: any[] = [
    Query.equal('authorId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(10),
    Query.select([
      '$id',
      'authorId',
      'topicId',
      'content',
      'mediaUrl',
      'tags',
      'type',
      '$createdAt',
    ]),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam.toString()));
  }

  try {
    const { documents: discussions } = await databases.listDocuments(
      db.communitiesId,
      cl.discussionId,
      queries
    );

    if (!discussions || discussions.length === 0) {
      return { documents: [] };
    }

    // Create user fetch promises
    const userFetchPromises = discussions.map((discussion) =>
      databases.getDocument(db.usersId, cl.creatorId, discussion.authorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    // Fetch all users in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine discussions with user details
    const discussionsWithUserDetails = discussions.map((discussion, index) => ({
      ...discussion,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
        verifiedUser: users[index]?.verifiedUser || false,
      },
    }));

    return { documents: discussionsWithUserDetails };
  } catch (error) {
    console.error('Error fetching user discussions:', error);
    return { documents: [] };
  }
}

// Get-User-Saved-Discussions
export async function getUserSavedDiscussions({
  userId,
  pageParam,
}: {
  userId: string;
  pageParam: string | null; // Changed from number to string | null
}) {
  const queries: any[] = [
    Query.equal('userId', userId),
    Query.orderDesc('$createdAt'),
    Query.limit(10),
  ];

  if (pageParam) {
    queries.push(Query.cursorAfter(pageParam));
  }

  try {
    // First get saved posts
    const { documents: savedPosts } = await databases.listDocuments(
      db.interactionId,
      cl.saveId,
      queries
    );

    if (!savedPosts || savedPosts.length === 0) {
      return { documents: [], savedPosts: [] };
    }

    const discussionIds = savedPosts.map((post) => post.postId);

    const { documents: discussions } = await databases.listDocuments(
      db.communitiesId,
      cl.discussionId,
      [
        Query.equal('$id', discussionIds),
        Query.select([
          '$id',
          'authorId',
          'topicId',
          'content',
          'mediaUrl',
          'tags',
          'type',
          '$createdAt',
        ]),
      ]
    );

    if (!discussions || discussions.length === 0) {
      return { documents: [], savedPosts: [] };
    }

    const userFetchPromises = discussions.map((discussion) =>
      databases.getDocument(db.usersId, cl.creatorId, discussion.authorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    const users = await Promise.all(userFetchPromises);

    const discussionsWithDetails = discussions.map((discussion, index) => {
      const save = savedPosts.find((s) => s.postId === discussion.$id);
      return {
        ...discussion,
        author: {
          name: users[index]?.name || '',
          dpUrl: users[index]?.dpUrl || null,
          verifiedUser: users[index]?.verifiedUser || false,
        },
        saveId: save?.$id,
      };
    });

    // Return both discussions and savedPosts for proper pagination
    return {
      documents: discussionsWithDetails,
      savedPosts: savedPosts,
    };
  } catch (error) {
    console.error('Error fetching saved discussions:', error);
    return { documents: [], savedPosts: [] };
  }
}

// Create-Discussion
export async function createDiscussion(
  discussion: INewDiscussion,
  communityId: string
) {
  try {
    let fileUrl: string = '';
    let uploadedFileId = '';

    if (discussion.file && discussion.file.length > 0) {
      const uploadedFile = await uploadFile(discussion.file[0]);
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
    const tags = discussion.tags?.replace(/ /g, '').split(',') || [];

    const newDiscussion = await databases.createDocument(
      db.communitiesId,
      cl.discussionId,
      ID.unique(),
      {
        topicId: discussion.topicId,
        content: discussion.content,
        mediaUrl: fileUrl ? [fileUrl] : [],
        mediaId: uploadedFileId ? [uploadedFileId] : [],
        authorId: discussion.authorId,
        tags: tags,
        type: discussion.type,
      }
    );

    // *# Note: We store AccountIds as adminIds in the community document directly. No need to convert it to accountId.
    const adminId = await getAdminAccountId(communityId);

    // Create pings after successful discussion creation
    if (newDiscussion) {
      await createPing({
        communityId: communityId,
        topicId: discussion.topicId,
        authorId: discussion.authorId,
      });

      // TODO: update fn to add all adminIds permissions to the discussion

      // *# Note: This is a temporary solution to add only the first adminId
      const payload = JSON.stringify({
        discussionId: newDiscussion.$id,
        adminId: adminId,
      });

      await functions.createExecution(
        fn.communityDiscussionPermissionId,
        payload,
        true
      );
    }

    return newDiscussion;
  } catch (error) {
    console.error('Error creating discussion:', error);
    return null;
  }
}

// Update-Discussion
export async function updateDiscussion(discussion: IUpdateDiscussion) {
  const hasFileToUpdate = discussion.file.length > 0;

  try {
    let media = {
      mediaUrl: Array.isArray(discussion.mediaUrl)
        ? discussion.mediaUrl
        : [discussion.mediaUrl],
      mediaId: Array.isArray(discussion.mediaId)
        ? discussion.mediaId
        : [discussion.mediaId],
    };

    if (hasFileToUpdate) {
      // Upload new file to appwrite storage
      const uploadedFile = await uploadFile(discussion.file[0]);
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
    const tags = Array.isArray(discussion.tags)
      ? discussion.tags
      : discussion.tags?.replace(/ /g, '').split(',') || [];

    const updatedDiscussion = await databases.updateDocument(
      db.communitiesId,
      cl.discussionId,
      discussion.discussionId,
      {
        content: discussion.content,
        mediaUrl: media.mediaUrl,
        mediaId: media.mediaId,
        tags: tags,
      }
    );

    return updatedDiscussion;
  } catch (error) {
    console.error('Error updating discussion:', error);
    return null;
  }
}

// Delete-Discussion
export async function deleteDiscussion(
  discussionId: string,
  mediaId: string,
  authorId: string
) {
  if (!discussionId || !authorId) return;

  try {
    const statusCode = await databases.deleteDocument(
      db.communitiesId,
      cl.discussionId,
      discussionId
    );

    if (!statusCode) throw Error;

    await deleteFile(mediaId);

    await deleteAllCommentsForPost(discussionId);

    await deleteAllPostLikes(discussionId);

    await deleteAllPostSaves(discussionId);

    return { status: 'ok' };
  } catch (error) {
    console.error('Error deleting discussion:', error);
    return null;
  }
}

// Get-Search-Discussions
export async function getSearchDiscussions(searchTerm: string) {
  try {
    const { documents: discussions } = await databases.listDocuments(
      db.communitiesId,
      cl.discussionId,
      [Query.search('content', searchTerm)]
    );

    if (!discussions || discussions.length === 0) {
      // No posts found, return an empty response
      return { documents: [] };
    }

    // Create user fetch promises
    const userFetchPromises = discussions.map((discussion) =>
      databases.getDocument(db.usersId, cl.creatorId, discussion.authorId, [
        Query.select(['name', 'dpUrl']),
      ])
    );

    // Fetch all users in parallel
    const users = await Promise.all(userFetchPromises);

    // Combine discussions with user details
    const discussionsWithUserDetails = discussions.map((discussion, index) => ({
      ...discussion,
      author: {
        name: users[index]?.name || '',
        dpUrl: users[index]?.dpUrl || null,
      },
    }));

    return { documents: discussionsWithUserDetails };
  } catch (error) {
    console.error('Error fetching discussions:', error);
    throw error;
  }
}

// *** PINGS ***

const BATCH_SIZE = 100;

// create-Ping
export async function createPing({
  communityId,
  topicId,
  authorId,
}: {
  communityId: string;
  topicId: string;
  authorId: string;
}) {
  try {
    // Get total member count
    const { total } = await databases.listDocuments(
      db.communitiesId,
      cl.memberId,
      [Query.equal('communityId', communityId)]
    );

    // Process members in batches
    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
      const { documents: members } = await databases.listDocuments(
        db.communitiesId,
        cl.memberId,
        [
          Query.equal('communityId', communityId),
          Query.limit(BATCH_SIZE),
          Query.offset(offset),
        ]
      );

      // Filter out author
      const eligibleMembers = members.filter(
        (member) => member.creatorId !== authorId
      );

      // Process each member
      const pingPromises = eligibleMembers.map(async (member) => {
        // Check for existing ping
        const { documents: existingPings } = await databases.listDocuments(
          db.communitiesId,
          cl.pingId,
          [
            Query.equal('communityId', communityId),
            Query.equal('topicId', topicId),
            Query.equal('userId', member.creatorId),
          ]
        );

        if (existingPings.length > 0) {
          // Update existing ping
          const currentPing = existingPings[0];
          return databases.updateDocument(
            db.communitiesId,
            cl.pingId,
            currentPing.$id,
            {
              pingCount: (currentPing.pingCount || 0) + 1,
            }
          );
        } else {
          // Create new ping
          return databases.createDocument(
            db.communitiesId,
            cl.pingId,
            ID.unique(),
            {
              communityId,
              topicId,
              userId: member.creatorId,
              pingCount: 1,
            }
          );
        }
      });

      await Promise.all(pingPromises);
    }

    return { status: 'ok' };
  } catch (error) {
    console.error('Error creating pings:', error);
    return null;
  }
}

// mark-as-read-Ping
export async function markAsReadPing({
  userId,
  communityId,
  topicId,
}: {
  userId: string;
  communityId: string;
  topicId: string;
}) {
  try {
    // Find existing ping
    const { documents: existingPings } = await databases.listDocuments(
      db.communitiesId,
      cl.pingId,
      [
        Query.equal('communityId', communityId),
        Query.equal('topicId', topicId),
        Query.equal('userId', userId),
      ]
    );

    if (existingPings.length > 0) {
      const currentPing = existingPings[0];
      const newCount = (currentPing.pingCount || 1) - 1;

      if (newCount <= 0) {
        // Delete ping if count reaches 0
        await databases.deleteDocument(
          db.communitiesId,
          cl.pingId,
          currentPing.$id
        );
      } else {
        // Update ping count
        await databases.updateDocument(
          db.communitiesId,
          cl.pingId,
          currentPing.$id,
          {
            pingCount: newCount,
          }
        );
      }
      return { status: 'ok' };
    }
    return null;
  } catch (error) {
    console.error('Error reading ping:', error);
    return null;
  }
}

// get-Topic-Pings
export async function getTopicPings({
  topicId,
  userId,
}: {
  topicId: string;
  userId: string;
}) {
  try {
    const { documents } = await databases.listDocuments(
      db.communitiesId,
      cl.pingId,
      [Query.equal('topicId', topicId), Query.equal('userId', userId)]
    );

    if (!documents.length) return 0;

    // Sum up all pingCounts
    const totalPings = documents.reduce(
      (sum, doc) => sum + (doc.pingCount || 0),
      0
    );
    return totalPings;
  } catch (error) {
    console.error('Error getting topic pings:', error);
    return 0;
  }
}

// get-Community-Pings
export async function getCommunityPings({
  communityId,
  userId,
}: {
  communityId: string;
  userId: string;
}) {
  try {
    const { documents } = await databases.listDocuments(
      db.communitiesId,
      cl.pingId,
      [Query.equal('communityId', communityId), Query.equal('userId', userId)]
    );

    if (!documents.length) return 0;

    // Sum up all pingCounts
    const totalPings = documents.reduce(
      (sum, doc) => sum + (doc.pingCount || 0),
      0
    );
    return totalPings;
  } catch (error) {
    console.error('Error getting community pings:', error);
    return 0;
  }
}

// get-User-Pings
export async function getUserPings(userId: string) {
  try {
    const { documents } = await databases.listDocuments(
      db.communitiesId,
      cl.pingId,
      [Query.equal('userId', userId)]
    );

    if (!documents.length) return 0;

    // Sum up all pingCounts across all communities and topics
    const totalPings = documents.reduce(
      (sum, doc) => sum + (doc.pingCount || 0),
      0
    );

    return totalPings;
  } catch (error) {
    console.error('Error getting user pings:', error);
    return 0;
  }
}

// *** HELPER-FUNCTION ***

export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      bk.discussionBucketId,
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
    const fileUrl = storage.getFileView(bk.discussionBucketId, fileId);

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
    await storage.deleteFile(bk.discussionBucketId, fileId);

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
  }
}

// Get-admin-Id
export async function getAdminAccountId(communityId: string) {
  try {
    const community = await databases.getDocument(
      db.communitiesId,
      cl.communityId,
      communityId
    );

    if (!community || !community.admins || !community.admins.length) {
      return null;
    }

    // Todo: Add logic to return all the adminIds
    // Return the first adminId
    return community.admins[0];
  } catch (error) {
    console.error('Error getting adminId:', error);
    return null;
  }
}

// Get-Community-Id-From-Topic-Id
export async function getCommunityIdFromTopicId(topicId: string) {
  try {
    const topic = await databases.getDocument(
      db.communitiesId,
      cl.topicId,
      topicId
    );

    return topic.communityId;
  } catch (error) {
    console.error('Error getting communityId:', error);
    return null;
  }
}
