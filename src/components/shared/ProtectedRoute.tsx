import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import Loader from '@/components/shared/Loader';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, isVerified } = useUserContext();
  const location = useLocation();

  // Handle loading state
  if (isLoading) return <Loader />;

  // If authenticated but not verified, only allow verify-email route
  if (isAuthenticated && !isVerified) {
    return location.pathname === '/verify-email' ? 
      <Outlet /> : 
      <Navigate to="/verify-email" replace />;
  }

  // Not authenticated, redirect to sign-in
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  // User is authenticated and verified
  return <Outlet />;
};