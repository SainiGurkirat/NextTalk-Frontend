import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginUser, registerUser, getUserProfile } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // for initial auth check
    const router = useRouter();

    useEffect(() => {
        // check user authentication status on component mount
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // fetch user profile using the stored token
                    const userData = await getUserProfile(token);
                    setUser(userData);
                } catch (error) {
                    console.error('failed to fetch user profile (invalid token?):', error);
                    localStorage.removeItem('token'); // clear invalid token
                    setUser(null);
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    // handle user login
    const processLogin = async (email, password) => {
        setLoading(true);
        try {
            const response = await loginUser(email, password);
            localStorage.setItem('token', response.token);
            setUser(response.user); // set user state with the full user object
            router.push('/chats'); // redirect to chats page on success
            return { success: true };
        } catch (error) {
            console.error('login failed (authcontext):', error);
            return { success: false, error: error.message || 'login failed' };
        } finally {
            setLoading(false);
        }
    };

    // handle user registration
    const register = async ({ username, email, password }) => {
        setLoading(true);
        try {
            const response = await registerUser(username, email, password);
            console.log("registration api response: registration successful!", response);

            // automatically log in after successful registration
            await processLogin(email, password);

            router.push('/chats'); // redirect after successful registration and login
            return { success: true };
        } catch (error) {
            console.error('registration failed (authcontext):', error);
            return { success: false, error: error.message || 'registration failed' };
        } finally {
            setLoading(false);
        }
    };

    // handle user logout
    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        router.push('/'); // redirect to homepage after logout
    };

    // determine if user is authenticated
    const isAuthenticated = !!user && !loading;
    // get current token from local storage
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, token: currentToken, login: processLogin, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);