// frontend/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // Import useAuth to get the token

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, token, user } = useAuth(); // Get token and user from AuthContext
  const initialConnectAttempted = useRef(false); // To prevent multiple initial connection attempts

  useEffect(() => {
    // Only attempt to connect if authenticated, we have a token,
    // and we haven't already attempted an initial connection
    if (isAuthenticated && token && !initialConnectAttempted.current) {
      console.log('SocketProvider: Attempting to connect to Socket.IO...');
      initialConnectAttempted.current = true; // Mark attempt

      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        query: { token }, // Pass the token in the query string for authentication
        transports: ['websocket'], // Prefer websocket for real-time
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      newSocket.on('connect', () => {
        console.log(`Socket.IO connected: ${newSocket.id}`);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket.IO Connect Error:', err);
        // Reset initialConnectAttempted if connection fails, to allow re-attempt
        initialConnectAttempted.current = false;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO Disconnected:', reason);
        // If disconnected due to auth error, reset state to allow new connection
        if (reason === 'io server disconnect') {
            console.log('Server initiated disconnect, might be auth error.');
            initialConnectAttempted.current = false; // Allow re-attempt on next render cycle
        }
      });

      setSocket(newSocket);

      // Clean up on unmount or token change
      return () => {
        console.log('SocketProvider: Disconnecting Socket.IO...');
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.disconnect();
        setSocket(null);
        initialConnectAttempted.current = false; // Reset for next potential connection
      };
    } else if (!isAuthenticated && socket) {
        // If user logs out, disconnect the socket
        console.log('SocketProvider: User logged out, disconnecting socket.');
        socket.disconnect();
        setSocket(null);
        initialConnectAttempted.current = false; // Reset for next login
    }
  }, [isAuthenticated, token, socket]); // Depend on isAuthenticated and token

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};