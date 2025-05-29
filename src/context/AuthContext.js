// --- File: nexttalk-frontend/src/context/AuthContext.js ---
// React Context for managing user authentication state.

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginUser, registerUser, getUserProfile } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // For initial auth check
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // getUserProfile in api.js now returns the user object directly.
                    // The backend /api/users/me returns the user object.
                    const userData = await getUserProfile(token);
                    setUser(userData);
                } catch (error) {
                    console.error('Failed to fetch user profile on mount (invalid token?):', error);
                    localStorage.removeItem('token'); // Clear invalid token
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const processLogin = async (email, password) => {
        setLoading(true);
        try {
            const response = await loginUser(email, password);
            localStorage.setItem('token', response.token);
            // The backend /login route is expected to return { token, user: { _id, username, email, profilePicture } }
            // So, setUser is correctly called with the full user object from the response.
            setUser(response.user); // Set the user state with the full user object
            router.push('/chats'); // Redirect immediately after successful login
            return { success: true };
        } catch (error) {
            console.error('Login failed (AuthContext):', error);
            // The error object might have a .message if from api.js handleResponse
            return { success: false, error: error.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    const register = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const response = await registerUser(username, email, password);
            console.log("Registration API Response: Registration successful!", response);

            // Automatically log in the user after successful registration
            // Assuming registerUser itself doesn't return a token to log in directly,
            // we'll proceed with a separate login call if desired for immediate access.
            // If registerUser *does* return a token/user, adjust this.
            // Current setup calls processLogin which fetches user data and saves token.
            await processLogin(email, password); // Use await here to ensure login completes

            router.push('/chats'); // Redirect after successful registration and login
            return { success: true };
        } catch (error) {
            console.error('Registration failed (AuthContext):', error);
            return { success: false, error: error.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    };


    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/'); // Redirect to homepage or login page after logout
    };

    // Add isAuthenticated derived state for convenience
    // A user is authenticated if 'user' object exists and loading is false.
    const isAuthenticated = !!user && !loading;
    // The token is directly available from localStorage, but for convenience
    // in components that consume useAuth, we can expose it.
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;


    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, token: currentToken, login: processLogin, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);