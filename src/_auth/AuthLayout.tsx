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
      return <Navigate to="/verify-email" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Allow access to auth pages if not authenticated
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="relative flex flex-1">
        <img
          src="https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/678c902a003a135baa89/view?project=66e2a98a00192795ca51"
          alt="cover"
          className="absolute inset-0 w-full h-full object-cover opacity-15 xl:hidden"
        />
        <section className="relative flex-1 flex justify-center items-center">
          <div className="max-h-screen overflow-y-auto no-scrollbar">
            <Outlet />
          </div>
        </section>
      </div>

      <img
        src="https://api.xongroh.com/v1/storage/buckets/678c8e03002d41317909/files/678c902a003a135baa89/view?project=66e2a98a00192795ca51"
        alt="cover"
        className="hidden xl:block h-screen w-1/2 object-cover bg-no-repeat"
      />
    </div>
  );
}
