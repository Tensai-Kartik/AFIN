'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

// Global singleton to persist across hook calls
let globalSocket: Socket | null = null;

export function useSocket() {
  const { user, session } = useAuth();
  const [isConnected, setIsConnected] = useState(globalSocket?.connected || false);

  useEffect(() => {
    if (!user || !session?.access_token) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
      setIsConnected(false);
      return;
    }

    if (!globalSocket) {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      // Since Vercel Serverless does not support persistent Socket.io servers,
      // we disable socket connections entirely on Vercel to prevent native browser network console errors.
      if (backendUrl.includes('vercel.app') || (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))) {
        setIsConnected(false);
        return;
      }
      
      let socketPath = undefined;
      try {
        const parsedUrl = new URL(backendUrl);
        if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
          socketPath = parsedUrl.pathname.endsWith('/') 
            ? `${parsedUrl.pathname}socket.io` 
            : `${parsedUrl.pathname}/socket.io`;
        }
      } catch (e) {
        // Handle relative paths if any
        if (backendUrl.startsWith('/')) {
          socketPath = `${backendUrl.replace(/\/$/, '')}/socket.io`;
        }
      }

      globalSocket = io(backendUrl, {
        auth: {
          token: session.access_token,
        },
        path: socketPath,
        transports: ['polling', 'websocket'], // Use polling first or as fallback
        reconnection: true,
        reconnectionAttempts: 3, // Reduce from 5 to 3 to prevent infinite spam
        reconnectionDelay: 5000, // Wait 5s before retrying
      });

      globalSocket.on('connect', () => {
        setIsConnected(true);
        globalSocket?.emit('join', user.id);
      });

      globalSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (err) => {
        // Log gracefully to avoid console noise in production serverless environments where websockets aren't active
        if (process.env.NODE_ENV === 'development') {
          console.warn('Socket connection note (development):', err.message);
        } else {
          // Silent failure in production to keep console clean
          setIsConnected(false);
        }
      });

      globalSocket.on('notification', (data: { message: string, type?: 'success' | 'error' | 'info' }) => {
        if (data.type === 'success') toast.success(data.message);
        else if (data.type === 'error') toast.error(data.message);
        else toast(data.message);
      });
    } else {
      // If socket exists, ensure we have the right connection state
      setIsConnected(globalSocket.connected);
    }

    // No cleanup that disconnects, as this is a singleton shared by multiple components.
    // Disconnect only happens when user logs out (handled above).
  }, [user, session]);

  return useMemo(() => ({ socket: globalSocket, isConnected }), [isConnected]);
}
