import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useDeleteComment,
  useDeleteCommentReply,
  useDeleteFeedback,
  useDeleteFeedbackReply,
  useDeletePost,
  useDeleteProject,
} from '@/lib/react-query/queries';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

interface DeleteDialogProps {
  title: string;
  description: string;
  onDelete: () => void;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  title,
  description,
  onDelete,
}) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <img
          className="items-center cursor-pointer"
          src="/assets/icons/delete.svg"
          alt="delete"
          width={22}
        />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Delete Creation Component
const DeleteCreation = ({
  postId,
  mediaId,
  creatorId,
}: {
  postId: string;
  mediaId: string | '';
  creatorId: string;
}) => {
  const { toast } = useToast();
  const deletePostMutation = useDeletePost();
  const navigate = useNavigate();

  const handleDelete = () => {
    deletePostMutation.mutate(
      { postId, mediaId, creatorId },
      {
        onSuccess: () => {
          toast({ title: 'Creation deleted successfully' });
          navigate(-1);
        },
        onError: () => {
          toast({ title: 'Error deleting creation' });
        },
      }
    );
  };

  if (deletePostMutation.isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <DeleteDialog
      title="Delete Creation?"
      description="This action cannot be undone. Your creation will be permanently removed."
      onDelete={handleDelete}
    />
  );
};

// Delete Project Component
const DeleteProject = ({
  postId,
  mediaId,
  creatorId,
}: {
  postId: string;
  mediaId: string | '';
  creatorId: string;
}) => {
  const { toast } = useToast();
  const deletePostMutation = useDeleteProject();
  const navigate = useNavigate();

  const handleDelete = () => {
    deletePostMutation.mutate(
      { postId, mediaId, creatorId },
      {
        onSuccess: () => {
          toast({ title: 'Project deleted successfully' });
          navigate(-1);
        },
        onError: () => {
          toast({ title: 'Error deleting project' });
        },
      }
    );
  };

  if (deletePostMutation.isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <DeleteDialog
      title="Delete Project?"
      description="This action cannot be undone. Your project will be permanently removed."
      onDelete={handleDelete}
    />
  );
};

// Delete Comment Component
const DeleteComment = ({
  commentId,
  postId,
}: {
  commentId: string;
  postId: string;
}) => {
  const { toast } = useToast();
  const deleteCommentMutation = useDeleteComment();

  const handleDelete = () => {
    deleteCommentMutation.mutate(
      { commentId, postId },
      {
        onSuccess: () => {
          toast({ title: 'Comment deleted successfully' });
        },
        onError: () => {
          toast({ title: 'Error deleting comment' });
        },
      }
    );
  };

  if (deleteCommentMutation.isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <DeleteDialog
      title="Delete Comment?"
      description="This action cannot be undone. Your comment will be permanently removed."
      onDelete={handleDelete}
    />
  );
};

// Delete Feedback Component
const DeleteFeedback = ({
  feedbackId,
  postId,
}: {
  feedbackId: string;
  postId: string;
}) => {
  const { toast } = useToast();
  const deleteFeedbackMutation = useDeleteFeedback();

  const handleDelete = () => {
    deleteFeedbackMutation.mutate(
      { feedbackId, postId },
      {
        onSuccess: () => {
          toast({ title: 'Feedback deleted successfully' });
        },
        onError: () => {
          toast({ title: 'Error deleting feedback' });
        },
      }
    );
  };

  return (
    <DeleteDialog
      title="Delete Feedback?"
      description="This action cannot be undone. Your feedback will be permanently removed."
      onDelete={handleDelete}
    />
  );
};

// Delete Comment Reply Component
const DeleteCommentReply = ({
  commentReplyId,
  commentId,
}: {
  commentReplyId: string;
  commentId: string;
}) => {
  const { toast } = useToast();
  const deleteCommentReplyMutation = useDeleteCommentReply();

  const handleDelete = () => {
    deleteCommentReplyMutation.mutate(
      { commentReplyId, commentId },
      {
        onSuccess: () => {
          toast({ title: 'Reply deleted successfully' });
        },
        onError: () => {
          toast({ title: 'Error deleting reply' });
        },
      }
    );
  };

  if (deleteCommentReplyMutation.isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  return (
    <DeleteDialog
      title="Delete Reply?"
      description="This action cannot be undone. Your reply will be permanently removed."
      onDelete={handleDelete}
    />
  );
};

// Delete Feedback Reply Component
const DeleteFeedbackReply = ({
  feedbackReplyId,
  feedbackId,
}: {
  feedbackReplyId: string;
  feedbackId: string;
}) => {
  const { toast } = useToast();
  const deleteFeedbackReplyMutation = useDeleteFeedbackReply();

  const handleDelete = () => {
    deleteFeedbackReplyMutation.mutate(
      { feedbackReplyId, feedbackId },
      {
        onSuccess: () => {
          toast({ title: 'Reply deleted successfully' });
        },
        onError: () => {
          toast({ title: 'Error deleting reply' });
        },
      }
    );
  };

  if (deleteFeedbackReplyMutation.isPending) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  return (
    <DeleteDialog
      title="Delete Reply?"
      description="This action cannot be undone. Your reply will be permanently removed."
      onDelete={handleDelete}
    />
  );
};

export {
  DeleteCreation,
  DeleteProject,
  DeleteComment,
  DeleteFeedback,
  DeleteCommentReply,
  DeleteFeedbackReply,
};
