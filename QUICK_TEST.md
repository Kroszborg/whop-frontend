# Quick Test Guide 🚀

## Start Testing in 3 Steps

### 1️⃣ Start the Server
```bash
npm run dev
```

Wait for:
```
> Ready on http://localhost:3000
> Socket.IO server running on /socket.io
```

### 2️⃣ Open Browser
Go to: **http://localhost:3000**

### 3️⃣ Test the Flow

#### Step A: Connect Wallet
- Click **"CONNECT"** button in header
- ✅ Should see: "CONNECTED" + balance (0.00) + green dot

#### Step B: Watch the Game
- Game will automatically cycle:
  - Countdown: "STARTING IN 20s"
  - Game starts: Multiplier increases (1.00x → 1.01x → ...)
  - Game crashes: Shows crash point
  - Restarts automatically

#### Step C: Get Some Balance (Optional)
Open browser console (F12) and run:
```javascript
const auth = JSON.parse(localStorage.getItem('auth'));
fetch('/api/user/deposit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.auth}`
  },
  body: JSON.stringify({
    amount: 100,
    address: auth.walletAddress
  })
}).then(r => r.json()).then(console.log);
```

#### Step D: Place a Bet
1. Wait for countdown (Starting phase)
2. Enter bet amount: `1.00`
3. Click **"PLACE BET"**
4. ✅ Should see: "BET PLACED" + you in players list

#### Step E: Cashout
1. When game is running (InProgress)
2. Click **"CASHOUT"** button
3. ✅ Should see: Balance updated + profit shown

## ✅ What You Should See

### In Browser:
- Real-time multiplier updates
- Real-time player list
- Balance updates
- Game state changes

### In Console (F12):
```
Connected to /crash namespace
Authentication successful
game-start
game-tick { multiplier: 1.01 }
game-tick { multiplier: 1.02 }
...
game-end { crashPoint: 2.45 }
```

## 🐛 Troubleshooting

**Can't connect?**
- Check server is running
- Check port 3000 is available
- Check browser console for errors

**No balance?**
- Run the deposit script above
- Or check database has user with balance

**Game not starting?**
- Check Socket.IO connection (green dot)
- Check server logs for errors
- Refresh page

## 🎯 Success = Everything Works!

If you can:
- ✅ Connect wallet
- ✅ See game running
- ✅ Place bet
- ✅ Cashout
- ✅ See balance update

**Then integration is complete! 🎉**

