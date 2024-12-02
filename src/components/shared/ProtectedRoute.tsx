import { useEffect } from 'react'; // Removed useState
import { Outlet, useNavigate } from 'react-router-dom';
import { useUserContext } from '@/context/AuthContext';
import Loader from './Loader';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, isVerified, checkEmailVerification } = useUserContext();
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!isLoading && !isAuthenticated) {
        navigate('/sign-in');
        return;
      }

      if (isAuthenticated && !isVerified) {
        const verified = await checkEmailVerification();
        if (!verified) {
          navigate('/verify-email');
        }
      }
    };

    init();
  }, [isAuthenticated, isLoading, isVerified, checkEmailVerification, navigate]);

  if (isLoading && !isVerified) {
    return <Loader />;
  }

  return <Outlet />;
};
