// frontend/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // Import useAuth to get the token

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, token } = useAuth(); // Only need isAuthenticated and token from AuthContext

  useEffect(() => {
    // Only attempt to connect if authenticated and we have a token
    if (isAuthenticated && token) {
      // If a socket instance already exists and is connected, do nothing.
      // This prevents creating new sockets on re-renders where
      // isAuthenticated or token haven't truly changed state,
      // or if the socket is already established.
      if (socket && socket.connected) {
        return;
      }

      console.log('SocketProvider: Attempting to connect to Socket.IO...');

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
        // On connection error, ensure the socket state is cleared to allow future attempts
        // The effect will re-run if isAuthenticated/token are still true, attempting a new connection.
        setSocket(null);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket.IO Disconnected:', reason);
        // On disconnect, ensure the socket state is cleared to allow future attempts
        setSocket(null);
      });

      setSocket(newSocket); // Set the new socket instance to state

      // Cleanup function: disconnect the socket when component unmounts
      // or when isAuthenticated/token dependencies change, triggering a re-run.
      return () => {
        console.log('SocketProvider: Disconnecting Socket.IO...');
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.disconnect();
        // We do NOT call setSocket(null) here because the setSocket(null) in the
        // event handlers (connect_error, disconnect) handles cases where the
        // connection breaks. This cleanup is primarily for unmounting or
        // when the effect re-runs due to dependency changes (isAuthenticated/token).
      };
    } else {
      // If not authenticated or token is missing, and a socket currently exists, disconnect it.
      if (socket) {
        console.log('SocketProvider: Not authenticated or token missing, disconnecting socket.');
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, token]); // Dependencies: ONLY isAuthenticated and token

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};