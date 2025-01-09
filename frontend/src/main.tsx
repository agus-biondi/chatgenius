import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key. Check your .env file.');
}

const router = createBrowserRouter([
  {
    path: '*',
    element: <App />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={CLERK_PUBLISHABLE_KEY}
      //signInUrl="/sign-in"
      //signUpUrl="/sign-up"
      //signInFallbackRedirectUrl="/"
      //signUpFallbackRedirectUrl="/"
    >
      <RouterProvider router={router} />
    </ClerkProvider>
  </React.StrictMode>
);
