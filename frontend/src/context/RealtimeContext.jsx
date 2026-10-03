import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { getToken } from '../services/api';
import { useAuth } from './AuthContext';

const RealtimeContext = createContext(null);
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export function RealtimeProvider({ children }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date());
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef(new Map()); // type -> Set(fn)
  const socketRef = useRef(null);
  const retryRef = useRef(0);

  const subscribe = useCallback((type, handler) => {
    if (!listenersRef.current.has(type)) listenersRef.current.set(type, new Set());
    listenersRef.current.get(type).add(handler);
    return () => listenersRef.current.get(type)?.delete(handler);
  }, []);

  useEffect(() => {
    function goOnline() {
      setIsOnline(true);
      setLastSyncedAt(new Date());
    }
    function goOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket;

    function connect() {
      const token = getToken();
      const url = token ? `${WS_URL}?token=${encodeURIComponent(token)}` : WS_URL;
      socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        retryRef.current = 0;
      };
      socket.onmessage = (event) => {
        setLastSyncedAt(new Date());
        try {
          const msg = JSON.parse(event.data);
          const handlers = listenersRef.current.get(msg.type);
          handlers?.forEach((fn) => fn(msg.payload));
          const wildcard = listenersRef.current.get('*');
          wildcard?.forEach((fn) => fn(msg));
        } catch {
          // ignore malformed message
        }
      };
      socket.onclose = () => {
        if (cancelled) return;
        setConnected(false);
        retryRef.current += 1;
        const delay = Math.min(1000 * 2 ** retryRef.current, 15000);
        setTimeout(connect, delay);
      };
      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [user?.id]);

  return (
    <RealtimeContext.Provider value={{ isOnline, lastSyncedAt, connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
