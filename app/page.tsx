'use client';

import { useState, useEffect } from 'react';
import { GameHeader } from '@/components/crash-game/GameHeader';
import { MultiplierHistory } from '@/components/crash-game/MultiplierHistory';
import { BettingPanel } from '@/components/crash-game/BettingPanel';
import { GameCanvas, GAME_STATES } from '@/components/crash-game/GameCanvas';
import { useAuth } from '@/hooks/use-auth';
import { useCrashGame } from '@/hooks/use-crash-game';

export default function Home() {
  const { user, token, address, isAuthenticated, loading } = useAuth();
  const { gameState, joinGame, cashout, isConnected, isAuthenticated: socketAuthenticated } = useCrashGame(token, address);
  
  // Debug logging
  useEffect(() => {
    console.log('Auth state:', { isAuthenticated, user, token: token ? 'present' : 'missing' });
  }, [isAuthenticated, user, token]);
  
  const [cashoutMultiplier, setCashoutMultiplier] = useState(2.0);
  const [betAmount, setBetAmount] = useState(0);
  const [gameStatus, setGameStatus] = useState(GAME_STATES.NotStarted);
  const [betPlaced, setBetPlaced] = useState(false);

  // Sync game status from Socket.IO
  useEffect(() => {
    // Map Socket.IO game states to component states
    // Socket.IO: 1=Starting, 2=InProgress, 3=Over, 4=Blocking, 5=Refunded
    // Component: 1=NotStarted, 2=Starting, 3=InProgress, 4=Over
    if (gameState.status === 1) {
      setGameStatus(GAME_STATES.Starting);
    } else if (gameState.status === 2) {
      setGameStatus(GAME_STATES.InProgress);
    } else if (gameState.status === 3 || gameState.status === 4) {
      setGameStatus(GAME_STATES.Over);
    }
  }, [gameState.status]);

  // Reset bet placed state when new betting round starts
  useEffect(() => {
    if (gameStatus === GAME_STATES.Starting) {
      setBetPlaced(false);
      setBetAmount(0);
    }
  }, [gameStatus]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white retro-text">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header - Always visible */}
      <GameHeader 
        user={user}
        isAuthenticated={isAuthenticated}
        isConnected={isConnected && socketAuthenticated}
      />

      {/* Separator Line */}
      <div className="w-full h-[1px] bg-gray-800" />

      {/* Main Content */}
      {!isAuthenticated ? (
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 pb-8">
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white retro-text mb-4">Welcome to ROCKET</h1>
              <p className="text-gray-400 retro-body mb-6">Please sign in to play</p>
              <p className="text-sm text-gray-500 retro-body">
                Click <span className="text-yellow-400 font-semibold">"Sign In"</span> button in the header above to get started
              </p>
            </div>
          </div>
        </main>
      ) : (
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 pb-8">
        {/* Title and Multiplier History Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Title */}
          <h1 className="text-white !text-xl retro-label">
            Official Whop Solana Crash Game
          </h1>

          {/* Multiplier History */}
          <div className="flex-1 lg:max-w-5xl">
            <MultiplierHistory 
              onMultiplierClick={setCashoutMultiplier}
              history={gameState.history}
            />
          </div>
        </div>

        {/* Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Sidebar - Betting Panel */}
          <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1 h-[600px] md:h-[650px] lg:h-[700px] xl:h-[750px]">
            <BettingPanel
              cashoutMultiplier={cashoutMultiplier}
              onCashoutChange={setCashoutMultiplier}
              onBetAmountChange={(amount) => {
                setBetAmount(amount);
                setBetPlaced(true);
                // Join game via Socket.IO
                if (isAuthenticated && socketAuthenticated) {
                  joinGame(cashoutMultiplier, amount);
                }
              }}
              betPlaced={betPlaced}
              gameStatus={gameStatus}
              balance={user?.amount || 0}
              players={Object.values(gameState.players)}
              onCashout={cashout}
              isAuthenticated={isAuthenticated && socketAuthenticated}
            />
          </div>

          {/* Right Side - Game Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 h-[600px] md:h-[650px] lg:h-[700px] xl:h-[750px]">
            <GameCanvas
              betAmount={betAmount}
              onGameStatusChange={setGameStatus}
              multiplier={gameState.multiplier > 1.0 ? gameState.multiplier : undefined}
              crashPoint={gameState.crashPoint}
              onCashout={cashout}
              isAuthenticated={isAuthenticated && socketAuthenticated}
              gameStatus={gameStatus}
            />
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
