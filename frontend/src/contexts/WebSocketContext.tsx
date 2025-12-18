import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

type WebSocketMessage = any;

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, isAuthenticated }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Fetch user email when authenticated
  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated) {
        try {
          const user = await authAPI.getCurrentUser();
          setUserEmail(user.email);
        } catch (error) {
          console.error("Failed to fetch user for WebSocket:", error);
        }
      } else {
        setUserEmail(null);
      }
    };
    fetchUser();
  }, [isAuthenticated]);

  const connect = useCallback(() => {
    if (!isAuthenticated || !userEmail || wsRef.current?.readyState === WebSocket.OPEN) return;

    // Close existing connection if any (e.g. connecting or closing)
    if (wsRef.current) {
        wsRef.current.close();
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsBase = API_URL.replace(/^https?:/, wsProtocol).replace(/\/$/, '');
    const WS_URL = `${wsBase}/api/v1/messaging/ws/${encodeURIComponent(userEmail)}`;

    console.log('[WebSocketContext] Connecting to:', WS_URL);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WebSocketContext] Connected');
      setIsConnected(true);
      // Clear any pending reconnects
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Start Heartbeat
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000); // 25 seconds
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong') return; // Ignore pong
        // console.log('[WebSocketContext] Received:', data.type);
        setLastMessage(data);
      } catch (error) {
        console.error('[WebSocketContext] Parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocketContext] Error:', error);
    };

    ws.onclose = (event) => {
      console.log('[WebSocketContext] Closed:', event.code, event.reason);
      setIsConnected(false);
      wsRef.current = null;
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Reconnect logic if authenticated (and not a normal closure like logout)
      if (isAuthenticated && event.code !== 1000) {
        console.log('[WebSocketContext] Attempting reconnect in 3s...');
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [isAuthenticated, userEmail]);

  // Initial connection effect
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        console.log('[WebSocketContext] Cleanup: closing connection');
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [isAuthenticated, userEmail, connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocketContext] Cannot send, not connected');
      toast({
        title: "Connection Lost",
        description: "Reconnecting...",
        variant: "destructive",
      });
    }
  }, [toast]);

  const reconnect = useCallback(() => {
      connect();
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage, sendMessage, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};