import AudioPlayer from '@/components/shared/AudioPlayer';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';
import VideoPlayer from '@/components/shared/VideoPlayer';
import { useGetRecentPosts } from '@/lib/react-query/queries';
import { Models } from 'appwrite';

const Home = () => {
  const { data: posts, isPending: isPostLoading } = useGetRecentPosts();

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
      </div>

      <div className="max-w-2xl w-full">
        <AudioPlayer audioUrl="https://www2.cs.uic.edu/~i101/SoundFiles/StarWars60.wav" />
      </div>
      <div className='max-w-2xl w-full h-56 sm:h-80'>
        <div className="my-8 max-w-2xl w-full h-full">
          <VideoPlayer 
            className="h-full" 
            videoUrl="https://cloud.appwrite.io/v1/storage/buckets/66eb8c5f0005ac84ff73/files/6751bdea002e3e10f1b9/view?project=66e2a98a00192795ca51&project=66e2a98a00192795ca51&mode=admin" 
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
