import BottomBar from '@/components/shared/BottomBar';
import LeftSideBar from '@/components/shared/LeftSideBar';
import RightSideBar from '@/components/shared/RightSideBar';
import Topbar from '@/components/shared/TopBar';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <>
      <Topbar />
      <div className="w-full md:flex h-dvh">
        <LeftSideBar />
        <section className="flex flex-1 h-dvh">
          <Outlet />
        </section>
        <RightSideBar />
      </div>
      <BottomBar />
    </>
  );
};

export default RootLayout;
