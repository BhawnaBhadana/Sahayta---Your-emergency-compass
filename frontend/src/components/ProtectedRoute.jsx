import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './DataState';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState label="Checking your session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="text-5xl">🚫</p>
        <h1 className="mt-4 text-xl font-bold text-text-primary">Access restricted</h1>
        <p className="mt-2 text-text-secondary">
          Your account role ({user.role}) doesn't have access to this page.
        </p>
      </div>
    );
  }
  return children;
}
