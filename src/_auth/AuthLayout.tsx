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
        src="https://images.pexels.com/photos/3374197/pexels-photo-3374197.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
        alt="logo"
        className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
      />
    </>
  );
}
