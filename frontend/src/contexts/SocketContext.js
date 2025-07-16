import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../config';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    let socketInstance = null;
    let connectionAttempts = 0;
    const maxAttempts = 5;
    const retryDelay = 2000; // 2 seconds between retries

    const connectSocket = () => {
      if (connectionAttempts >= maxAttempts) {
        setError('Maximum reconnection attempts reached');
        return;
      }

      // Get and parse the token properly
      let token = null;
      try {
        const tokenData = localStorage.getItem('token');
        if (tokenData) {
          const parsedToken = JSON.parse(tokenData);
          token = parsedToken.token;

          // Check if token is expired
          if (parsedToken.expiresAt && Date.now() >= parsedToken.expiresAt) {
            console.warn('Token expired, not connecting socket');
            setError('Authentication token expired');
            return;
          }
        }
      } catch (parseError) {
        console.error('Error parsing token for socket connection:', parseError);
        setError('Invalid authentication token');
        return;
      }

      if (!token) {
        console.warn('No valid token available for socket connection');
        setError('No authentication token available');
        return;
      }

      socketInstance = io(API_BASE_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxAttempts,
        reconnectionDelay: retryDelay,
        timeout: 5000, // 5 second connection timeout
        autoConnect: false
      });

      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected:', socketInstance.id);
        setConnected(true);
        setError(null);
        connectionAttempts = 0;
        setReconnectionAttempts(0);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        if (reason === 'io server disconnect') {
          setError('Server disconnected');
        } else if (reason === 'transport close') {
          setError('Network connection lost');
        }
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);

        // Handle authentication errors specifically
        if (err.message && err.message.includes('Invalid token')) {
          setError('Authentication failed - please log in again');
          // Clear the invalid token
          localStorage.removeItem('token');
          return; // Don't retry for auth errors
        }

        setError(err.message || 'Connection failed');
        connectionAttempts++;
        setReconnectionAttempts(connectionAttempts);

        // Retry connection after delay if not max attempts
        if (connectionAttempts < maxAttempts) {
          setTimeout(() => {
            console.log(`Retrying socket connection (attempt ${connectionAttempts + 1}/${maxAttempts})`);
            connectSocket();
          }, retryDelay);
        }
      });

      socketInstance.on('error', (err) => {
        console.error('Socket error:', err);
        setError(err.message || 'Socket error occurred');
        setConnected(false);
      });

      // Attempt to connect
      socketInstance.connect();
      setSocket(socketInstance);
    };

    if (isAuthenticated && user) {
      connectSocket();
    }

    // Cleanup on unmount or when auth state changes
    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        // Remove all event listeners
        socketInstance.removeAllListeners();
        
        // Disconnect and clean up
        socketInstance.disconnect();
        socketInstance.close(); // Explicitly close the connection
        
        // Clear all socket-related state
        setSocket(null);
        setConnected(false);
        setError(null);
        setReconnectionAttempts(0);
        connectionAttempts = 0;
      }
    };
  }, [isAuthenticated, user]);

  // Values provided to consumers
  const value = {
    socket,
    connected,
    error,
    reconnectionAttempts,
    emit: (event, data) => {
      if (socket && connected) {
        socket.emit(event, data);
        return true;
      }
      console.warn('Socket not connected, unable to emit event:', event);
      return false;
    },
    on: (event, callback) => {
      if (socket && connected) {
        socket.on(event, callback);
        return true;
      }
      console.warn('Socket not connected, unable to listen for event:', event);
      return false;
    },
    off: (event, callback) => {
      if (socket) {
        socket.off(event, callback);
        return true;
      }
      return false;
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 