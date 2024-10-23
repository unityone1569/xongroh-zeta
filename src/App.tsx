import SignInForm from './_auth/forms/SignInForm';
import SignUpForm from './_auth/forms/SignUpForm';
import AuthLayout from './_auth/AuthLayout';
import RootLayout from './_root/RootLayout';
import { AllUsers, CreatePost, EditPost, Explore, Home, PostDetails, Profile, UpdateProfile } from './_root/pages';

import './globals.css';
import { Route, Routes } from 'react-router-dom';
import OAuthCallback from './_auth/OAuthCallback';
import { Toaster } from './components/ui/toaster';
import SavedPosts from './_root/pages/SavedPosts';
import Community from './_root/pages/Community';
import Marketplace from './_root/pages/Marketplace';

const App = () => {
  return (
    <main className="flex h-screen">
      <Routes>
        {/* Public */}
        <Route element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInForm />} />
          <Route path="sign-up" element={<SignUpForm />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Route>

        {/* Private */}
        <Route element={<RootLayout />}>
        <Route index element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/community" element={<Community />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/saved" element={<SavedPosts />} />
          <Route path="/all-users" element={<AllUsers />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/update-post/:id" element={<EditPost />} />
          <Route path="/posts/:id" element={<PostDetails />} />
          <Route path="/profile/:id/*" element={<Profile />} />
          <Route path="/update-profile/:id" element={<UpdateProfile />} />
        </Route>
      </Routes>

      <Toaster />
    </main>
  );
};

export default App;
