import { Link } from 'react-router-dom';

import { useUserContext } from '@/context/AuthContext';

const Topbar = () => {
  const { user } = useUserContext();

  return (
    <section className="topbar">
      <div className="flex-between py-4 px-5">
        <Link to="/" className="flex gap-3 items-center">
          <img src="/assets/icons/logo.svg" alt="logo" width={36} />
          <h3 className="h3-bold md:h3-bold">xongroh</h3>
        </Link>
        <div>
          <Link to={`/profile/${user.id}`} className="flex-center gap-3">
            <img
              src={user.dpUrl || '/assets/icons/profile-placeholder.svg'}
              alt="profile"
              className="h-10 w-10 rounded-full"
            />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Topbar;
