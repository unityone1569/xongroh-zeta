import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import Loader from '@/components/shared/Loader';

export default function AuthLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useUserContext();
  console.log(isAuthenticated);

  if (isLoading) {
    return (
      <>
        <Loader />
      </>
    );
  }

  return isAuthenticated ? (
    <Navigate to="/" state={{ from: location }} />
  ) : (
    <>
      <section className="flex flex-1 justify-center items-center flex-col py-10">
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
