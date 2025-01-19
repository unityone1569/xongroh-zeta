import LazyImage from '@/components/shared/LazyImage';
import { Link } from 'react-router-dom';

const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center w-full justify-center h-screen text-gray-800">
      <div className="text-center border border-dark-4 m-5 mx-9 py-16 bg-dark-3 rounded-3xl">
        <LazyImage
          src="/assets/icons/404.png"
          alt="post"
          className="mb-5"
        />
        <h3 className="h3-bold md:h1-bold text-light-2 mb-5">
          Why are you here?
        </h3>
        <p className="text-light-3 small-regular md:base-regular mb-11 mx-10">
          You're not supposed to be here.
        </p>
        <Link
          to="/"
          className="px-5 py-3 text-dark-1 font-medium bg-purple-300 rounded-lg shadow-md hover:bg-purple-400 transition"
        >
          <span className="pr-1.5 items-center">&larr;</span> Go home
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
