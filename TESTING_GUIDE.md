# Testing Guide - Complete Integration

## 🚀 Quick Start Testing

### Step 1: Start the Server

```bash
npm run dev
```

You should see:
```
> Ready on http://localhost:3000
> Socket.IO server running on /socket.io
```

### Step 2: Open the App

Open your browser and go to:
```
http://localhost:3000
```

## 🧪 Testing Checklist

### ✅ 1. Initial Load
- [ ] Page loads without errors
- [ ] Header shows "ROCKET" logo
- [ ] "CONNECT" button is visible
- [ ] Game canvas is visible
- [ ] Betting panel is visible

### ✅ 2. Wallet Connection (Demo Mode)

1. **Click "CONNECT" button** in the header
   - Button should show "CONNECTING..." briefly
   - Then change to "CONNECTED"
   - Should see wallet balance appear (starts at 0.00)
   - Green dot indicator should appear (connection status)

**Expected Result:**
- ✅ Button changes to "CONNECTED"
- ✅ Balance shows: `0.00` (or your balance if you've deposited)
- ✅ Green connection indicator appears
- ✅ No console errors

**Check Browser Console:**
- Should see: `Connected to /crash namespace`
- Should see: `Authentication successful`
- Should see: `Wallet balance: 0`

### ✅ 3. Real-time Game State

**What to Watch:**
- Game should cycle through states automatically:
  1. **NotStarted** → Brief pause
  2. **Starting** → Countdown timer (20 seconds)
  3. **InProgress** → Multiplier increasing
  4. **Over** → Shows crash point, then restarts

**Expected Behavior:**
- ✅ Countdown timer appears: "STARTING IN 20s"
- ✅ When countdown reaches 0, game starts
- ✅ Multiplier starts at 1.00x and increases
- ✅ Rocket moves up the canvas
- ✅ Game eventually crashes and shows crash point
- ✅ Game automatically restarts

**Check Browser Console:**
- Should see Socket.IO events:
  - `game-start`
  - `game-tick` (multiple times with multiplier updates)
  - `game-end` (with crash point)

### ✅ 4. Place a Bet

**Prerequisites:**
- Must be connected (wallet connected)
- Must be during "Starting" phase (countdown)
- Need balance > 0 (deposit first or use test balance)

**Steps:**
1. Wait for game to be in "Starting" state (countdown)
2. Enter bet amount (e.g., `1.00`)
3. Set cashout multiplier (e.g., `2.00x`)
4. Click "PLACE BET" button

**Expected Result:**
- ✅ Button changes to "BET PLACED"
- ✅ Balance decreases by bet amount
- ✅ Your player appears in players list
- ✅ Bet amount is deducted from wallet
- ✅ Transaction created in database

**Check Browser Console:**
- Should see: `Join game successful`
- Should see: `update_wallet` event with new balance

**If Balance is 0:**
- You'll need to deposit first (see Deposit Testing below)

### ✅ 5. Cashout During Game

**Steps:**
1. Place a bet during "Starting" phase
2. Wait for game to start (InProgress)
3. Click "CASHOUT" button (appears when game is in progress)
   - OR click "CASHOUT NOW" button on canvas

**Expected Result:**
- ✅ Button shows "CASHED OUT" or similar
- ✅ Balance increases with winnings
- ✅ Player status changes to "CASHED" in players list
- ✅ Profit shown in players list

**Check Browser Console:**
- Should see: `bet-cashout-success` event
- Should see: `update_wallet` event with new balance

### ✅ 6. Real-time Player List

**What to Watch:**
- Players list should update in real-time
- Shows all players in current game
- Shows their bet amounts
- Shows their status (IN-PLAY, CASHED, BUST)

**Expected Behavior:**
- ✅ Players appear when they join
- ✅ Status updates in real-time
- ✅ Total players count updates
- ✅ Total bet pool updates

### ✅ 7. Deposit Funds (API Test)

**Using Browser Console:**

```javascript
// Get your token (after connecting wallet)
const auth = JSON.parse(localStorage.getItem('auth'));
const token = auth.auth;
const address = auth.walletAddress;

// Deposit 100
fetch('/api/user/deposit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    amount: 100,
    address: address
  })
})
.then(r => r.json())
.then(console.log);
```

**Expected Result:**
- ✅ Returns: `{ amount: 100 }` (new balance)
- ✅ Balance in header updates
- ✅ Can now place bets

### ✅ 8. Check Leaderboard

**Open in Browser:**
```
http://localhost:3000/api/user/getCrashRank
```

**Expected Result:**
- ✅ Returns JSON array of users
- ✅ Sorted by crash wins (descending)
- ✅ Includes user data (wallet, avatar, etc.)

## 🔍 Debugging Tips

### Check Server Logs

The server logs will show:
- Socket.IO connections
- Game events
- API requests
- Errors

**View logs:**
```bash
tail -f server.log
```

### Check Browser Console

Open DevTools (F12) and check:
- **Console tab**: Socket.IO events, errors
- **Network tab**: API requests, WebSocket connections
- **Application tab**: LocalStorage (auth token)

### Common Issues

#### 1. "Cannot emit: socket not connected"
- **Cause**: Socket.IO not connected or not authenticated
- **Fix**: Check connection status, refresh page

#### 2. "Access denied" when placing bet
- **Cause**: Not authenticated or token expired
- **Fix**: Reconnect wallet

#### 3. Balance not updating
- **Cause**: Socket.IO `update_wallet` event not received
- **Fix**: Check Socket.IO connection, check server logs

#### 4. Game not starting
- **Cause**: Socket.IO game loop not running
- **Fix**: Check server logs for game loop errors

## 📊 What to Test

### Basic Flow
1. ✅ Connect wallet
2. ✅ Deposit funds
3. ✅ Place bet
4. ✅ Watch game
5. ✅ Cashout
6. ✅ Check balance updated

### Edge Cases
1. ✅ Place bet with insufficient balance (should show error)
2. ✅ Try to place bet during "InProgress" (button disabled)
3. ✅ Try to cashout without bet (no button)
4. ✅ Disconnect and reconnect (should maintain state)
5. ✅ Multiple browser tabs (should sync)

### Real-time Features
1. ✅ Multiplier updates smoothly
2. ✅ Player list updates in real-time
3. ✅ Balance updates immediately
4. ✅ Game state syncs across components

## 🎯 Success Criteria

**Integration is working if:**
- ✅ Can connect wallet
- ✅ Can see real-time game state
- ✅ Can place bets
- ✅ Can cashout
- ✅ Balance updates correctly
- ✅ Players list shows real players
- ✅ No console errors
- ✅ Socket.IO events firing

## 🐛 Reporting Issues

If something doesn't work:

1. **Check Browser Console** for errors
2. **Check Server Logs** for errors
3. **Check Network Tab** for failed requests
4. **Verify Environment Variables** are set
5. **Verify Database** is running and schema is applied

## 📝 Test Script

Quick test script to verify everything:

```bash
# 1. Start server
npm run dev

# 2. In another terminal, test API
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"address": "0xtest123"}'

# 3. Should return JWT token and user data

# 4. Open browser to http://localhost:3000
# 5. Click CONNECT
# 6. Watch game cycle
# 7. Place bet (if you have balance)
# 8. Cashout during game
```

## ✅ Expected Console Output

When everything is working, you should see in browser console:

```
Connected to /crash namespace
Socket ID: xxxxxx
Authentication successful
Wallet balance: 0
game-start
game-tick { multiplier: 1.01, elapsed: 150 }
game-tick { multiplier: 1.02, elapsed: 300 }
...
game-end { crashPoint: 2.45 }
```

## 🎉 You're Ready!

Follow these steps and you'll be able to test the complete integration. Everything should work end-to-end!

