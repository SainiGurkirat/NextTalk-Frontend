// frontend/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext'; // To get the user ID

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth(); // Get user from AuthContext
  const socketRef = useRef(null); // Use a ref to hold the socket instance

  useEffect(() => {
    // Only connect if authenticated and socket is not already connected
    if (isAuthenticated && user && !socketRef.current) {
      console.log('SocketProvider: Attempting to connect to Socket.IO...');
      const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
        // You can add auth headers here if your socket server needs them
        // auth: { token: localStorage.getItem('token') }
      });

      newSocket.on('connect', () => {
        console.log('Socket.IO Connected:', newSocket.id);
        // Join a personal room for general notifications (e.g., chat list updates)
        newSocket.emit('join_chat', `user_${user._id}`);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO Disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket.IO Connect Error:', error);
      });

      setSocket(newSocket);
      socketRef.current = newSocket; // Store in ref

      // Cleanup function
      return () => {
        console.log('SocketProvider: Disconnecting Socket.IO...');
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else if (!isAuthenticated && socketRef.current) {
        // Disconnect if user logs out
        console.log('SocketProvider: User logged out, disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
    }
  }, [isAuthenticated, user]); // Depend on isAuthenticated and user object

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};