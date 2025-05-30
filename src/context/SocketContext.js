import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // import useauth to get the token

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { isAuthenticated, token } = useAuth(); // get auth status and token

  useEffect(() => {
    // connect only if authenticated and a token exists
    if (isAuthenticated && token) {
      // prevent creating new socket if already connected
      if (socket && socket.connected) {
        return;
      }

      console.log('socketprovider: attempting to connect to socket.io...');

      // create new socket instance
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        query: { token }, // pass token for authentication
        transports: ['websocket'], // prefer websocket
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      // handle socket connection
      newSocket.on('connect', () => {
        console.log(`socket.io connected: ${newSocket.id}`);
      });

      // handle connection errors
      newSocket.on('connect_error', (err) => {
        console.error('socket.io connect error:', err);
        setSocket(null); // clear socket on error to allow retry
      });

      // handle socket disconnection
      newSocket.on('disconnect', (reason) => {
        console.log('socket.io disconnected:', reason);
        setSocket(null); // clear socket on disconnect
      });

      setSocket(newSocket); // set the new socket instance

      // cleanup function: disconnect socket on unmount or dependency change
      return () => {
        console.log('socketprovider: disconnecting socket.io...');
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('disconnect');
        newSocket.disconnect();
      };
    } else {
      // disconnect existing socket if not authenticated or token is missing
      if (socket) {
        console.log('socketprovider: not authenticated or token missing, disconnecting socket.');
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [isAuthenticated, token]); // dependencies for effect

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};