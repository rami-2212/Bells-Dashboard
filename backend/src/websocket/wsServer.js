const { WebSocketServer } = require('ws');

let wss = null;

/**
 * Initialize WebSocket server (attached to existing HTTP server)
 */
function initWSS(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);
    ws.send(JSON.stringify({ type: 'connected', message: 'Smart Road GIS WebSocket ready' }));

    ws.on('close', () => {
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });
  });

  console.log('[WS] WebSocket server initialized on /ws');
  return wss;
}

/**
 * Broadcast a message to all connected clients
 */
function broadcast(payload) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

/**
 * Broadcast a new AI alert to all connected frontend clients
 */
function broadcastAlert(alert) {
  broadcast({
    type:    'AI_ALERT',
    payload: alert,
  });
}

/**
 * Broadcast a telemetry update
 */
function broadcastTelemetry(data) {
  broadcast({
    type:    'IOT_TELEMETRY',
    payload: data,
  });
}

module.exports = { initWSS, broadcast, broadcastAlert, broadcastTelemetry };
