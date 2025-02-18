import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useGetTopCreators } from '@/lib/tanstack-queries/usersQueries';

const BadgeDetailsPage = () => {
  const navigate = useNavigate();
  const { data: creators } = useGetTopCreators();

  // Calculate remaining spots
  const totalSpots = 500;
  const takenSpots = creators?.total || 0;
  const remainingSpots = Math.max(0, totalSpots - takenSpots);

  return (
    <div className="flex-col flex-1 flex-center overflow-scroll py-10 px-6 md:p-14 custom-scrollbar">
      <div className="max-w-3xl flex flex-col w-full h-full gap-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 p-2 mt-3 mb-1.5 text-light-2 subtle-semibold"
        >
          <img
            src="/assets/icons/back.svg"
            alt="back"
            className="w-5 h-5 lg:w-6 lg:h-6"
          />
          <p className="pt-1 small-semibold lg:base-semibold">Back</p>
        </button>

        {/* Header Section */}
        <div className="flex flex-col gap-4">
          <img
            src="https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/67adf2dd00271cebb0ec/view?project=66e2a98a00192795ca51"
            alt="Founding Creator Badge"
            className="w-24 h-24"
          />
          <h1 className="h2-bold md:h1-bold flex items-center gap-3 pb-1.5">
            Be a Pioneer of Xongroh
          </h1>

          <div className="base-regular text-light-2">
            The{' '}
            <span className="text-primary-500 font-semibold">
              Founding Creator Badge
            </span>{' '}
            is an exclusive status awarded to the first wave of artists,
            musicians, writers, filmmakers, and creators who join Xongroh during
            its early days.
          </div>

          <div className="base-regular text-light-2 mt-2">
            As a{' '}
            <span className="text-primary-500 font-semibold">
              Founding Creator
            </span>
            , you'll be recognized as an early pioneer of the platform,
            unlocking lifetime perks and premium access that others won't get.
          </div>
        </div>

        {/* Why It Matters Section */}
        <div className="flex flex-col gap-3">
          <h2 className="h3-bold flex items-center gap-2">Why It Matters?</h2>
          <p className="base-regular text-light-2">
            This isn't just a badge—it's a{' '}
            <span className="text-primary-500 font-semibold">VIP pass</span> to
            a{' '}
            <span className="text-primary-500 font-semibold">
              creator-first social media revolution.
            </span>{' '}
            You'll shape the community, enjoy exclusive benefits, and get early
            exposure before the masses join.
          </p>
        </div>

        {/* Perks Sections */}
        <div className="flex flex-col gap-8">
          <h2 className="h3-bold flex items-center gap-2">
            Founding Creator Perks:
          </h2>

          {/* Lifetime Exclusives */}
          <div className="flex flex-col gap-4">
            <h3 className="h4-bold flex items-center gap-2">
              <span>○</span>
              Lifetime Exclusives
            </h3>
            <ul className="list-none space-y-3 text-light-2">
              {lifetimePerks.map((perk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✅</span>
                  <span
                    className="base-regular"
                    dangerouslySetInnerHTML={{ __html: perk }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Enhanced Creative Tools */}
          <div className="flex flex-col gap-4">
            <h3 className="h4-bold flex items-center gap-2">
              <span>○</span>
              Enhanced Creative Tools
            </h3>
            <ul className="list-none space-y-3 text-light-2">
              {creativeToolsPerks.map((perk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✅</span>
                  <span
                    className="base-regular"
                    dangerouslySetInnerHTML={{ __html: perk }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Monetization Boost */}
          <div className="flex flex-col gap-4">
            <h3 className="h4-bold flex items-center gap-2">
              <span>○</span>
              Monetization Boost
            </h3>
            <ul className="list-none space-y-3 text-light-2">
              {monetizationPerks.map((perk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✅</span>
                  <span
                    className="base-regular"
                    dangerouslySetInnerHTML={{ __html: perk }}
                  />
                </li>
              ))}
            </ul>
          </div>

          {/* Community & Growth */}
          <div className="flex flex-col gap-4">
            <h3 className="h4-bold flex items-center gap-2">
              <span>○</span>
              Community & Growth
            </h3>
            <ul className="list-none space-y-3 text-light-2">
              {communityPerks.map((perk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 flex-shrink-0">✅</span>
                  <span
                    className="base-regular"
                    dangerouslySetInnerHTML={{ __html: perk }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Call to Action */}
        <div className="flex flex-col items-center gap-4 mt-4 bg-dark-3 p-6 rounded-xl border-light-4 border">
          <div className="flex flex-col items-center gap-2">
            <p className="h4-bold text-center pb-3">
              Only <span className="text-primary-500">{remainingSpots}</span>{' '}
              spots left!
            </p>
            <div className="w-full max-w-xs bg-dark-4 rounded-full h-2.5">
              <div
                className="bg-primary-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (takenSpots / totalSpots) * 100)}%`,
                }}
              />
            </div>
            <p className="text-light-3 text-sm text-center">
              {takenSpots} of {totalSpots}{' '}
              <span className="font-bold">Founding Creator Badges</span> claimed
              already!
            </p>
          </div>
          <p className="text-light-2 text-center pb-1 pt-6">
            Don't miss your chance to be an OG.
          </p>
          <Button className="shad-button_primary mb-1" asChild>
            <Link to="/sign-up">Become a Founding Creator</Link>
          </Button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4 pb-9">
          {[
            '#CreatorsFirst',
            '#FoundingCreator',
            '#NewSocialSpace',
            '#CreatorsAgainstAlgorithms',
          ].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 bg-dark-4 rounded-full text-light-2 text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// Perk lists
const lifetimePerks = [
  '<strong>Permanent Founding Creator Badge</strong> – A <strong>prestigious, Founding Creator</strong> badge on your profile.',
  '<strong>Priority Profile Discovery</strong> – Appear higher in search & recommendations.',
  '<strong>Early Access to New Features</strong> – Test upcoming tools before anyone else.',
];

const creativeToolsPerks = [
  '<strong>Unlimited High-Quality Uploads</strong> – No compression, no limits.',
  '<strong>Exclusive Creator Portfolio</strong> – Showcase your work professionally.',
  '<strong>Ad-Free Experience for 2 Years</strong> – Enjoy a <strong>pure, distraction-free</strong> platform.',
];

const monetizationPerks = [
  '<strong>Reduced Commission on Earnings</strong> – Pay lower fees on sales/tips forever.',
  '<strong>Exclusive Brand & Client Opportunities</strong> – Get premium exposure to potential collaborations.',
  '<strong>Early Access to MarketPlace</strong> – Sell art, music, and digital goods effortlessly.',
];

const communityPerks = [
  '<strong>VIP Access to Creator-Only Events & Meetups</strong> – Connect with top creators.',
  "<strong>Featured Spot in 'Founding Creators' Directory</strong> – Get highlighted for new users.",
  '<strong>Direct Support & Feature Requests</strong> – Influence platform development with your feedback.',
];

export default BadgeDetailsPage;
