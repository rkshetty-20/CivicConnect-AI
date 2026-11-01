import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from '../components/common/Toast';
import useAuth from '../hooks/useAuth';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Socket.IO must connect to the server ORIGIN, not the REST API base URL.
    // VITE_API_URL ends with `/api`, which Socket.IO would otherwise interpret
    // as an unregistered namespace and reject with "Invalid namespace".
    const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    let socketUrl = rawUrl;
    try {
      socketUrl = new URL(rawUrl).origin;
    } catch {
      socketUrl = 'http://localhost:5001';
    }
    const socket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      // Join personal room if authenticated
      if (isAuthenticated && user?._id) {
        socket.emit('join:user', user._id);
      }
      // Join city-wide room for broadcasts
      socket.emit('join:city');
    });

    // City-wide broadcast: new issue reported
    socket.on('issue:created', (data) => {
      toast.notification(`📍 New issue reported: "${data.title}" (${data.category})`);
    });

    // City-wide broadcast: issue status changed
    socket.on('issue:statusUpdated', (data) => {
      toast.info(`🔄 An issue status has been updated to ${data.status?.replace('_', ' ')}`);
    });

    // Personal notification from server
    socket.on('notification:new', (notification) => {
      setUnreadCount((prev) => prev + 1);
      toast.notification(notification.message);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, unreadCount, setUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
