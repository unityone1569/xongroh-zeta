import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';
import { useToast } from '@/hooks/use-toast';
import { useGetRecentPosts } from '@/lib/react-query/queries';
import { Models } from 'appwrite';

const Home = () => {
  const { data: posts, isPending: isPostLoading } = useGetRecentPosts();
  const { toast } = useToast();
  return (
    <div className="home-container">
      <div className="home-posts">
        <h2 className="h3-bold md:h2:bold text-left w-full">Creation Feed</h2>
        {isPostLoading && !posts ? (
          <Loader />
        ) : (
          <ul className="flex flex-col flex-1 gap-9 w-full">
            {posts?.map((post: Models.Document) => (
              <PostCard post={post} key={post.$id} />
            ))}
          </ul>
        )}

        <div>
          <button
            onClick={() =>
              toast({
                title: 'Hello!',
                description: 'Toast is working fine!',
              })
            }
          >
            Trigger Toast
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
