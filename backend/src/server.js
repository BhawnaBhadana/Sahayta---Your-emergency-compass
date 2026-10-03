import http from 'http';
import { app } from './app.js';
import { initRealtime } from './realtime/hub.js';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initRealtime(server);

server.listen(PORT, () => {
  console.log(`Sahayta backend listening on http://localhost:${PORT}`);
  console.log(`WebSocket hub available at ws://localhost:${PORT}/ws`);
});
