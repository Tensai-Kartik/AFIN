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

      globalSocket = io(backendUrl, {
        auth: {
          token: session.access_token,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      globalSocket.on('connect', () => {
        setIsConnected(true);
        globalSocket?.emit('join', user.id);
      });

      globalSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      globalSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
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
