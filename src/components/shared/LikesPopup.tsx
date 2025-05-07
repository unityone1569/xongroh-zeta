import { useInView } from 'react-intersection-observer';
import { Link } from 'react-router-dom';
import { Models } from 'appwrite';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetPostLikes } from '@/lib/tanstack-queries/interactionsQueries';
import Loader from './Loader';

type LikesPopupProps = {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  likesCount: number;
};

const LikesPopup = ({
  postId,
  isOpen,
  onClose,
  likesCount,
}: LikesPopupProps) => {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useGetPostLikes(postId, isOpen);

  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dark-2 border-none max-w-[475px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-light-1 text-left py-3">
            {likesCount} {likesCount === 1 ? 'Clap' : 'Claps'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-center h-40">
            <Loader />
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            {data?.pages.map((page) =>
              page.documents.map((like: Models.Document) => (
                <div key={like.$id} className="flex items-center gap-3">
                  <Link to={`/profile/${like.user.$id}`}>
                    <img
                      src={
                        like.user.dpUrl ||
                        '/assets/icons/profile-placeholder.svg'
                      }
                      alt="user avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${like.user.$id}`}>
                      <p className="base-medium text-light-1 flex items-center gap-2">
                        {like.user.name}
                        {like.user.verifiedUser && (
                          <img
                            src="/assets/icons/verified.svg"
                            alt="verified"
                            className="w-4 h-4"
                          />
                        )}
                      </p>
                      <p className="subtle-comment text-light-3 truncate">
                        {like.user.profession || 'Creator'}
                      </p>
                    </Link>
                  </div>
                </div>
              ))
            )}
            {hasNextPage && (
              <div ref={ref} className="flex-center py-4">
                {isFetchingNextPage && <Loader />}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LikesPopup;
