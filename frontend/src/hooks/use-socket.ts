'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

let socket: Socket | null = null;

export function useSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (!socket) {
      // Connect to the Express backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      socket = io(backendUrl, {
        auth: { token: user.id }
      });

      socket.on('connect', () => {
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
      });

      // Basic notification listener
      socket.on('notification', (data: { message: string, type: 'success' | 'error' | 'info' }) => {
        if (data.type === 'success') toast.success(data.message);
        else if (data.type === 'error') toast.error(data.message);
        else toast(data.message);
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('notification');
      }
    };
  }, [user]);

  return { socket, isConnected };
}
