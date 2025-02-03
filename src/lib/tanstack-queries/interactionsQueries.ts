import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from './queryKeys';
import {
  checkItemLike,
  checkPostLike,
  checkPostSave,
  getItemLikesCount,
  getPostLikeCount,
  getPostSaveCount,
  likeItem,
  likePost,
  savePost,
  unlikeItem,
  unlikePost,
  unsavePost,
  discussionLike,
  discussionItemLike,
  discussionSave,
} from '../appwrite-apis/interactions';

// *** POST-LIKE-QUERIES ***

// Use-Get-Post-Likes-Count
export const useGetPostLikesCount = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_LIKES_COUNT, postId],
    queryFn: () => getPostLikeCount(postId),
    enabled: Boolean(postId),
  });
};

// Use-Check-Post-Like
export const useCheckPostLike = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_LIKE, postId, userId],
    queryFn: () => checkPostLike(postId, userId),
    enabled: Boolean(postId && userId),
  });
};

// Use-Like-Post
export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      authorId,
      userId,
      postType,
    }: {
      postId: string;
      authorId: string;
      userId: string;
      postType: string;
    }) => likePost(postId, authorId, userId, postType),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_LIKE],
      });
    },
  });
};

// Use-Unlike-Post
export const useUnlikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      unlikePost(postId, userId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, postId],
      });

      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_LIKE],
      });
    },
  });
};

// *** ITEM-LIKE-QUERIES ***

// Use-Get-Items-Likes-Count
export const useGetItemsLikesCount = (itemId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_ITEMS_LIKE_COUNT, itemId],
    queryFn: () => getItemLikesCount(itemId),
    enabled: Boolean(itemId),
    // staleTime: 1000 * 30,
    // gcTime: 1000 * 60 * 5,
  });
};

// Use-Check-Item-Like
export const useCheckItemLike = (itemId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
    queryFn: () => checkItemLike(itemId, userId),
    enabled: Boolean(itemId && userId),
    // staleTime: 1000 * 60, // 1 minute
    // gcTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Use-Like-Item
export const useLikeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      userId,
      authorId,
      postId,
      itemType,
    }: {
      itemId: string;
      userId: string;
      authorId: string;
      postId: string;
      itemType: string;
    }) => likeItem(itemId, userId, authorId, postId, itemType),
    onSuccess: (_, { itemId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ITEMS_LIKE_COUNT, itemId],
      });
    },
  });
};

// Use-Unlike-Item
export const useUnlikeItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, userId }: { itemId: string; userId: string }) =>
      unlikeItem(itemId, userId),
    onSuccess: (_, { itemId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ITEMS_LIKE_COUNT, itemId],
      });
    },
  });
};

// *** SAVE-POST-QUERIES ***

// Use-Get-Post-Saves-Count
export const useGetPostSavesCount = (postId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_POST_SAVES_COUNT, postId],
    queryFn: () => getPostSaveCount(postId),
    enabled: Boolean(postId),
  });
};

// Use-Check-Save-Post
export const useCheckPostSave = (postId: string, userId: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHECK_POST_SAVE, postId, userId],
    queryFn: () => checkPostSave(postId, userId),
    enabled: Boolean(postId && userId),
  });
};

// Use-Save-Post
export const useSavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      postId,
      authorId,
      userId,
    }: {
      postId: string;
      authorId: string;
      userId: string;
    }) => savePost(postId, authorId, userId),
    onSuccess: (_, { postId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_CREATIONS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POST_DETAILS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_SAVES_COUNT, postId],
      });
    },
  });
};

// Use-Unsave-Post
export const useUnsavePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      unsavePost(postId, userId),
    onSuccess: (_, { postId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_CREATION_BY_ID, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_RECENT_CREATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_CREATIONS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POST_DETAILS, postId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_SAVES_COUNT, postId],
      });
    },
  });
};

// *** DISCUSSION-INTERACTION-QUERIES ***

// Use-Discussion-Like
export const useDiscussionLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discussionId,
      authorId,
      userId,
      communityId,
    }: {
      discussionId: string;
      authorId: string;
      userId: string;
      communityId: string;
    }) => discussionLike(discussionId, authorId, userId, communityId),
    onSuccess: (_, { discussionId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DISCUSSION_BY_ID, discussionId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_LIKE],
      });
    },
  });
};

// Use-Discussion-Item-Like
export const useDiscussionItemLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      userId,
      authorId,
      postId,
      itemType,
      communityId,
    }: {
      itemId: string;
      userId: string;
      authorId: string;
      postId: string;
      itemType: string;
      communityId: string;
    }) =>
      discussionItemLike(
        itemId,
        userId,
        authorId,
        postId,
        itemType,
        communityId
      ),
    onSuccess: (_, { itemId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_ITEM_LIKE, itemId, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_ITEMS_LIKE_COUNT, itemId],
      });
    },
  });
};

// Use-Discussion-Save
export const useDiscussionSave = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discussionId,
      authorId,
      userId,
      communityId,
    }: {
      discussionId: string;
      authorId: string;
      userId: string;
      communityId: string;
    }) => discussionSave(discussionId, authorId, userId, communityId),
    onSuccess: (_, { discussionId, userId }) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DISCUSSION_BY_ID, discussionId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHECK_POST_SAVE],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_SAVED_POST_DETAILS, userId],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_POST_SAVES_COUNT, discussionId],
      });
    },
  });
};
