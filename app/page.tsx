'use client';

import { useState, useEffect } from 'react';
import { GameHeader } from '@/components/crash-game/GameHeader';
import { MultiplierHistory } from '@/components/crash-game/MultiplierHistory';
import { BettingPanel } from '@/components/crash-game/BettingPanel';
import { GameCanvas, GAME_STATES } from '@/components/crash-game/GameCanvas';

export default function Home() {
  const [cashoutMultiplier, setCashoutMultiplier] = useState(2.0);
  const [betAmount, setBetAmount] = useState(0);
  const [gameStatus, setGameStatus] = useState(GAME_STATES.NotStarted);
  const [betPlaced, setBetPlaced] = useState(false);

  // Reset bet placed state when new betting round starts
  useEffect(() => {
    if (gameStatus === GAME_STATES.Starting) {
      setBetPlaced(false);
      setBetAmount(0);
    }
  }, [gameStatus]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <GameHeader />

      {/* Separator Line */}
      <div className="w-full h-[1px] bg-gray-800" />

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 pb-8">
        {/* Title and Multiplier History Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Title */}
          <h1 className="text-white !text-xl retro-label">
            Official Whop Solana Crash Game
          </h1>

          {/* Multiplier History */}
          <div className="flex-1 lg:max-w-5xl">
            <MultiplierHistory onMultiplierClick={setCashoutMultiplier} />
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
              }}
              betPlaced={betPlaced}
              gameStatus={gameStatus}
            />
          </div>

          {/* Right Side - Game Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 h-[600px] md:h-[650px] lg:h-[700px] xl:h-[750px]">
            <GameCanvas
              betAmount={betAmount}
              onGameStatusChange={setGameStatus}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
