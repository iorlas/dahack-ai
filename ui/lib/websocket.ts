import { useCallback, useEffect, useRef, useState } from 'react';
import type { MessageResponse } from './api';

// WebSocket message types based on API schemas
export interface WSAuthMessage {
  type: 'auth';
  token: string;
}

export interface WSSubscribeMessage {
  type: 'subscribe';
  room_id: number;
}

export interface WSUnsubscribeMessage {
  type: 'unsubscribe';
  room_id: number;
}

export interface WSSendMessage {
  type: 'send_message';
  room_id: number;
  content: string;
}

export interface WSMessageReceived {
  type: 'message';
  message: MessageResponse;
}

export interface WSErrorMessage {
  type: 'error';
  error: string;
}

export interface WSSuccessMessage {
  type: 'success';
  message: string;
}

export type WSIncomingMessage = WSMessageReceived | WSErrorMessage | WSSuccessMessage;

export type WSOutgoingMessage = WSAuthMessage | WSSubscribeMessage | WSUnsubscribeMessage | WSSendMessage;

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  sendMessage: (message: WSOutgoingMessage) => void;
  subscribe: (roomId: number) => void;
  unsubscribe: (roomId: number) => void;
  sendChatMessage: (roomId: number, content: string) => void;
}

export const useWebSocket = (
  onMessage?: (message: WSIncomingMessage) => void,
  onError?: (error: string) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const API_WS_URL = process.env.NEXT_PUBLIC_API_WS_URL || 'ws://localhost:8000';

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No authentication token found');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(`${API_WS_URL}/v1/messages/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Send auth message immediately
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WSIncomingMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);

          if (message.type === 'error') {
            setError(message.error);
            onError?.(message.error);
          }

          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;

        // Attempt to reconnect if it wasn't a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnecting(false);
        onError?.('WebSocket connection error');
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setIsConnecting(false);
    }
  }, [API_WS_URL, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }

    setIsConnected(false);
    setIsConnecting(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
  }, []);

  const sendMessage = useCallback((message: WSOutgoingMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
      setError('Failed to send message');
    }
  }, []);

  const subscribe = useCallback(
    (roomId: number) => {
      sendMessage({ type: 'subscribe', room_id: roomId });
    },
    [sendMessage]
  );

  const unsubscribe = useCallback(
    (roomId: number) => {
      sendMessage({ type: 'unsubscribe', room_id: roomId });
    },
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (roomId: number, content: string) => {
      sendMessage({ type: 'send_message', room_id: roomId, content });
    },
    [sendMessage]
  );

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    subscribe,
    unsubscribe,
    sendChatMessage,
  };
};
