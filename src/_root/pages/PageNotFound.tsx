import { Link } from 'react-router-dom';

const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center w-full justify-center h-screen text-gray-800">
      <div className="text-center border border-dark-4 m-5 mx-9 py-16 bg-dark-3 rounded-3xl">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <h3 className="text-2xl text-light-2 font-semibold mb-2">
          Page Not Found
        </h3>
        <p className="text-light-3 mb-11 mx-10">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-5 py-3 text-dark-1 font-medium bg-purple-300 rounded-lg shadow-md hover:bg-purple-400 transition"
        >
          <span className="pr-1.5 items-center">&larr;</span> Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
