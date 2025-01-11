import { useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { withRenderLogging } from '../utils/withRenderLogging';
import { logger } from '../utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRouteBase = ({ children }: ProtectedRouteProps) => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    logger.debug('state', '⌛ Auth state loading');
    return <div className="loading-ascii">Loading...</div>;
  }

  if (!isSignedIn) {
    logger.info('clerk', '🚫 User not signed in, redirecting to sign-in');
    return <Navigate to="/sign-in" replace />;
  }

  logger.debug('clerk', '✅ User authenticated, rendering protected content');
  return <>{children}</>;
};

export const ProtectedRoute = withRenderLogging(ProtectedRouteBase, 'ProtectedRoute'); 