import VoteButton from "@/components/shared/VoteButton";


const Community = () => {
  return (
    <div className="flex-col flex-1 flex-center overflow-scroll py-10 px-6 md:p-14 custom-scrollbar">
      <div className="max-w-5xl flex flex-col  w-full h-full gap-6 md:gap-9">
        <h2 className="h3-bold md:h2-bold w-full">Community</h2>

        <div className="flex flex-col items-center h-full justify-center gap-4 pb-10">
          <img
            src="/assets/icons/community.svg"
            alt="community"
            width={65}
            height={65}
            className="opacity-35"
          />
          <p className="text-light-2 h3-bold pt-3">"Coming Soon..."</p>
          <p className="text-light-4 base-regular text-center max-w-md">
            We're building a space for creators to connect, collaborate, and
            grow together.
          </p>
          
          {/* Add Like Button */}
          <div className="mt-4">
            <VoteButton featureId="community" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
