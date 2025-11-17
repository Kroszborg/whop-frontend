import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '@/lib/jwt';
import { createServerClient } from '@/lib/supabase';

interface MinesSocket extends Socket {
  user?: {
    id: string;
    address: string;
    username: string;
    avatar: string;
    wallet: number;
  };
  logged?: boolean;
}

interface Socket {
  id: string;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  disconnect: () => void;
}

export function setupMinesNamespace(io: SocketIOServer) {
  const minesNamespace = io.of('/mines');

  minesNamespace.on('connection', (socket: MinesSocket) => {
    console.log(`Client connected to /mines: ${socket.id}`);

    // Authentication (same as crash)
    socket.on('auth', async (data: unknown) => {
      const authData = data as { token: string; address: string };
      try {
        const payload = verifyToken(authData.token);
        
        if (payload.address !== authData.address) {
          socket.emit('auth-error', 'Your token isn\'t an approved token');
          return;
        }

        const supabase = createServerClient();
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('crypto', authData.address)
          .single();

        if (!user) {
          socket.emit('auth-error', 'User not found');
          return;
        }

        socket.user = {
          id: user.id,
          address: user.crypto,
          username: user.username || '',
          avatar: user.avatar,
          wallet: Number(user.wallet),
        };
        socket.logged = true;

        socket.emit('auth-success', { wallet: socket.user.wallet });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('expired')) {
            socket.emit('expire-error', 'Token has expired');
          } else {
            socket.emit('auth-error', error.message);
          }
        } else {
          socket.emit('auth-error', 'Authentication failed');
        }
      }
    });

    // TODO: Implement mine game logic

    socket.on('disconnect', () => {
      console.log(`Client disconnected from /mines: ${socket.id}`);
    });
  });
}


