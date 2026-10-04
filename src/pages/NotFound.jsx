import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-6">
      <p className="font-serif text-7xl font-bold text-amber-600 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Page Not Found
      </h1>
      <p className="text-gray-500 mb-8">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-medium px-8 py-3 rounded-sm tracking-wider transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
