import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Socket as NetSocket } from 'net';

interface SocketServer extends HTTPServer {
  io?: SocketIOServer | undefined;
}

interface SocketWithIO extends NetSocket {
  server: SocketServer;
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Prepare Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer: SocketServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Attach Socket.IO to HTTP server
  httpServer.io = io;

  // Import and set up Socket.IO namespaces
  import('./lib/socket/crash').then(({ setupCrashNamespace }) => {
    setupCrashNamespace(io);
  });

  import('./lib/socket/coinflip').then(({ setupCoinflipNamespace }) => {
    setupCoinflipNamespace(io);
  });

  import('./lib/socket/mines').then(({ setupMinesNamespace }) => {
    setupMinesNamespace(io);
  });

  import('./lib/socket/chat').then(({ setupChatNamespace }) => {
    setupChatNamespace(io);
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server running on /socket.io`);
  });
});


