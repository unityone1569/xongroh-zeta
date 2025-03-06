export enum QUERY_KEYS {
  // AUTH KEYS
  CREATE_USER_ACCOUNT = 'createUserAccount',

  // USER KEYS
  GET_CURRENT_USER = 'getCurrentUser',
  GET_USERS = 'getUsers',
  GET_USER_BY_ID = 'getUserById',
  GET_USER_INFO = 'getUserInfo',
  GET_INFINITE_USERS = 'getInfiniteUsers',
  GET_TOP_CREATORS = 'getTopCreators',

  // CREATION KEYS
  GET_RECENT_CREATIONS = 'getRecentCreations',
  GET_CREATION_BY_ID = 'getCreationById',
  GET_USER_CREATIONS = 'getUserCreations',
  GET_SAVED_CREATIONS = 'getSavedCreations',
  GET_INFINITE_CREATIONS = 'getInfiniteCreations',
  GET_SEARCH_CREATIONS = 'getSearchCreations',
  GET_SUPPORTING_CREATIONS = 'getSupportingCreations',

  GET_POSTS = 'getPosts',

  GET_FILE_PREVIEW = 'getFilePreview',
  GET_SAVED_POST_DETAILS = 'getPostsByIds',

  GET_PROJECT_BY_ID = 'getProjectById',
  GET_USER_PROJECTS = 'getUserProjects',

  GET_ITEMS_LIKE_COUNT = 'getItemsLikeCount',
  GET_POST_LIKES_COUNT = 'getPostLikesCount',
  GET_POST_SAVES_COUNT = 'getPostSavesCount',
  CHECK_POST_LIKE = 'checkPostLike',
  CHECK_ITEM_LIKE = 'checkItemLike',
  CHECK_POST_SAVE = 'checkPostSave',
  CHECK_SUPPORTING_USER = 'checkSupportingUser',

  GET_POST_COMMENTS_COUNT = 'getPostCommentsCount',
  GET_POST_COMMENTS = 'getComments',
  GET_POST_FEEDBACKS_COUNT = 'getPostFeedbacksCount',
  GET_POST_FEEDBACKS = 'getFeedbacks',
  GET_COMMENT_REPLIES_COUNT = 'getCommentRepliesCount',
  GET_FEEDBACK_REPLIES_COUNT = 'getFeedbackRepliesCount',
  GET_COMMENT_REPLIES = 'getCommentReplies',
  GET_FEEDBACK_REPLIES = 'getFeedbackReplies',

  SEARCH_USERS = 'searchUsers',

  // NOTIFICATION KEYS
  GET_USER_NOTIFICATIONS = 'getUserNotifications',
  GET_COMMUNITY_NOTIFICATIONS = 'getCommunityNotifications',

  // COMMUNITY KEYS
  GET_COMMUNITIES = 'getCommunities',
  GET_COMMUNITY_BY_ID = 'getCommunityById',
  GET_USER_COMMUNITIES = 'getUserCommunities',
  GET_COMMUNITY_MEMBERS = 'getCommunityMembers',
  GET_COMMUNITY_TOPICS = 'getCommunityTopics',
  GET_SEARCH_COMMUNITIES = 'getSearchCommunities',
  CHECK_MEMBERSHIP_STATUS = 'checkMembershipStatus',
  GET_TOPIC_BY_ID = 'getTopicById',
  GET_DISCUSSIONS = 'getDiscussions',
  GET_DISCUSSION_BY_ID = 'getDiscussionById',
  GET_USER_DISCUSSIONS = 'getUserDiscussions',
  GET_USER_SAVED_DISCUSSIONS = 'getUserSavedDiscussions',
  GET_SEARCH_DISCUSSIONS = 'getSearchDiscussions',
  GET_TOPIC_PINGS = 'getTopicPings',
  GET_COMMUNITY_PINGS = 'getCommunityPings',
  GET_USER_PINGS = 'getUserPings',

  // MESSAGE KEYS
  GET_MESSAGE = 'getMessage',
  GET_MESSAGES = 'getMessages',
  GET_CONVERSATION = 'getConversationById',
  GET_CONVERSATIONS = 'getConversations',
  SEARCH_MESSAGES = 'searchMessages',
  GET_SENDER_INFO = 'getSenderInfo',

  // EVENTS KEYS
  GET_EVENTS = 'getEvents',
  GET_EVENT_BY_ID = 'getEventById',
  GET_USER_INTERESTED_EVENTS = 'getUserInterestedEvents',
  GET_INTERESTED_EVENTS_USERS = 'getInterestedEventsUsers',
  CHECK_USER_INTERESTED_EVENT = 'checkUserInterestedEvent',
  GET_USER_EVENTS = 'getEvents',
}
