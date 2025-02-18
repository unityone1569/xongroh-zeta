import { Navigate, Outlet } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import Loader from '@/components/shared/Loader';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, isVerified } = useUserContext();

  if (isLoading) {
    return <Loader />;
  }

  // If user is authenticated, handle routing based on verification status
  if (isAuthenticated) {
    if (!isVerified) {
      // Redirect to verification page if email isn't verified
      return <Navigate to="/verify-email" replace />;
    }
    // Redirect to home if already authenticated and verified
    return <Navigate to="/" replace />;
  }

  // Allow access to auth pages if not authenticated
  return (
    <>
      <section className="flex flex-1 justify-center items-center flex-col overflow-hidden">
        <Outlet />
      </section>

      <img
        src="https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/678c902a003a135baa89/view?project=66e2a98a00192795ca51"
        alt="cover"
        className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
      />
    </>
  );
}
