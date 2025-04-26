import { Link } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { databases, appwriteConfig } from '@/lib/appwrite-apis/config';
import { Query } from 'appwrite';
import { useGetTopCreators } from '@/lib/tanstack-queries/usersQueries';
import Loader from '@/components/shared/Loader';

const creatorTypes = [
  'an artist',
  'a painter',
  'a sculptor',
  'a graphic designer',
  'an illustrator',
  'a muralist',
  'a calligrapher',
  'an animator',
  'a caricature artist',
  'a tattoo artist',
  'a fine artist',
  'a fashion designer',
  'a musician',
  'a singer',
  'a songwriter',
  'a composer',
  'a music producer',
  'a DJ',
  'a musician',
  'a guitarist',
  'a pianist',
  'a drummer',
  'a violinist',
  'a flutist',
  'a bassist',
  'a saxophonist',
  'a vocalist',
  'a beatboxer',
  'a sound engineer',
  'a band member',
  'a rapper',
  'a lyricist',
  'a photographer',
  'a videographer',
  'a cinematographer',
  'a filmmaker',
  'a video editor',
  'a writer',
  'an author',
  'a poet',
  'a screenwriter',
  'a novelist',
  'a copywriter',
  'an essayist',
  'a scriptwriter',
  'a dancer',
  'an actor',
  'a choreographer',
  'a performance artist',
  'a puppeteer',
  'a visual designer',
  'a sound designer',
];

// Unsplash art-themed images - copyright free with Unsplash license
const artBackgrounds = [
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=1945&auto=format&fit=crop', // Art materials
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1771&auto=format&fit=crop', // Abstract art
  'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=1770&auto=format&fit=crop', // Paint brushes
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1780&auto=format&fit=crop', // Art gallery
];

// Unsplash music-themed images - copyright free with Unsplash license
const musicBackgrounds = [
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1770&auto=format&fit=crop', // Music studio
  'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?q=80&w=1770&auto=format&fit=crop', // Concert
  'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1770&auto=format&fit=crop', // Guitar
  'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=1770&auto=format&fit=crop', // Piano
];

const LandingPage = () => {
  const { isAuthenticated } = useUserContext();
  const [creatorType, setCreatorType] = useState(creatorTypes[0]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Add these new states for background management
  const [backgroundImage, setBackgroundImage] = useState(artBackgrounds[0]);
  const [isArtBackground, setIsArtBackground] = useState(true);

  // First, add a new state for transition
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add states for the stats
  const [stats, setStats] = useState({
    creators: 0,
    creations: 0,
    projects: 0,
    events: 0,
    discussions: 0, // Add discussions property
  });
  const [isLoading, setIsLoading] = useState(true);

  // Add states for top creators
  const { data: creators, isLoading: isCreatorsLoading } = useGetTopCreators();

  // Function to fetch stats - optimized version with corrected paths
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Use Promise.all to fetch data in parallel rather than sequentially
      const [creators, creations, projects, events, discussions] =
        await Promise.all([
          databases.listDocuments(
            appwriteConfig.databases.users.databaseId,
            appwriteConfig.databases.users.collections.creator,
            [Query.limit(1)]
          ),
          databases.listDocuments(
            appwriteConfig.databases.posts.databaseId,
            appwriteConfig.databases.posts.collections.creation
          ),
          databases.listDocuments(
            appwriteConfig.databases.posts.databaseId,
            appwriteConfig.databases.posts.collections.project,
            [Query.limit(1)]
          ),
          databases.listDocuments(
            appwriteConfig.databases.events.databaseId,
            appwriteConfig.databases.events.collections.event,
            [Query.limit(1)]
          ),
          databases.listDocuments(
            appwriteConfig.databases.communities.databaseId,
            appwriteConfig.databases.communities.collections.discussion,
            [Query.limit(1)]
          ),
        ]);

      setStats({
        creators: creators.total,
        creations: creations.total,
        projects: projects.total,
        events: events.total,
        discussions: discussions.total,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback to reasonable defaults if fetch fails
      setStats({
        creators: 130,
        creations: 105,
        projects: 50,
        events: 30,
        discussions: 19,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    // First effect for changing creator types
    const creatorInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * creatorTypes.length);
      setCreatorType(creatorTypes[randomIndex]);
    }, 1500);

    // Second effect for changing background images
    const backgroundInterval = setInterval(() => {
      setIsTransitioning(true); // Start transition

      setTimeout(() => {
        // Toggle between art and music themes
        setIsArtBackground((prev) => !prev);

        if (isArtBackground) {
          const randomIndex = Math.floor(
            Math.random() * musicBackgrounds.length
          );
          setBackgroundImage(musicBackgrounds[randomIndex]);
        } else {
          const randomIndex = Math.floor(Math.random() * artBackgrounds.length);
          setBackgroundImage(artBackgrounds[randomIndex]);
        }

        // Reset transition state after a short delay
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 500); // Wait for fade out before changing image
    }, 5000);

    return () => {
      clearInterval(creatorInterval);
      clearInterval(backgroundInterval);
    };
  }, [isArtBackground]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const renderTopCreators = () => {
    const creatorsList = creators?.documents || [];

    return (
      <div className="w-full">
        <div className="infinite-scroll-container">
          <div className="infinite-scroll-track animated">
            {/* First set of cards */}
            {creatorsList.map((creator) => (
              <Link
                key={`first-${creator.$id}`}
                to={`/profile/${creator.$id}`}
                className="flex-shrink-0 w-[230px] bg-dark-3 rounded-xl p-5 border border-dark-4 hover:border-primary-500 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          creator.dpUrl ||
                          '/assets/icons/profile-placeholder.svg'
                        }
                        alt={creator.name}
                        className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-dark-4 group-hover:ring-primary-500 transition-all duration-300 flex"
                      />
                      {creator.verifiedUser && (
                        <div className="absolute -bottom-1 -right-1 bg-dark-3 rounded-full p-1 ring-2 ring-dark-4">
                          <img
                            src="/assets/icons/verified.svg"
                            alt="verified"
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="base-semibold text-primary-500 pb-1">
                        {creator.creationsCount || 0}
                      </p>
                      <p className="tiny-medium text-light-2 uppercase">
                        Creations
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-light-4/10">
                    <div className="flex-1">
                      <h3 className="base-semibold text-light-1 line-clamp-1 group-hover:text-primary-500 transition-colors duration-300">
                        {creator.name}
                      </h3>
                      <p className="subtle-comment-semibold text-light-3 pt-1.5 truncate">
                        {creator.profession || 'Creator'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {/* Duplicate set of cards for seamless loop */}
            {creatorsList.map((creator) => (
              <Link
                key={`second-${creator.$id}`}
                to={`/profile/${creator.$id}`}
                className="flex-shrink-0 w-[230px] bg-dark-3 rounded-xl p-5 border border-dark-4 hover:border-primary-500 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Same content as above */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="flex flex-col gap-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          creator.dpUrl ||
                          '/assets/icons/profile-placeholder.svg'
                        }
                        alt={creator.name}
                        className="w-20 h-20 rounded-full object-cover shadow-lg ring-2 ring-dark-4 group-hover:ring-primary-500 transition-all duration-300 flex"
                      />
                      {creator.verifiedUser && (
                        <div className="absolute -bottom-1 -right-1 bg-dark-3 rounded-full p-1 ring-2 ring-dark-4">
                          <img
                            src="/assets/icons/verified.svg"
                            alt="verified"
                            className="w-4 h-4"
                          />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="base-semibold text-primary-500 pb-1">
                        {creator.creationsCount || 0}
                      </p>
                      <p className="tiny-medium text-light-2 uppercase">
                        Creation
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-light-4/10">
                    <div className="flex-1">
                      <h3 className="base-semibold text-light-1 line-clamp-1 group-hover:text-primary-500 transition-colors duration-300">
                        {creator.name}
                      </h3>
                      <p className="subtle-comment-semibold text-light-3 pt-1.5 truncate">
                        {creator.profession || 'Creator'}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-dark-1 custom-scrollbar">
      <div className="w-full max-w-5xl mx-auto px-1 sm:px-6">
        {/* Header */}
        <header className="flex items-center justify-between p-3 pt-5 sm:p-6">
          <Link to="/home" className="flex gap-1 items-center pl-1.5">
            <img
              src="/assets/icons/logo.svg"
              alt="logo"
              className="w-7 h-7 sm:h-9 sm:w-9 "
            />
            <h3 className="text-[23px] sm:text-[26px] text-primary-500 font-bold leading-[140%] tracking-wider">
              ongroh
            </h3>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-5">
            {isAuthenticated ? (
              <Link to="/home">
                <Button className="shad-button_primary">Go to App</Button>
              </Link>
            ) : (
              <>
                <Link to="/sign-in">
                  <Button variant="ghost" className="text-light-1">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button className="shad-button_primary">Join Us</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Hero Section - Replace fixed height with min-height for responsiveness */}
        <section className="min-h-[600px] md:min-h-[720px] flex flex-col items-center justify-center p-4 sm:p-6 text-center gap-6 sm:gap-8 relative overflow-hidden">
          {/* Hero background image */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-dark-1/90 via-dark-1/70 to-dark-1 z-10"></div>
            <img
              src={backgroundImage}
              alt="Creative background"
              className={`w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=1771&auto=format&fit=crop';
                target.onerror = null;
              }}
            />
          </div>

          {/* Content positioned above the background */}
          <div className="z-10 flex flex-col items-center justify-center gap-6 sm:gap-8 max-w-4xl py-16 md:py-24">
            <div className="h2-bold md:h1-bold font-bold text-light-1 min-h-[110px] md:min-h-[130px] flex flex-col items-center justify-center gap-2 px-4">
              <span className="text-lg md:text-xl text-light-2 font-semibold">
                Are you?
              </span>
              <span className="text-primary-500 text-3xl md:text-5xl pt-1.5 sm:pt-3 font-bold capitalize transition-all duration-500 ease-in-out">
                {creatorType}
              </span>
            </div>
            <p className="text-sm font-light leading-[23px] md:text-base text-light-2 max-w-3xl px-3 pt-4 sm:pt-8 text-pretty">
              Welcome to a platform where creativity in all forms thrives. From
              powerful tools to vibrant communities, we empower artists,
              writers, musicians, photographers, performers and all others to
              share their passion and grow. Turn your talent into opportunities,
              your creative journey starts here!
            </p>
            {!isAuthenticated && (
              <Link to="/sign-up">
                <Button size="lg" className="shad-button_primary mt-4 sm:mt-8">
                  Join the Movement
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Features Section - Replace fixed height with min-height */}
        <section className="min-h-[600px] md:min-h-[720px] flex flex-col items-center justify-center w-full py-12 sm:py-16 md:py-24">
          <div className="text-center mb-6 sm:mb-8 px-4">
            <h2 className="h3-bold sm:h2-bold text-light-1">
              Transforming Creativity Into Success
            </h2>
            <p className="base-regular text-light-3 mt-4 sm:mt-6 md:mt-9">
              Everything you need to create, grow, and earn.
            </p>
          </div>

          <div className="relative px-2 sm:px-8 md:px-14 w-full flex-1 flex items-center">
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory w-full"
            >
              <div className="inline-flex gap-4 md:gap-8 p-4">
                <div className="snap-center min-w-[280px] sm:min-w-[320px]">
                  <FeatureCard
                    icon="/assets/icons/community.svg"
                    title="Circles"
                    description="A space to collaborate, share ideas, and grow together."
                  />
                </div>
                <div className="snap-center min-w-[280px] sm:min-w-[320px]">
                  <FeatureCard
                    icon="/assets/icons/profession.svg"
                    title="Portfolio"
                    description="Build a professional portfolio and showcase to attract clients."
                  />
                </div>
                <div className="snap-center min-w-[280px] sm:min-w-[320px]">
                  <FeatureCard
                    icon="/assets/icons/event.svg"
                    title="Events"
                    description="List, manage, and book events effortlessly."
                  />
                </div>
                <div className="snap-center min-w-[280px] sm:min-w-[320px]">
                  <FeatureCard
                    icon="/assets/icons/marketplace.svg"
                    title="Marketplace"
                    description="Monetize exclusive content, merchandise, or services directly to fans."
                    isComingSoon={true}
                  />
                </div>
                <div className="snap-center min-w-[280px] sm:min-w-[320px]">
                  <FeatureCard
                    icon="/assets/icons/masterclass.svg"
                    title="Masterclass"
                    description="Learn from the best in the industry and level up your skills."
                    isComingSoon={true}
                  />
                </div>
                <div className="snap-center min-w-[280px] sm:min-w-[320px]">
                  <FeatureCard
                    icon="/assets/icons/tribe.svg"
                    title="Tribe"
                    description="Engage directly with fans and patrons to build loyalty and support."
                    isComingSoon={true}
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-dark-3/80 hover:bg-dark-3 p-2 rounded-full text-light-2 hover:text-light-1 transition-all"
              onClick={() => scroll('left')}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-dark-3/80 hover:bg-dark-3 p-2 rounded-full text-light-2 hover:text-light-1 transition-all"
              onClick={() => scroll('right')}
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* COTM Competition Section */}
        <section className="min-h-[300px] md:min-h-[400px] flex flex-col items-center justify-center w-full py-12 sm:py-16 md:py-20 px-6 sm:px-5 bg-gradient-to-br from-primary-500/10 via-dark-1 to-dark-1 relative">
          {/* Live Now! badge at the top-right of the entire section */}
          <div className="absolute top-4 left-4 md:top-6 md:left-8 bg-gradient-to-r from-primary-600 to-primary-500/80 text-light-1 text-xs  font-medium px-3.5 py-1 rounded-full shadow-lg shadow-primary-600/20 z-10">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-light-1 rounded-full animate-ping mb-o.5"></span>
              <span className="subtle-semibold">LIVE</span>
            </span>
          </div>

          <div className="w-full max-w-4xl flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            <div className="md:w-2/5 flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 md:w-44 md:h-44 bg-gradient-to-br from-primary-500/30 via-primary-600/50 to-dark-3 rounded-full flex items-center justify-center animate-pulse-slow relative">
                  <div className="relative flex items-center justify-center">
                    <div className="text-5xl md:text-6xl z-10">🏆</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-3/5 text-center md:text-left">
              <h2 className="h3-bold text-primary-500 mb-3">
                C.O.T.M. Competition
              </h2>
              <p className="text-light-2 subtle-comment md:small-regular mb-4">
                Submit your best creation on Xongroh for a chance to{' '}
                <span className="font-bold">Win ₹3000</span> and a{' '}
                <span className="font-bold">Xongroh T-Shirt</span> every month!
              </p>
              <p className="text-light-3 subtle-normal md:subtle-comment mb-6">
                Competition starts from{' '}
                <span className="font-bold">1st April, 2025.</span>
              </p>

              <Link
                to={isAuthenticated ? '/add-creation' : '/sign-up'}
                className="flex md:flex-none w-full justify-center items-center md:justify-start md:items-start"
              >
                <Button className="shad-button_primary px-6">
                  {isAuthenticated
                    ? 'Submit Your Creation'
                    : 'Join to Participate'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Top Creators Section */}
        <section className="w-full py-12 sm:py-16 md:py-24 px-4 sm:px-5">
          <div className="text-center mb-12 sm:mb-20 md:mb-24">
            <h2 className="h3-bold sm:h2-bold text-light-1">
              Meet Our Top Creators
            </h2>
            <p className="base-regular text-light-3 mt-4 sm:mt-6 md:mt-9">
              Get inspired by exceptional creators shaping our vibrant creator
              community.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            {isCreatorsLoading ? (
              <div className="flex-center w-full h-40">
                <Loader />
              </div>
            ) : (
              renderTopCreators()
            )}

            {!isAuthenticated && (
              <div className="flex-center flex-col mt-12 sm:mt-16 md:mt-24">
                <p className="text-light-2 text-center mb-6">
                  Want to be featured among our top creators?
                </p>
                <Link to="/sign-up">
                  <Button className="shad-button_primary">
                    Start Creating Today
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Community Stats Section - Replace fixed height with min-height */}
        <section className="min-h-[600px] md:min-h-[720px] flex flex-col text-center items-center justify-center w-full py-12 sm:py-16 md:py-24 px-4 sm:px-5">
          <h3 className="h3-bold sm:h2-bold text-light-1 ">
            Join Our Growing Community
          </h3>
          <p className="base-regular text-light-3 mt-4 sm:mt-6 md:mt-10 mb-12 sm:mb-20 md:mb-24">
            Connect, Collaborate, and Thrive Together.
          </p>
          <div className="p-4 sm:p-8 bg-dark-2 rounded-xl border border-light-4 border-opacity-50 w-full max-w-4xl">
            <div className="flex flex-wrap justify-center gap-8 sm:gap-12 md:gap-16 py-4 sm:py-8">
              <StatCard
                number={stats.creators}
                label="Creators Joined"
                isLoading={isLoading}
              />
              <StatCard
                number={stats.creations}
                label="Creations Added"
                isLoading={isLoading}
              />
              <StatCard
                number={stats.projects}
                label="Projects Added"
                isLoading={isLoading}
              />
              <StatCard
                number={stats.discussions}
                label="Discussions Added"
                isLoading={isLoading}
              />
              <StatCard
                number={stats.events}
                label="Events Listed"
                isLoading={isLoading}
              />
            </div>
          </div>
          {!isAuthenticated ? (
            <div className="mt-12 sm:mt-16 md:mt-24 flex flex-col items-center justify-center">
              <p className="text-light-2 text-center pb-6 sm:pb-9 max-w-md">
                It's not every day you get to join something this epic!
              </p>
              <Link to="/sign-up">
                <Button
                  size="lg"
                  className="shad-button_primary px-6 sm:px-10 font-bold shadow-lg hover:shadow-primary-500/20 transition-all"
                >
                  I'm in
                </Button>
              </Link>
            </div>
          ) : (
            <Link to="/home" className="mt-11 sm:mt-16 md:mt-24">
              <Button className="shad-button_primary px-6 sm:px-10 font-bold shadow-lg hover:shadow-primary-500/20 transition-all">
                Go to App
              </Button>
            </Link>
          )}
        </section>

        {/* Footer - Responsive padding adjustments */}
        <footer className="px-4 py-8 mt-16 sm:mt-24 md:mt-32 sm:px-6 text-center text-light-3 subtle-normal sm:small-regular">
          <div className="flex flex-wrap justify-center gap-3.5 sm:gap-6 mb-9">
            <Link to="/privacy" className="hover:text-light-1">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-light-1">
              Terms of Service
            </Link>
            <Link to="/guidelines" className="hover:text-light-1">
              Community Guidelines
            </Link>
          </div>

          {/* Contact Us Section - Improved spacing */}
          <div className="mb-6 sm:mb-8 py-4 sm:py-6 border-y border-light-4/20">
            <h4 className="text-light-1 font-medium mb-4 sm:mb-6 md:mb-8">
              Contact Us
            </h4>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <a
                href="tel:+919127510087"
                className="flex items-center gap-2 hover:text-light-1 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>+91 91275 10087</span>
              </a>
              <a
                href="mailto:support@xongroh.com"
                className="flex items-center gap-2 hover:text-light-1 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>support@xongroh.com</span>
              </a>
            </div>
          </div>

          <p className="text-sm text-light-2">
            © 2025 Xongroh. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  isComingSoon = false,
}: {
  icon: string;
  title: string;
  description: string;
  isComingSoon?: boolean;
}) => (
  <div className="flex flex-col items-center p-6 md:p-9 bg-dark-2 rounded-xl border border-light-4 border-opacity-50 h-full relative">
    {isComingSoon && (
      <div className="absolute -top-3 right-3">
        <div className="px-2 sm:px-3 py-1 bg-primary-500 text-dark-1 text-xs font-bold rounded-full uppercase tracking-wider">
          Coming Soon
        </div>
      </div>
    )}
    <img
      src={icon}
      alt={title}
      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-4 sm:mb-6"
    />
    <h3 className="text-lg sm:text-xl font-bold text-light-1 mb-2 sm:mb-4">
      {title}
    </h3>
    <p className="text-light-3 text-center subtle-comment sm:text-base">
      {description}
    </p>
  </div>
);

// Make StatCard component more responsive
const StatCard = ({
  number,
  label,
  isLoading,
}: {
  number: number;
  label: string;
  isLoading: boolean;
}) => {
  const [displayNumber, setDisplayNumber] = useState(0);
  const counterRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing interval when number changes
    if (counterRef.current) {
      clearInterval(counterRef.current);
    }

    if (!isLoading) {
      // Start counting from current display to target
      const start = displayNumber;
      const end = number;
      const duration = 2000; // 2 seconds
      const stepTime = 50; // Update every 50ms
      const steps = duration / stepTime;
      const increment = (end - start) / steps;
      let current = start;

      counterRef.current = setInterval(() => {
        current += increment;

        // Ensure we don't overshoot
        if (
          (increment > 0 && current >= end) ||
          (increment < 0 && current <= end)
        ) {
          setDisplayNumber(end);
          if (counterRef.current) clearInterval(counterRef.current);
        } else {
          setDisplayNumber(Math.round(current));
        }
      }, stepTime);
    }

    // Cleanup the interval on unmount
    return () => {
      if (counterRef.current) {
        clearInterval(counterRef.current);
      }
    };
  }, [number, isLoading]);

  return (
    <div className="text-center p-2 sm:p-4">
      <p className="text-3xl sm:text-4xl font-bold text-primary-500 mb-1 sm:mb-2">
        {isLoading ? (
          <span className="inline-block w-12 sm:w-16 h-8 sm:h-10 bg-primary-500/20 rounded animate-pulse"></span>
        ) : (
          displayNumber
        )}
      </p>
      <p className="text-light-2 text-sm sm:text-base base-medium uppercase">
        {label}
      </p>
    </div>
  );
};

export default LandingPage;
