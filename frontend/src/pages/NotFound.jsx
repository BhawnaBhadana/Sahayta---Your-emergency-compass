import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 text-2xl font-bold text-text-primary">Page not found</h1>
      <p className="mt-2 text-text-secondary">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6 inline-block">Back to home</Link>
    </div>
  );
}
