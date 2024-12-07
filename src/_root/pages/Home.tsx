import { useState, useMemo } from 'react';
import Loader from '@/components/shared/Loader';
import PostCard from '@/components/shared/PostCard';
import { useGetRecentPosts, useGetSavedPosts } from '@/lib/react-query/queries';
import { Models } from 'appwrite';
import { useUserContext } from '@/context/AuthContext';

const Home = () => {
  const { user } = useUserContext();
  const [activeTab, setActiveTab] = useState('creation');

  const tabs = useMemo(
    () => [
      { name: 'creation', label: 'Creations' },
      { name: 'saved', label: 'Saved' },
    ],
    []
  );

  const { data: posts, isPending: isPostLoading } = useGetRecentPosts();
  const { data: savedPosts, isLoading: isSavedLoading } = useGetSavedPosts(
    user.id
  );

  const renderContent = () => {
    if (activeTab === 'creation') {
      if (isPostLoading)
        return (
          <div className="p-10">
            <Loader />
          </div>
        );

      return (
        <ul className="flex flex-col flex-1 gap-9 w-full">
          {!posts || posts.length === 0 ? (
            <p className="text-light-4 pl-3.5">No creations available yet</p>
          ) : (
            posts.map((post: Models.Document) => (
              <PostCard post={post} key={post.$id} />
            ))
          )}
        </ul>
      );
    }

    if (activeTab === 'saved') {
      if (isSavedLoading)
        return (
          <div className="p-10">
            <Loader />
          </div>
        );

      return (
        <ul className="flex flex-col flex-1 gap-9 w-full">
          {!savedPosts || savedPosts.length === 0 ? (
            <p className="text-light-4 pl-3.5">No saved posts yet</p>
          ) : (
            savedPosts.map((post: Models.Document) => (
              <PostCard post={post} key={post.$id} />
            ))
          )}
        </ul>
      );
    }
  };

  return (
    <div className="home-container">
      <div className="home-posts">
        <div className="flex flex-col gap-9 w-full">
          <h2 className="h3-bold mt-16 lg:mt-0 md:h2-bold text-left w-full">
            Creation Feed
          </h2>

          {/* Tabs */}
          <div className="flex-start gap-3 w-full max-w-5xl">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-2 px-3 font-semibold ${
                  activeTab === tab.name
                    ? 'underline text-primary-500 underline-offset-8'
                    : 'hover:text-primary-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 gap-9 w-full max-w-5xl pb-7">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Home;
