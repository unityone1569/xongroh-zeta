import BottomBar from '@/components/shared/BottomBar';
import LeftSideBar from '@/components/shared/LeftSideBar';
import Topbar from '@/components/shared/TopBar';
import { Outlet } from 'react-router-dom';

const RootLayout = () => {
  return (
    <>
      <Topbar />
      <div className="w-full md:flex">
        <LeftSideBar />
        <section className="flex flex-1 h-full">
          <Outlet />
        </section>
      </div>
      <BottomBar />
    </>
  );
};

export default RootLayout;
