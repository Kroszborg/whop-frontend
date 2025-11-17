import { Server as SocketIOServer } from 'socket.io';

interface ChatSocket extends Socket {
  user?: {
    id: string;
    address: string;
    username: string;
    avatar: string;
  };
}

interface Socket {
  id: string;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  disconnect: () => void;
}

let onlineUsers = 0;

export function setupChatNamespace(io: SocketIOServer) {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket: ChatSocket) => {
    console.log(`Client connected to /chat: ${socket.id}`);
    onlineUsers++;
    
    // Emit online users count
    chatNamespace.emit('online-users', onlineUsers);

    // TODO: Implement chat message sending

    socket.on('disconnect', () => {
      console.log(`Client disconnected from /chat: ${socket.id}`);
      onlineUsers = Math.max(0, onlineUsers - 1);
      chatNamespace.emit('online-users', onlineUsers);
    });
  });
}


