import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL || 'wss://bells-dashboard.onrender.com/ws';

export function useWebSocket({ onAlert, onTelemetry } = {}) {
  const wsRef        = useRef(null);
  const reconnectRef = useRef(null);
  const [connected, setConnected]   = useState(false);
  const [lastEvent,  setLastEvent]  = useState(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Connected');
      setConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLastEvent(msg);

        if (msg.type === 'AI_ALERT' && onAlert) {
          onAlert(msg.payload);
        }
        if (msg.type === 'IOT_TELEMETRY' && onTelemetry) {
          onTelemetry(msg.payload);
        }
      } catch (e) {
        console.warn('[WS] Invalid message:', e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('[WS] Disconnected - reconnecting in 3s…');
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  }, [onAlert, onTelemetry]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, lastEvent };
}
