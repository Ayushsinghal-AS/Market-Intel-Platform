import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="p-6 max-w-xl mx-auto pt-24 text-center space-y-3">
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-ink-muted">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="text-sm text-series-blue-light dark:text-series-blue-dark hover:underline">
        Back to Dashboard
      </Link>
    </div>
  );
}
