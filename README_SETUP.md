# Next.js + Supabase Migration Setup Guide

This project has been migrated from the original backend to Next.js + Supabase. Follow these steps to set up and run the application.

## Prerequisites

- Node.js 18+ installed
- A Supabase project created
- Environment variables configured

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL schema from `.cursor/supabase_schema.sql`
4. This will create all necessary tables, indexes, and triggers

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (⚠️ CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key-here
JWT_SIGNIN_SECRET=your-secret-key-here
JWT_EXPIRY=1h
```

**Important**: 
- Use a strong, random secret for JWT_SECRET in production
- Never commit `.env.local` to version control
- The JWT secrets are now standardized (both use the same secret)

### 4. Run the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the PORT you specified).

## API Endpoints

All API routes are available under `/api`:

### Authentication
- `POST /api/auth/signin` - Sign in with wallet address
- `GET /api/auth/` - Test endpoint

### User
- `POST /api/user/deposit` - Process deposit (Phase 1: internal only)
- `POST /api/user/approve` - Process withdrawal (Phase 1: internal only)
- `GET /api/user/getCrashRank` - Get crash leaderboard
- `GET /api/user/getMineRank` - Get mine leaderboard
- `GET /api/user/getFlipRank` - Get coinflip leaderboard

### Transactions
- `POST /api/transaction/history` - Get transaction history by type
- `GET /api/transaction/sitehistory` - Get all site transactions

### AI Users
- `POST /api/aiuser/generate` - Generate AI users for bots

## Socket.IO Namespaces

The Socket.IO server runs on the same port as the Next.js server. Connect to:

- `/crash` - Crash game namespace
- `/coinflip` - Coinflip game namespace
- `/mines` - Mine game namespace
- `/chat` - Chat system namespace

### Example Client Connection

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/crash', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  // Authenticate
  socket.emit('auth', {
    token: 'your-jwt-token',
    address: 'your-wallet-address',
  });
});
```

## Project Structure

```
├── app/
│   ├── api/              # Next.js API routes
│   │   ├── auth/
│   │   ├── user/
│   │   ├── transaction/
│   │   └── aiuser/
│   └── page.tsx          # Main page
├── lib/
│   ├── supabase.ts       # Supabase client setup
│   ├── jwt.ts            # JWT utilities
│   ├── utils/
│   │   └── auth.ts       # Authentication helpers
│   └── socket/           # Socket.IO namespace handlers
│       ├── crash.ts
│       ├── coinflip.ts
│       ├── mines.ts
│       └── chat.ts
├── types/
│   └── database.ts        # TypeScript types
├── server.ts             # Custom server with Socket.IO
└── .cursor/
    ├── supabase_schema.sql
    ├── MIGRATION_GUIDE.md
    └── QUICK_REFERENCE.md
```

## Migration Status

### ✅ Phase 1: Core Game (Completed)
- [x] Database schema setup
- [x] Authentication system
- [x] User endpoints (deposit, approve, rankings)
- [x] Transaction endpoints
- [x] Socket.IO server setup
- [x] Crash game namespace (basic structure)
- [x] Coinflip game namespace (basic structure)
- [x] Mine game namespace (basic structure)
- [x] Chat namespace (basic structure)

### ⏳ Phase 2: Blockchain Integration (Pending)
- [ ] Smart contract integration
- [ ] Deposit verification from blockchain
- [ ] Withdrawal to blockchain
- [ ] Token contract interactions

## Important Notes

1. **JWT Secret**: The JWT secret inconsistency has been fixed. Both sign-in and middleware now use the same secret from environment variables.

2. **Phase 1 vs Phase 2**: Currently, deposit/withdraw endpoints work with internal wallet balances only. Blockchain verification will be added in Phase 2.

3. **Socket.IO**: The Socket.IO server runs alongside Next.js using a custom server file (`server.ts`). This is necessary for real-time game connections.

4. **Database**: All database operations use Supabase client. Make sure your RLS policies are configured correctly.

5. **EOS Public Seed**: The crash game's provably fair algorithm requires fetching public seeds from EOS blockchain. This is currently a placeholder and needs to be implemented.

## Testing

1. Test authentication:
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234..."}'
```

2. Test deposit (requires auth token):
```bash
curl -X POST http://localhost:3000/api/user/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount": 100, "address": "0x1234..."}'
```

## Troubleshooting

### Database Connection Issues
- Verify your Supabase URL and keys are correct
- Check that the schema has been run successfully
- Ensure RLS policies allow your operations

### Socket.IO Connection Issues
- Make sure the server is running with `npm run dev`
- Check that the port matches in your client connection
- Verify CORS settings if connecting from a different origin

### JWT Token Issues
- Ensure JWT_SECRET is set in environment variables
- Check token expiry (default: 1 hour)
- Verify token is sent in Authorization header

## Next Steps

1. Complete the crash game logic implementation
2. Implement EOS blockchain public seed fetching
3. Add bot player integration
4. Complete coinflip and mine game logic
5. Add comprehensive error handling and logging
6. Set up production environment variables
7. Implement Phase 2 blockchain features

## Support

Refer to the migration guides:
- `.cursor/MIGRATION_GUIDE.md` - Comprehensive migration guide
- `.cursor/QUICK_REFERENCE.md` - Quick reference for constants and endpoints


