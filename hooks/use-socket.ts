'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  namespace?: string;
  token?: string;
  address?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { namespace = '/crash', token, address, onConnect, onDisconnect, onError } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Only connect if we have a token and address
    if (!token || !address) {
      return;
    }

    const socketUrl = namespace.startsWith('/') 
      ? `${window.location.origin}${namespace}`
      : `${window.location.origin}/${namespace}`;

    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Connected to ${namespace}`);
      setIsConnected(true);
      onConnect?.();

      // Authenticate immediately after connection
      socket.emit('auth', { token, address });
    });

    socket.on('disconnect', () => {
      console.log(`Disconnected from ${namespace}`);
      setIsConnected(false);
      setIsAuthenticated(false);
      onDisconnect?.();
    });

    socket.on('auth-success', (data: { wallet: number }) => {
      console.log('Authentication successful', data);
      setIsAuthenticated(true);
    });

    socket.on('auth-error', (error: string) => {
      console.error('Authentication error:', error);
      setIsAuthenticated(false);
      onError?.(error);
    });

    socket.on('expire-error', (error: string) => {
      console.error('Token expired:', error);
      setIsAuthenticated(false);
      onError?.(error);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      onError?.(error.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [namespace, token, address, onConnect, onDisconnect, onError]);

  const emit = (event: string, ...args: unknown[]) => {
    if (socketRef.current && isConnected && isAuthenticated) {
      socketRef.current.emit(event, ...args);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected or authenticated`);
    }
  };

  const on = (event: string, callback: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: unknown[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    isAuthenticated,
    emit,
    on,
    off,
  };
}

