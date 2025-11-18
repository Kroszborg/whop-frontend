'use client';

import { useState, useEffect, useRef } from 'react';
import { GameHeader } from '@/components/crash-game/GameHeader';
import { MultiplierHistory } from '@/components/crash-game/MultiplierHistory';
import { BettingPanel } from '@/components/crash-game/BettingPanel';
import { GameCanvas, GAME_STATES } from '@/components/crash-game/GameCanvas';
import { useAuth } from '@/hooks/use-auth';
import { useCrashGame } from '@/hooks/use-crash-game';
import { toast } from 'sonner';

export default function Home() {
  const { user, token, address, isAuthenticated, loading } = useAuth();
  const { gameState, joinGame, cashout, isConnected, isAuthenticated: socketAuthenticated } = useCrashGame(token, address);

  const [cashoutMultiplier, setCashoutMultiplier] = useState(2.0);
  const [betAmount, setBetAmount] = useState(0);
  const [gameStatus, setGameStatus] = useState(GAME_STATES.NotStarted);
  const [betPlaced, setBetPlaced] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const autoCashoutTriggeredRef = useRef(false);

  // Sync game status from Socket.IO
  useEffect(() => {
    // Map Socket.IO game states to component states
    // Socket.IO: 1=Starting, 2=InProgress, 3=Over, 4=Blocking, 5=Refunded
    // Component: 1=NotStarted, 2=Starting, 3=InProgress, 4=Over
    console.log('🎮 Game state changed from backend:', {
      socketStatus: gameState.status,
      countdown: gameState.countdown,
      multiplier: gameState.multiplier,
    });

    if (gameState.status === 1) {
      console.log('✅ Setting status to STARTING (betting phase) - countdown:', gameState.countdown);
      setGameStatus(GAME_STATES.Starting);
    } else if (gameState.status === 2) {
      console.log('✅ Setting status to IN PROGRESS');
      setGameStatus(GAME_STATES.InProgress);
    } else if (gameState.status === 3 || gameState.status === 4) {
      console.log('✅ Setting status to OVER (crashed)');
      setGameStatus(GAME_STATES.Over);
    }
  }, [gameState.status]);

  // Reset bet placed state when new betting round starts
  useEffect(() => {
    if (gameStatus === GAME_STATES.Starting) {
      setBetPlaced(false);
      setBetAmount(0);
      setCashedOut(false);
      autoCashoutTriggeredRef.current = false;
    }
  }, [gameStatus]);

  // Auto cashout when multiplier reaches target
  useEffect(() => {
    if (
      betPlaced &&
      !cashedOut &&
      !autoCashoutTriggeredRef.current &&
      gameStatus === GAME_STATES.InProgress &&
      gameState.multiplier >= cashoutMultiplier &&
      isAuthenticated &&
      socketAuthenticated
    ) {
      console.log('Auto cashout triggered at', gameState.multiplier);
      autoCashoutTriggeredRef.current = true;
      cashout();
      setCashedOut(true);
    }
  }, [betPlaced, cashedOut, gameStatus, gameState.multiplier, cashoutMultiplier, isAuthenticated, socketAuthenticated, cashout]);

  // Listen for game errors and show toasts
  useEffect(() => {
    const handleGameError = (event: CustomEvent) => {
      const { type, message } = event.detail;
      if (type === 'cashout') {
        toast.error(`Cashout Failed: ${message}`, {
          description: 'Make sure you have placed a bet before trying to cashout.',
          duration: 4000,
        });
        // Reset cashout state if error
        setCashedOut(false);
      } else if (type === 'join') {
        toast.error(`Bet Failed: ${message}`, {
          description: 'Please try again during the betting phase.',
          duration: 4000,
        });
        // Reset bet state if error
        setBetPlaced(false);
        setBetAmount(0);
      }
    };

    const handleTokenExpired = (event: CustomEvent) => {
      const { message } = event.detail;
      toast.error('Session Expired', {
        description: 'Your session has expired. Please sign in again to continue playing.',
        duration: 6000,
      });

      // Force sign out
      // The useAuth hook will handle clearing state
      window.location.reload();
    };

    const handleCashoutSuccessToast = (event: CustomEvent<{ multiplier: number; payout: number }>) => {
      const { multiplier, payout } = event.detail;
      toast.success(`+${payout.toFixed(4)} SOL`, {
        description: `Cashed out at ${multiplier.toFixed(2)}x`,
        duration: 3000,
      });
    };

    window.addEventListener('game-error', handleGameError as EventListener);
    window.addEventListener('token-expired', handleTokenExpired as EventListener);
    window.addEventListener('cashout-success', handleCashoutSuccessToast as EventListener);

    return () => {
      window.removeEventListener('game-error', handleGameError as EventListener);
      window.removeEventListener('token-expired', handleTokenExpired as EventListener);
      window.removeEventListener('cashout-success', handleCashoutSuccessToast as EventListener);
    };
  }, []);

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
                console.log('onBetAmountChange called', {
                  amount,
                  gameStatus,
                  gameStatusName: gameStatus === GAME_STATES.NotStarted ? 'NotStarted' :
                                  gameStatus === GAME_STATES.Starting ? 'Starting' :
                                  gameStatus === GAME_STATES.InProgress ? 'InProgress' : 'Over',
                  isAuthenticated,
                  socketAuthenticated
                });

                // Only allow betting during Starting phase (betting phase)
                if (gameStatus !== GAME_STATES.Starting) {
                  console.warn('Can only place bets during the betting phase. Current status:', gameStatus);
                  toast.error('Cannot Place Bet', {
                    description: gameStatus === GAME_STATES.InProgress
                      ? 'Game is in progress. Wait for next round.'
                      : 'Wait for the betting phase to start.',
                    duration: 3000,
                  });
                  return;
                }

                // Validate amount
                if (!amount || amount <= 0) {
                  toast.error('Invalid Bet Amount', {
                    description: 'Please enter a valid bet amount.',
                    duration: 3000,
                  });
                  return;
                }

                // Validate balance
                if (amount > (user?.amount || 0)) {
                  toast.error('Insufficient Balance', {
                    description: `You only have ${(user?.amount || 0).toFixed(4)} available.`,
                    duration: 3000,
                  });
                  return;
                }

                setBetAmount(amount);
                setBetPlaced(true);

                // Join game via Socket.IO
                if (isAuthenticated && socketAuthenticated) {
                  console.log('✅ Placing bet:', { amount, target: cashoutMultiplier, gameStatus });
                  joinGame(cashoutMultiplier, amount);

                  toast.success('Bet Placed!', {
                    description: `Bet ${amount.toFixed(4)} at ${cashoutMultiplier.toFixed(2)}x target`,
                    duration: 2000,
                  });
                } else {
                  console.error('Cannot place bet - not authenticated or not connected');
                  toast.error('Connection Error', {
                    description: 'Please wait for connection to be established.',
                    duration: 3000,
                  });
                  setBetPlaced(false);
                  setBetAmount(0);
                }
              }}
              betPlaced={betPlaced}
              cashedOut={cashedOut}
              gameStatus={gameStatus}
              balance={user?.amount || 0}
              players={Object.values(gameState.players)}
              onCashout={() => {
                cashout();
                setCashedOut(true);
              }}
              isAuthenticated={isAuthenticated && socketAuthenticated}
            />
          </div>

          {/* Right Side - Game Canvas */}
          <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2 h-[600px] md:h-[650px] lg:h-[700px] xl:h-[750px]">
            <GameCanvas
              betAmount={betAmount}
              onGameStatusChange={setGameStatus}
              multiplier={gameState.multiplier >= 1.0 ? gameState.multiplier : undefined}
              crashPoint={gameState.crashPoint}
              isAuthenticated={isAuthenticated && socketAuthenticated}
              gameStatus={gameStatus}
              socketCountdown={gameState.countdown}
              cashedOut={cashedOut}
            />
          </div>
        </div>
      </main>
      )}
    </div>
  );
}
