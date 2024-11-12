import UpdateprofileForm from '@/components/forms/UpdateProfileForm';
import Loader from '@/components/shared/Loader';
import { Button } from '@/components/ui/button';
import { useUserContext, INITIAL_USER } from '@/context/AuthContext';
import { useGetUserById, useSignOutAccount } from '@/lib/react-query/queries';

import { useNavigate, useParams } from 'react-router-dom';

const UpdateProfile = () => {
  const { id } = useParams();
  const { data: user, isPending } = useGetUserById(id || '');
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useUserContext();

  const { mutate: signOut } = useSignOutAccount();
  // const { data: currentUser, isPending } = useGetCurrentUser();

  if (isPending) {
    return <Loader />;
  }

  const handleSignOut = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    signOut();
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate('/sign-in');
  };

  return (
    <div className="flex flex-1 ">
      <div className="common-container pb-16">
        <div className="max-w-3xl flex-start gap-3 justify-start w-full">
          <div className="w-full flex-center justify-between">
            <h2 className="h3-bold md:h2-bold text-left w-full">
              Update Profile
            </h2>
            <Button
              className="shad-button_dark_4"
              onClick={(e) => handleSignOut(e)}
            >
              <p className="small-medium lg:base-medium ">Logout</p>
            </Button>
          </div>
        </div>
        <UpdateprofileForm user={user} />
      </div>
    </div>
  );
};

export default UpdateProfile;
