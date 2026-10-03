import { WebSocketServer } from 'ws';
import { verifyToken } from '../utils/jwt.js';

let wss = null;
/** Map<WebSocket, { userId, role }> */
const clients = new Map();

export function initRealtime(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, req) => {
    let identity = { userId: null, role: 'guest' };
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (token) {
        const decoded = verifyToken(token);
        identity = { userId: decoded.id, role: decoded.role };
      }
    } catch {
      // unauthenticated sockets are still allowed (read-only public feed: alerts/map)
    }
    clients.set(socket, identity);

    socket.send(JSON.stringify({ type: 'CONNECTED', payload: { role: identity.role } }));

    socket.on('close', () => clients.delete(socket));
  });

  console.log('[realtime] WebSocket hub attached at /ws');
  return wss;
}

/**
 * Broadcast an event to all connected clients, optionally restricted to a set of roles
 * or a specific userId (e.g. citizen who owns the SOS).
 */
export function broadcast(type, payload, { roles, userId } = {}) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload, ts: new Date().toISOString() });
  for (const [socket, identity] of clients.entries()) {
    if (socket.readyState !== socket.OPEN) continue;
    if (roles && !roles.includes(identity.role)) continue;
    if (userId && identity.userId !== userId) continue;
    socket.send(message);
  }
}
