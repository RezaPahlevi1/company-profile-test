import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        The page you are looking for doesn't exist or has been disabled by the administrator.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}