export enum QUERY_KEYS {
  // AUTH KEYS
  CREATE_USER_ACCOUNT = 'createUserAccount',

  // USER KEYS
  GET_CURRENT_USER = 'getCurrentUser',
  GET_USERS = 'getUsers',
  GET_USER_BY_ID = 'getUserById',
  GET_USER_INFO = 'getUserInfo',
  GET_INFINITE_USERS = 'getInfiniteUsers',

  // POST KEYS
  GET_POSTS = 'getPosts',
  GET_INFINITE_POSTS = 'getInfinitePosts',
  GET_RECENT_POSTS = 'getRecentPosts',
  GET_POST_BY_ID = 'getPostById',
  GET_USER_POSTS = 'getUserPosts',
  GET_FILE_PREVIEW = 'getFilePreview',

  GET_PROJECT_BY_ID = 'getProjectById',
  GET_USER_PROJECTS = 'getUserProjects',

  CHECK_POST_LIKE = 'checkPostLike',
  CHECK_ITEM_LIKE = 'checkItemLike',
  CHECK_POST_SAVE = 'checkPostSave',
  CHECK_SUPPORTING_USER = 'checkSupportingUser',

  GET_POST_COMMENTS = 'getComments',
  GET_POST_FEEDBACKS = 'getFeedbacks',
  GET_COMMENT_REPLIES = 'getCommentReplies',
  GET_FEEDBACK_REPLIES = 'getFeedbackReplies',

  //  SEARCH KEYS
  SEARCH_POSTS = 'getSearchPosts',
  SEARCH_USERS = 'searchUsers',
}
