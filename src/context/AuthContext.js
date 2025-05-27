// --- File: nexttalk-frontend/src/context/AuthContext.js ---
// React Context for managing user authentication state.

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginUser, registerUser, getUserProfile } from '../lib/api'; // Corrected import to getUserProfile
import { set } from 'date-fns';

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
                    const userData = await getUserProfile(token);
                    setUser(userData);
                } catch (error) {
                    console.error('Failed to fetch user profile on mount:', error);
                    localStorage.removeItem('token'); // Clear invalid token
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // This function now correctly expects email and password as separate arguments
    const processLogin = async (email, password) => {
        setLoading(true);
        try {
            const response = await loginUser(email, password);
            localStorage.setItem('token', response.token);
            // The backend /login route returns { token, user: { _id, username, email, profilePicture } }
            // So, setUser should be called with the full user object from the response.
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

    // This function still expects an object for registration, as per your `AuthForm.js` and `api.js`
    // If you plan to change `registerUser` in `api.js` to take separate arguments,
    // you'll need to update this signature and the call to `registerUser` here too.
        const register = async ({ username, email, password }) => { // Destructure credentials here
        setLoading(true);
        try {
            const response = await registerUser(username, email, password); // Capture the response from registerUser
            // Only log success if the API call truly succeeded and returned expected data
            console.log("Registration API Response: Registration successful!", response); // Now, 'response' contains actual data if successful

            router.push('/login');
            processLogin(email, password); // Automatically log in the user after registration
            
            return { success: true }; // This return will only be reached if no error was thrown
        } catch (error) {
            console.error('Registration failed (AuthContext):', error);
            // This catch block correctly handles the error from api.js
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

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login: processLogin, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);