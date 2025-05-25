// frontend/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getUserProfile } from '../lib/api'; // Import your API function for fetching user profile

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // This will now hold actual user data from your backend
  const [authLoading, setAuthLoading] = useState(true); // Tracks initial auth check

  const router = useRouter();

  // Function to fetch user data using the provided token
  // Memoized with useCallback to prevent unnecessary re-creations
  const fetchUserData = useCallback(async (token) => {
    try {
      setAuthLoading(true); // Indicate that user data is being fetched
      const userData = await getUserProfile(token); // Call the API to get user profile
      setUser(userData); // Set the actual user data
      setIsAuthenticated(true);
      console.log('AuthContext: User data fetched and set:', userData);
    } catch (error) {
      console.error('AuthContext: Failed to fetch user profile or token invalid:', error);
      // If fetching user data fails (e.g., token expired, invalid), clear auth state
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
      // Optional: Redirect to login if a stored token becomes invalid
      // router.push('/login');
    } finally {
      setAuthLoading(false); // Authentication check is complete
    }
  }, []); // Empty dependency array means this function is created once

  // The login function now sets the token and immediately fetches the user data
  const login = async (token) => {
    localStorage.setItem('token', token);
    await fetchUserData(token); // Wait for user data to be fetched before redirecting
    router.push('/chats'); // Redirect to chats on successful login/register
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login'); // Redirect to login on logout
  };

  // Effect to check for an existing token and fetch user data on component mount
  useEffect(() => {
    console.log('AuthContext: Initializing (checking for token)...');
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserData(token); // If token exists, try to fetch user data
    } else {
      setAuthLoading(false); // No token found, so no user to fetch, auth check is done
      console.log('AuthContext: No token found, not authenticated.');
    }
  }, [fetchUserData]); // Dependency on fetchUserData to avoid stale closures

  // Debugging auth state changes (optional, but good for understanding flow)
  useEffect(() => {
    console.log('[AuthContext] State changed: isAuthenticated=', isAuthenticated, 'user=', user);
  }, [isAuthenticated, user]);

  const value = {
    isAuthenticated,
    user, // This will now be your actual user object from the backend
    authLoading,
    login,
    logout,
    // fetchUserData // You can expose this if you need to manually re-fetch user data elsewhere
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);