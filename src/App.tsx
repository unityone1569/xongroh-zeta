import SignInForm from './_auth/forms/SignInForm';
import SignUpForm from './_auth/forms/SignUpForm';
import AuthLayout from './_auth/AuthLayout';
import RootLayout from './_root/RootLayout';
import {
  AddCreation,
  EditPost,
  Explore,
  Home,
  Community,
  Marketplace,
  AddProject,
  EditProject,
  Portfolio,
  PostDetails,
  Profile,
  UpdateProfile,
  PageNotFound,
  SavedPosts,
  ProjectDetails,
  ChatPage,
  Messages,
} from './_root/pages';

import './globals.css';
import { Route, Routes } from 'react-router-dom';
import OAuthCallback from './_auth/OAuthCallback';
import { Toaster } from './components/ui/toaster';
import VerifyEmail from './_auth/forms/VerifyEmail';
import VerifySuccess from './_auth/forms/VerifySuccess';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

const App = () => {
  return (
    <main className="flex h-screen">
      <Toaster />
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<AuthLayout />}>
          <Route path="sign-in" element={<SignInForm />} />
          <Route path="sign-up" element={<SignUpForm />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="verify-success" element={<VerifySuccess />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
        </Route>

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route index element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/community" element={<Community />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/saved" element={<SavedPosts />} />

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

            {/* Messages */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/chat/:id" element={<ChatPage />} />
          </Route>
        </Route>

        {/* PAGE-NOT-FOUND */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </main>
  );
};

export default App;
