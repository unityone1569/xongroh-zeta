import SignInForm from './_auth/forms/SignInForm';
import SignUpForm from './_auth/forms/SignUpForm';
import AuthLayout from './_auth/AuthLayout';
import RootLayout from './_root/RootLayout';
import {
  AllUsers,
  AddCreation,
  EditPost,
  Explore,
  Home,
  PostDetails,
  Profile,
  UpdateProfile,
} from './_root/pages';

import './globals.css';
import { Route, Routes } from 'react-router-dom';
import OAuthCallback from './_auth/OAuthCallback';
import { Toaster } from './components/ui/toaster';
import SavedPosts from './_root/pages/SavedPosts';
import Community from './_root/pages/Community';
import Marketplace from './_root/pages/Marketplace';
import Portfolio from './_root/pages/Portfolio';
import AddProject from './_root/pages/AddProject';
import EditProject from './_root/pages/EditProject';
import ProjectDetails from './_root/pages/ProjectDetails';

const App = () => {
  return (
    <main className="flex h-screen">
      <Routes>
        {/* PUBLIC */}
        <Route element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInForm />} />
          <Route path="sign-up" element={<SignUpForm />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Route>

        {/* PRIVATE */}
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/community" element={<Community />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/all-users" element={<AllUsers />} />

          <Route path="/profile/:id/*" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />

          {/* creationPost */}
          <Route path="/add-creation" element={<AddCreation />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetails />} />

          {/* portfolioPost */}
          <Route path="/add-project" element={<AddProject />} />
          <Route path="/update-project/:id" element={<EditProject />} />
          <Route path="/portfolio/:id/*" element={<Portfolio />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
        </Route>
      </Routes>

      <Toaster />
    </main>
  );
};

export default App;
