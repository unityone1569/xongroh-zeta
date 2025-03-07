import { INewEvent, IUpdateEvent } from '@/types';

import { appwriteConfig, databases, storage } from './config';
import { ID, Query } from 'appwrite';

// *** APPWRITE ***

// Database
const db = {
  eventsId: appwriteConfig.databases.events.databaseId,
  usersId: appwriteConfig.databases.users.databaseId,
};

// Collections
const cl = {
  eventId: appwriteConfig.databases.events.collections.event,
  interestedEventsId:
    appwriteConfig.databases.events.collections.interestedEvents,
  creatorId: appwriteConfig.databases.users.collections.creator,
};

// Buckets
const bk = {
  eventBucketId: appwriteConfig.storage.eventBucket,
};

// *** EVENTS ***

// Create Event
export async function createEvent(event: INewEvent) {
  try {
    let imageUrl = null;
    let imageId = '';

    if (event.imageFile) {
      const uploadedFile = await uploadFile(event.imageFile);
      if (!uploadedFile) throw Error;

      imageUrl = String(getFilePreview(uploadedFile.$id));
      imageId = uploadedFile.$id;

      if (!imageUrl) {
        await deleteFile(imageId);
        throw Error;
      }
    }

    const newEvent = await databases.createDocument(
      db.eventsId,
      cl.eventId,
      ID.unique(),
      {
        title: event.title,
        description: event.description,
        organiser: event.organiser,
        venue: event.venue,
        dateTime: event.dateTime,
        type: event.type || 'other',
        imageUrl,
        imageId,
        bookingLink: event.bookingLink || null,
        creatorId: event.creatorId,
      }
    );

    return newEvent;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Get Events
export async function getEvents(params: {
  filter?: string;
  userId?: string;
  pageParam?: any;
}) {
  try {
    const now = new Date().toISOString();
    let queries = [Query.orderAsc('dateTime')];
    const filter = params.filter || 'live';

    switch (filter) {
      case 'archived':
        queries.push(Query.lessThan('dateTime', now));
        break;
      case 'live':
        queries.push(Query.equal('dateTime', now));
        break;
      case 'upcoming':
        queries.push(Query.greaterThan('dateTime', now));
        break;
      case 'my-events':
        if (!params.userId)
          throw Error('userId is required for my-events filter');
        queries.push(Query.equal('creatorId', params.userId));
        break;
    }

    // Fetch events
    const { documents: events } = await databases.listDocuments(
      db.eventsId,
      cl.eventId,
      queries
    );

    if (!events || events.length === 0) {
      return { documents: [] };
    }

    // Fetch creator details in parallel
    const creatorFetchPromises = events.map((event) =>
      databases.getDocument(db.usersId, cl.creatorId, event.creatorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    const creators = await Promise.all(creatorFetchPromises);

    // Merge event data with creator details
    const eventsWithCreators = events.map((event, index) => ({
      ...event,
      creator: {
        name: creators[index]?.name || '',
        dpUrl: creators[index]?.dpUrl || null,
        verifiedUser: creators[index]?.verifiedUser || false,
      },
    }));

    return { documents: eventsWithCreators };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { documents: [] };
  }
}

// Get Event by ID
export async function getEventById(eventId: string) {
  try {
    const event = await databases.getDocument(db.eventsId, cl.eventId, eventId);
    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

// Update Event
export async function updateEvent(event: IUpdateEvent) {
  try {
    let imageMedia = {
      imageUrl: event.imageUrl || null,
      imageId: event.imageId || '',
    };

    if (event.imageFile) {
      const uploadedFile = await uploadFile(event.imageFile);
      if (!uploadedFile) throw Error;

      const fileUrl = getFilePreview(uploadedFile.$id);
      if (!fileUrl) {
        await deleteFile(uploadedFile.$id);
        throw Error;
      }

      imageMedia = {
        imageUrl: fileUrl ? new URL(fileUrl) : null,
        imageId: uploadedFile.$id,
      };
    }

    const updatedEvent = await databases.updateDocument(
      db.eventsId,
      cl.eventId,
      event.eventId,
      {
        title: event.title,
        description: event.description,
        venue: event.venue,
        dateTime: event.dateTime,
        type: event.type,
        imageUrl: imageMedia.imageUrl,
        imageId: imageMedia.imageId,
        bookingLink: event.bookingLink,
      }
    );

    if (event.imageFile && event.imageId) {
      await deleteFile(event.imageId);
    }

    return updatedEvent;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}

// Delete Event
export async function deleteEvent(eventId: string, imageId?: string) {
  try {
    if (imageId) {
      await deleteFile(imageId);
    }

    await databases.deleteDocument(db.eventsId, cl.eventId, eventId);

    return { status: 'ok' };
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

// Add Interested Event
export async function addInterestedEvent(eventId: string, userId: string) {
  try {
    // First check if the user is already interested in this event
    const existingInterest = await databases.listDocuments(
      db.eventsId,
      cl.interestedEventsId,
      [
        Query.equal('eventId', eventId),
        Query.equal('userId', userId),
        Query.limit(1),
      ]
    );

    // If already interested, return the existing interest
    if (existingInterest.documents.length > 0) {
      return existingInterest.documents[0];
    }

    // If not interested, create new interest
    const interestedEvent = await databases.createDocument(
      db.eventsId,
      cl.interestedEventsId,
      ID.unique(),
      {
        eventId,
        userId,
      }
    );

    return interestedEvent;
  } catch (error) {
    console.error('Error adding interested event:', error);
    throw error;
  }
}

// Delete Interested Event
export async function deleteInterestedEvent(interestedEventId: string) {
  try {
    await databases.deleteDocument(
      db.eventsId,
      cl.interestedEventsId,
      interestedEventId
    );

    return { status: 'ok' };
  } catch (error) {
    console.error('Error deleting interested event:', error);
    throw error;
  }
}

// Get User's Interested Events
export async function getUserInterestedEvents(
  userId: string,
  pageParam?: string | null
) {
  try {
    let queries = [Query.equal('userId', userId), Query.limit(10)];

    if (pageParam) {
      queries.push(Query.cursorAfter(pageParam));
    }

    const interestedEvents = await databases.listDocuments(
      db.eventsId,
      cl.interestedEventsId,
      queries
    );

    if (!interestedEvents.documents.length) {
      return {
        documents: [],
        lastId: null,
        hasMore: false,
      };
    }

    // Get event IDs
    const eventIds = interestedEvents.documents.map((doc) => doc.eventId);

    // Fetch events in parallel
    const events = await Promise.all(
      eventIds.map((eventId) =>
        databases.getDocument(db.eventsId, cl.eventId, eventId)
      )
    );

    // Fetch creator details in parallel for each event
    const creatorFetchPromises = events.map((event) =>
      databases.getDocument(db.usersId, cl.creatorId, event.creatorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    const creators = await Promise.all(creatorFetchPromises);

    // Merge event data with creator details
    const eventsWithCreators = events.map((event, index) => ({
      ...event,
      creator: {
        name: creators[index]?.name || '',
        dpUrl: creators[index]?.dpUrl || null,
        verifiedUser: creators[index]?.verifiedUser || false,
      },
    }));

    const lastId =
      interestedEvents.documents[interestedEvents.documents.length - 1].$id;

    return {
      documents: eventsWithCreators,
      lastId,
      hasMore: interestedEvents.documents.length === 10,
    };
  } catch (error) {
    console.error('Error fetching user interested events:', error);
    return {
      documents: [],
      lastId: null,
      hasMore: false,
    };
  }
}

// Get Interested Events Users by Event ID
export async function getInterestedEventsUsersById(eventId: string) {
  try {
    // First get total count
    const totalUsers = await databases.listDocuments(
      db.eventsId,
      cl.interestedEventsId,
      [Query.equal('eventId', eventId)]
    );

    // Then get first 5 users with details
    const interestedUsers = await databases.listDocuments(
      db.eventsId,
      cl.interestedEventsId,
      [Query.equal('eventId', eventId), Query.limit(5)]
    );

    if (!interestedUsers.documents.length) {
      return {
        documents: [],
        totalCount: 0,
      };
    }

    // Get user IDs for first 5
    const userIds = interestedUsers.documents.map((doc) => doc.userId);

    // Fetch user details in parallel
    const users = await Promise.all(
      userIds.map((userId) =>
        databases.getDocument(db.usersId, cl.creatorId, userId, [
          Query.select(['name', 'dpUrl', 'verifiedUser']),
        ])
      )
    );

    return {
      documents: users,
      totalCount: totalUsers.total,
    };
  } catch (error) {
    console.error('Error fetching interested users:', error);
    return {
      documents: [],
      totalCount: 0,
    };
  }
}

// Check User Interested Event
export async function checkUserInterestedEvent(
  eventId: string,
  userId: string
) {
  try {
    const response = await databases.listDocuments(
      db.eventsId,
      cl.interestedEventsId,
      [
        Query.equal('eventId', eventId),
        Query.equal('userId', userId),
        Query.limit(1),
      ]
    );

    if (!response.documents.length) {
      return { interested: false, interestedEventId: null };
    }

    return {
      interested: true,
      interestedEventId: response.documents[0].$id,
    };
  } catch (error) {
    console.error('Error checking user interest:', error);
    return { interested: false, interestedEventId: null };
  }
}

// Get User Events
export async function getUserEvents(userId: string, pageParam?: string | null) {
  try {
    let queries = [
      Query.equal('creatorId', userId),
      Query.orderAsc('dateTime'),
      Query.limit(10),
    ];

    if (pageParam) {
      queries.push(Query.cursorAfter(pageParam));
    }

    // Fetch events
    const events = await databases.listDocuments(
      db.eventsId,
      cl.eventId,
      queries
    );

    if (!events.documents.length) {
      return {
        documents: [],
        lastId: null,
        hasMore: false,
      };
    }

    // Fetch creator details in parallel
    const creatorFetchPromises = events.documents.map((event) =>
      databases.getDocument(db.usersId, cl.creatorId, event.creatorId, [
        Query.select(['name', 'dpUrl', 'verifiedUser']),
      ])
    );

    const creators = await Promise.all(creatorFetchPromises);

    // Merge event data with creator details
    const eventsWithCreators = events.documents.map((event, index) => ({
      ...event,
      creator: {
        name: creators[index]?.name || '',
        dpUrl: creators[index]?.dpUrl || null,
        verifiedUser: creators[index]?.verifiedUser || false,
      },
    }));

    const lastId = events.documents[events.documents.length - 1].$id;

    return {
      documents: eventsWithCreators,
      lastId,
      hasMore: events.documents.length === 10,
    };
  } catch (error) {
    console.error('Error fetching user events:', error);
    return {
      documents: [],
      lastId: null,
      hasMore: false,
    };
  }
}

// *** HELPER-FUNCTION ***

// File-Upload
export async function uploadFile(file: File) {
  try {
    const uploadedFile = await storage.createFile(
      bk.eventBucketId,
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
    const fileUrl = storage.getFileView(bk.eventBucketId, fileId);

    if (!fileUrl) throw Error;

    // console.log(fileUrl);

    return fileUrl.toString();
  } catch (error) {
    console.log(error);
  }
}

// Delete-File
export async function deleteFile(fileId: string) {
  try {
    await storage.deleteFile(bk.eventBucketId, fileId);

    return { status: 'ok' };
  } catch (error) {
    console.log(error);
  }
}
