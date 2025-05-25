// frontend/pages/_app.js
import '../../styles/globals.css';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Import useAuth here
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  // Call useAuth directly inside the component that is rendered *within* AuthProvider
  // This means the actual MyApp component should be defined inside the wrapper.

  // The logic for redirection needs to be inside the AuthProvider's scope.
  // We'll move this logic into a separate component or handle it within the pages themselves,
  // or adjust the _app.js structure.

  return (
    <>
      <Head>
        <title>NextTalk</title>
        <meta name="description" content="A real-time chat application with Next.js and Node.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

// Wrap MyApp with AuthProvider for context to be available
export default function AppWrapper(props) {
  return (
    <AuthProvider>
      <AuthRedirector {...props} /> {/* Use a dedicated component for auth logic */}
    </AuthProvider>
  );
}

// New component to handle auth redirects, placed inside AuthProvider's scope
function AuthRedirector({ Component, pageProps }) {
  const router = useRouter();
  const { authLoading, isAuthenticated } = useAuth(); // Now useAuth is defined within AuthProvider's scope

  const protectedRoutes = ['/chats', '/profile']; // Example protected routes

  useEffect(() => {
    console.log(`[AuthRedirector] State Change Detected: `);
    console.log(`      authLoading=${authLoading}, `);
    console.log(`      isAuthenticated=${isAuthenticated}, `);
    console.log(`      currentPath=${router.pathname}`);

    if (authLoading) {
      console.log('[AuthRedirector] Skipping redirect logic, auth is still loading.');
      return;
    }

    const isProtectedRoute = protectedRoutes.includes(router.pathname);

    console.log(`[AuthRedirector] REDIRECT LOGIC EVALUATING: `);
    console.log(`        Path=${router.pathname}, `);
    console.log(`        IsAuthenticated=${isAuthenticated}, `);
    console.log(`        IsProtectedRoute=${isProtectedRoute}`);

    if (isProtectedRoute && !isAuthenticated) {
      console.log('[AuthRedirector] ACTION: Not authenticated on protected page, redirecting to /login');
      router.push('/login');
    } else if (isAuthenticated && (router.pathname === '/login' || router.pathname === '/register')) {
      console.log('[AuthRedirector] ACTION: Authenticated on auth page, redirecting to /chats');
      router.push('/chats');
    } else {
      console.log('[AuthRedirector] ACTION: No redirect needed for current state.');
    }
  }, [authLoading, isAuthenticated, router.pathname, router]); // Added router to dependencies

  // Render the component only when authentication status is determined or if no redirect is needed
  if (authLoading) {
    console.log('[AuthRedirector] Rendering: Auth is loading, returning null.');
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white text-xl">
        Loading authentication...
      </div>
    );
  }

  console.log('[AuthRedirector] Rendering: Auth is loaded, rendering children.');
  return <Component {...pageProps} />;
}