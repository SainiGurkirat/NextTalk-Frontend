import { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming AuthContext is in the same directory

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth(); // Get authenticated user from AuthContext
  const socketRef = useRef(null); // Use ref to hold the socket instance
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Only attempt to connect if user is authenticated and socket not already created
    if (user && !socketRef.current) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (!backendUrl) {
          console.error("NEXT_PUBLIC_BACKEND_URL is not defined in .env.local!");
          return;
      }

      const token = localStorage.getItem('token'); // Retrieve JWT token

      // Initialize Socket.IO client
      const newSocket = io(backendUrl, {
        transports: ['websocket'], // Prefer WebSocket for real-time
        // IMPORTANT: Pass the JWT token for authentication with the backend
        auth: {
          token: token // This token will be accessible in backend's socket.use middleware
        },
        autoConnect: false // Don't auto-connect, we'll connect manually after setting up listeners
      });

      // Event listeners for socket connection status
      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        // Additional error handling if needed, e.g., prompt for re-login
      });

      // Connect the socket
      newSocket.connect();
      socketRef.current = newSocket;
    }

    // Cleanup function: Disconnect on unmount or if user logs out
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false); // Reset connection status
      }
    };
  }, [user]); // Re-run effect if the 'user' object changes (e.g., login/logout)

  // Provide the socket instance and connection status to children components
  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);