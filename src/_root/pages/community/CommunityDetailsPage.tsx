import { useState, useMemo, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Models } from 'appwrite';
import { useInView } from 'react-intersection-observer';
import Loader from '@/components/shared/Loader';
import LazyImage from '@/components/shared/LazyImage';
import {
  useGetCommunityById,
  useGetCommunityMembers,
  useGetCommunityTopics,
  useCheckMembershipStatus,
  useJoinCommunity,
  useLeaveCommunity,
  useGetTopicPings,
} from '@/lib/tanstack-queries/communityQueries';
import { useUserContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/tanstack-queries/queryKeys';

const tabs = [
  { name: 'topics', label: 'Topics' },
  { name: 'members', label: 'Members' },
  { name: 'rules', label: 'Rules' },
];

const TopicCard = ({ topic }: { topic: Models.Document }) => {
  const { user } = useUserContext();
  const { data: pingCount = 0 } = useGetTopicPings(topic.$id, user.id);

  return (
    <div className="flex flex-col p-6 bg-dark-3 rounded-xl border border-light-4 border-opacity-50 w-full">
      <div className="flex justify-between items-center">
        <Link to={`/topics/${topic.$id}`}>
          <div className="flex items-center justify-center w-full gap-1">
            <h3 className="base-medium line-clamp-1">{topic.topicName}</h3>
            {topic.discussionsCount > 0 && (
              <p className="text-light-3 subtle-semibold pt-[3px]">
                ({topic.discussionsCount})
              </p>
            )}
          </div>
        </Link>
        {pingCount > 0 && (
          <div className="flex-shrink-0">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-purple-500 to-purple-300 rounded-full flex-shrink-0"></div>
          </div>
        )}
      </div>
    </div>
  );
};

const MemberCard = ({ member }: { member: Models.Document }) => (
  <div className="user-card bg-dark-3">
    <div className="flex-shrink-0">
      <Link to={`/profile/${member.creatorId}`}>
        <LazyImage
          src={member.user.dpUrl || '/assets/icons/profile-placeholder.svg'}
          alt="member"
          className="w-12 h-12 rounded-full object-cover"
        />
      </Link>
    </div>
    <div className="flex-1">
      <Link to={`/profile/${member.creatorId}`}>
        <h3 className="base-medium line-clamp-1 flex items-center gap-1.5">
          {member.user.name}
          {member.user.verifiedUser && (
            <img
              src="/assets/icons/verified.svg"
              alt="verified"
              className="w-4 h-4"
            />
          )}
        </h3>
      </Link>
      <p className="small-semibold text-light-4 pt-0.5">{member.role}</p>
    </div>
  </div>
);

const CommunityDetailsPage = () => {
  const { user } = useUserContext();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('topics');

  const { data: community, isLoading: isLoadingCommunity } =
    useGetCommunityById(id || '');
  const {
    data: topicsPages,
    hasNextPage: hasNextTopics,
    fetchNextPage: fetchNextTopics,
    isLoading: isLoadingTopics,
  } = useGetCommunityTopics(id || '');
  const {
    data: membersPages,
    hasNextPage: hasNextMembers,
    fetchNextPage: fetchNextMembers,
    isLoading: isLoadingMembers,
  } = useGetCommunityMembers(id || '');

  const { data: isMember, isLoading: isCheckingMembership } =
    useCheckMembershipStatus(user.id, id || '');
  const { mutate: joinCommunity, isPending: isJoining } = useJoinCommunity();
  const { mutate: leaveCommunity, isPending: isLeaving } = useLeaveCommunity();
  const queryClient = useQueryClient();

  const { ref, inView } = useInView();

  // Flatten data from all pages
  const topics = useMemo(() => {
    return topicsPages?.pages.flatMap((page) => page.documents) || [];
  }, [topicsPages]);

  const members = useMemo(() => {
    return membersPages?.pages.flatMap((page) => page.documents) || [];
  }, [membersPages]);

  // Handle infinite scroll
  useEffect(() => {
    if (inView) {
      if (activeTab === 'topics' && hasNextTopics) {
        fetchNextTopics();
      } else if (activeTab === 'members' && hasNextMembers) {
        fetchNextMembers();
      }
    }
  }, [inView, activeTab, hasNextTopics, hasNextMembers]);

  if (isLoadingCommunity) {
    return <Loader />;
  }

  const handleJoinLeave = () => {
    if (isMember) {
      leaveCommunity(
        { userId: user.id, communityId: id || '' },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_COMMUNITY_BY_ID, id],
            });
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.CHECK_MEMBERSHIP_STATUS, user.id, id],
            });
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_COMMUNITY_MEMBERS, id],
            });
            // Reset active tab when leaving
            setActiveTab('topics');
          },
        }
      );
    } else {
      joinCommunity(
        { userId: user.id, communityId: id || '' },
        {
          onSuccess: () => {
            // Force refetch community data and membership status
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_COMMUNITY_BY_ID, id],
            });
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.CHECK_MEMBERSHIP_STATUS, user.id, id],
            });
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEYS.GET_COMMUNITY_MEMBERS, id],
            });
          },
        }
      );
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'topics':
        if (isLoadingTopics) return <Loader />;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-6 w-full">
            {topics.map((topic) => (
              <TopicCard key={topic.$id} topic={topic} />
            ))}
            {hasNextTopics && <div ref={ref} className="h-10" />}
          </div>
        );

      case 'members':
        if (isLoadingMembers) return <Loader />;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-6 w-full">
            {members.map((member) => (
              <MemberCard key={member.$id} member={member} />
            ))}
            {hasNextMembers && <div ref={ref} className="h-10" />}
          </div>
        );

      case 'rules':
        return (
          <div className="flex flex-col gap-4 p-6 bg-dark-3 rounded-xl">
            <h3 className="h4-bold">Community Rules</h3>
            <div className="base-regular whitespace-pre-line">
              {community?.document.rules ||
                'No rules have been set for this community.'}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-inner_container">
        {/* Community Profile Header - Always visible */}
        <div className="overflow-hidden">
          <div className="pb-4 pt-10 md:pt-0 shadow-lg">
            <div className="flex flex-col justify-start items-start py-6 px-3 sm:px-6 lg:pl-9">
              <div className="w-full">
                <div className="flex justify-between gap-10">
                  <div className="flex-shrink-0 pb-6">
                    <LazyImage
                      src={
                        community?.document.imageUrl ||
                        '/assets/icons/profile-placeholder.svg'
                      }
                      className="h-20 w-20 lg:h-28 lg:w-28 object-cover rounded-full bottom-9 lg:bottom-11"
                      alt="Profile"
                    />
                  </div>

                  <div className="flex items-center">
                    <div className="flex gap-6 lg:gap-20 pt-2 lg:pt-4">
                      <div className="text-center">
                        <div className="small-medium lg:base-medium">
                          {community?.document.membersCount || 0}
                        </div>
                        <div className="small-regular lg:base-regular pt-1">
                          Members
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold lg:text-2xl">
                  {community?.document.name}
                </div>
                <p className="pt-3 max-w-xl text-pretty small-regular font-light">
                  {community?.document.about}
                </p>

                {user.id && (
                  <Button
                    onClick={handleJoinLeave}
                    disabled={isCheckingMembership || isJoining || isLeaving}
                    className={`mt-4 h-9 min-w-[100px] ${
                      isMember ? 'shad-button_dark_4' : 'shad-button_primary'
                    }`}
                  >
                    {isCheckingMembership ? (
                      <Loader />
                    ) : isJoining || isLeaving ? (
                      <Loader />
                    ) : isMember ? (
                      'Leave'
                    ) : (
                      'Join'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Only show tabs and content if user is a member */}
        {isMember && (
          <>
            {/* Tabs Section */}
            <div className="flex-start lg:mt-8 lg:mb-10 whitespace-nowrap pl-1 sm:pl-3 lg:pl-9 lg:overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`p-2 px-3 font-semibold ${
                    activeTab === tab.name
                      ? 'underline text-primary-500 underline-offset-8'
                      : 'hover:text-primary-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Section */}
            <div className="mx-3 mt-8 mb-20 pl-1 sm:pl-3 lg:pl-9">
              {renderContent()}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityDetailsPage;
