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
  GET_COMMENT_REPLIES = 'getCommentReplies',
  GET_FEEDBACK_REPLIES = 'getFeedbackReplies',

  SEARCH_USERS = 'searchUsers',

  // NOTIFICATION KEYS
  GET_USER_NOTIFICATIONS = 'getUserNotifications',
  

  // MESSAGE KEYS
  GET_MESSAGE = 'getMessage',
  GET_MESSAGES = 'getMessages',
  GET_CONVERSATION = 'getConversationById',
  GET_CONVERSATIONS = 'getConversations',
  SEARCH_MESSAGES = 'searchMessages',
  GET_SENDER_INFO = 'getSenderInfo',
}
