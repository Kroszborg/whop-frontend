'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BetMode } from '@/types/game';
import { PlayersList } from './PlayersList';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GAME_STATES } from './GameCanvas';
import type { BetType } from '@/types/database';

interface BettingPanelProps {
  cashoutMultiplier: number;
  onCashoutChange: (value: number) => void;
  onBetAmountChange?: (value: number) => void;
  betPlaced?: boolean;
  cashedOut?: boolean;
  gameStatus?: number;
  balance?: number;
  players?: BetType[];
  onCashout?: () => void;
  isAuthenticated?: boolean;
}

export function BettingPanel({
  cashoutMultiplier,
  onCashoutChange,
  onBetAmountChange,
  betPlaced = false,
  cashedOut = false,
  gameStatus,
  balance = 0,
  players = [],
  onCashout,
  isAuthenticated = false,
}: BettingPanelProps) {
  const [betMode, setBetMode] = useState<BetMode>('manual');
  const [betAmount, setBetAmount] = useState<string>('0.00');
  const [estimatedProfit, setEstimatedProfit] = useState<string>('0.00');
  const [autoModeActive, setAutoModeActive] = useState(false);
  const prevGameStatusRef = useRef<number | undefined>(undefined);
  const betInputsLocked = betPlaced;

  useEffect(() => {
    if (parseFloat(betAmount) > 0) {
      const profit = parseFloat(betAmount) * cashoutMultiplier - parseFloat(betAmount);
      setEstimatedProfit(profit.toFixed(2));
    }
  }, [cashoutMultiplier, betAmount]);

  // Auto mode: Automatically place bet when new round starts
  useEffect(() => {
    const prevStatus = prevGameStatusRef.current;
    prevGameStatusRef.current = gameStatus;

    if (betMode === 'auto' && autoModeActive && gameStatus === GAME_STATES.Starting && prevStatus === GAME_STATES.Over) {
      // New round started after a crash - place bet automatically
      if (parseFloat(betAmount) > 0 && parseFloat(betAmount) <= balance && isAuthenticated && onBetAmountChange) {
        // Small delay to ensure backend is ready
        setTimeout(() => {
          onBetAmountChange(parseFloat(betAmount));
        }, 500);
      }
    }
  }, [gameStatus, betMode, autoModeActive, betAmount, balance, isAuthenticated, onBetAmountChange]);

  // Auto mode: Stop auto mode when manually disabled or when user cashes out manually
  useEffect(() => {
    if (betMode === 'manual') {
      setAutoModeActive(false);
    }
  }, [betMode]);

  const handleBetAmountChange = (value: string) => {
    if (betInputsLocked) return;
    setBetAmount(value);
    if (parseFloat(value) > 0) {
      const profit = parseFloat(value) * cashoutMultiplier - parseFloat(value);
      setEstimatedProfit(profit.toFixed(2));
    } else {
      setEstimatedProfit('0.00');
    }
  };

  const handleMultiplyBet = (multiplier: number) => {
    if (betInputsLocked) return;
    const current = parseFloat(betAmount) || 0;
    handleBetAmountChange((current * multiplier).toFixed(2));
  };

  const handleMaxBet = () => {
    if (betInputsLocked) return;
    handleBetAmountChange(balance.toFixed(2));
  };

  const handleCashoutChange = (delta: number) => {
    if (betInputsLocked) return;
    const newValue = Math.max(1.01, cashoutMultiplier + delta);
    onCashoutChange(parseFloat(newValue.toFixed(2)));
  };

  const totalPlayers = players.length;
  const totalBetPool = players.reduce((sum, p) => sum + p.betAmount, 0);

  return (
    <div className="h-full flex flex-col game-panel-bg rounded-xl p-5 md:p-6">
      {/* Mode Selector */}
      <Tabs
        value={betMode}
        onValueChange={(value) => setBetMode(value as BetMode)}
        className="mb-6 items-center justify-center"
      >
        <TabsList className="tab-container w-full h-full flex flex-row gap-1">
          <TabsTrigger value="manual" className="tab-trigger retro-text">
            Manual
          </TabsTrigger>
          <TabsTrigger value="auto" className="tab-trigger retro-text">
            Auto
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bet Amount */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-300 retro-label">Bet Amount</label>
          <div className="flex items-center gap-1 text-xs text-[#6B6B6B] retro-body">
            <span>[</span>
            <span className="text-white">${balance.toFixed(1)}</span>
            <span>]</span>
          </div>
        </div>
        <div className="relative">
          <input
            type="number"
            value={betAmount}
            onChange={(e) => handleBetAmountChange(e.target.value)}
            disabled={betInputsLocked}
            className={`w-full bet-input text-white rounded-lg px-4 py-3 text-lg font-medium retro-body ${betInputsLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="0.00"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={() => handleMultiplyBet(0.5)}
              disabled={betInputsLocked}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background: "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
                opacity: betInputsLocked ? 0.4 : 1,
                cursor: betInputsLocked ? 'not-allowed' : 'pointer',
              }}
            >
              1/2
            </button>
            <button
              onClick={() => handleMultiplyBet(2)}
              disabled={betInputsLocked}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
                opacity: betInputsLocked ? 0.4 : 1,
                cursor: betInputsLocked ? 'not-allowed' : 'pointer',
              }}
            >
              2×
            </button>
            <button
              onClick={handleMaxBet}
              disabled={betInputsLocked}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
                opacity: betInputsLocked ? 0.4 : 1,
                cursor: betInputsLocked ? 'not-allowed' : 'pointer',
              }}
            >
              MAX
            </button>
          </div>
        </div>
      </div>

      {/* Cashout At */}
      <div className="mb-4">
        <label className="text-gray-300 retro-label mb-2 block">
          Cashout At
        </label>
        <div className="flex relative">
          <input
            type="text"
            value={cashoutMultiplier.toFixed(2)}
            readOnly
            className="w-full bet-input text-white rounded-lg px-4 py-3 text-lg font-medium focus:outline-none retro-body"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-row gap-0.5">
            <button
              onClick={() => handleCashoutChange(-0.1)}
              disabled={betInputsLocked}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
                opacity: betInputsLocked ? 0.4 : 1,
                cursor: betInputsLocked ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleCashoutChange(0.1)}
              disabled={betInputsLocked}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
                opacity: betInputsLocked ? 0.4 : 1,
                cursor: betInputsLocked ? 'not-allowed' : 'pointer',
              }}
            >
              <ChevronUp className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Estimated Profit */}
      <div className="mb-5">
        <label className="text-gray-300 retro-label mb-2 block">
          Estimated Profit
        </label>
        <div className="relative">
          <input
            type="text"
            value={estimatedProfit}
            readOnly
            className="w-full profit-input text-white rounded-lg px-4 py-3 text-lg font-medium focus:outline-none retro-body"
          />
          <Image
            src="/solana.svg"
            alt="Coin"
            width={20}
            height={20}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
          />
        </div>
      </div>

      {/* Place Bet / Cashout Button */}
      {gameStatus === GAME_STATES.InProgress && betPlaced && !cashedOut ? (
        <button
          onClick={() => {
            if (onCashout && isAuthenticated) {
              onCashout();
            }
          }}
          disabled={!isAuthenticated}
          className="w-full retro-text text-lg mb-4 px-6 py-3 text-white rounded-lg transition-all duration-150"
          style={{
            background:
              "radial-gradient(87.05% 70.83% at 50% 70.83%, #18FFAA 55.29%, #01764D 100%)",
            border: "1.8px solid #01764D",
            boxShadow: "0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset",
            opacity: !isAuthenticated ? 0.4 : 1,
            cursor: !isAuthenticated ? 'not-allowed' : 'pointer',
          }}
        >
          CASHOUT
        </button>
      ) : gameStatus === GAME_STATES.InProgress && betPlaced && cashedOut ? (
        <button
          disabled={true}
          className="w-full retro-text text-lg mb-4 px-6 py-3 text-white rounded-lg transition-all duration-150"
          style={{
            background:
              "radial-gradient(87.05% 70.83% at 50% 70.83%, #525252 55.29%, #171717 100%)",
            border: "1.8px solid #232323",
            boxShadow: "0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset",
            opacity: 0.4,
            cursor: 'not-allowed',
          }}
        >
          CASHED OUT
        </button>
      ) : betMode === 'auto' ? (
        <button
          disabled={!betAmount || parseFloat(betAmount) <= 0 || !isAuthenticated || parseFloat(betAmount) > balance}
          onClick={() => {
            if (autoModeActive) {
              // Stop auto mode
              setAutoModeActive(false);
            } else {
              // Start auto mode
              setAutoModeActive(true);
              // Place first bet if not in progress
              if (onBetAmountChange && parseFloat(betAmount) > 0 && gameStatus !== GAME_STATES.InProgress && isAuthenticated) {
                onBetAmountChange(parseFloat(betAmount));
              }
            }
          }}
          className="w-full retro-text text-lg mb-4 px-6 py-3 text-white rounded-lg transition-all duration-150"
          style={{
            background: autoModeActive
              ? "radial-gradient(87.05% 70.83% at 50% 70.83%, #DC2626 55.29%, #991B1B 100%)"
              : "radial-gradient(87.05% 70.83% at 50% 70.83%, #18FFAA 55.29%, #01764D 100%)",
            border: autoModeActive ? "1.8px solid #991B1B" : "1.8px solid #01764D",
            boxShadow: "0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset",
            opacity: !betAmount || parseFloat(betAmount) <= 0 || !isAuthenticated || parseFloat(betAmount) > balance ? 0.4 : 1,
            cursor: !betAmount || parseFloat(betAmount) <= 0 || !isAuthenticated || parseFloat(betAmount) > balance ? 'not-allowed' : 'pointer',
          }}
        >
          {!isAuthenticated ? 'CONNECTING...' : autoModeActive ? 'STOP AUTO' : 'START AUTO'}
        </button>
      ) : (
        <button
          disabled={
            !betAmount ||
            parseFloat(betAmount) <= 0 ||
            betPlaced ||
            gameStatus !== GAME_STATES.Starting || // Only allow during Starting (betting phase)
            !isAuthenticated ||
            parseFloat(betAmount) > balance
          }
          onClick={() => {
            if (onBetAmountChange && parseFloat(betAmount) > 0 && !betPlaced && gameStatus === GAME_STATES.Starting && isAuthenticated) {
              console.log('🎯 Bet button clicked - placing bet:', parseFloat(betAmount));
              onBetAmountChange(parseFloat(betAmount));
            }
          }}
          className="w-full retro-text text-lg mb-4 px-6 py-3 text-white rounded-lg transition-all duration-150"
          style={{
            background:
              "radial-gradient(87.05% 70.83% at 50% 70.83%, #FFC83E 55.29%, #F38A00 100%)",
            border: "1.8px solid #BB5700",
            boxShadow: "0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset",
            opacity: !betAmount || parseFloat(betAmount) <= 0 || betPlaced || gameStatus !== GAME_STATES.Starting || !isAuthenticated || parseFloat(betAmount) > balance ? 0.4 : 1,
            cursor: !betAmount || parseFloat(betAmount) <= 0 || betPlaced || gameStatus !== GAME_STATES.Starting || !isAuthenticated || parseFloat(betAmount) > balance ? 'not-allowed' : 'pointer',
          }}
        >
          {!isAuthenticated
            ? 'CONNECTING...'
            : gameStatus === GAME_STATES.InProgress
              ? 'GAME IN PROGRESS'
              : gameStatus === GAME_STATES.Over
                ? 'WAITING FOR NEXT ROUND'
                : betPlaced
                  ? 'BET PLACED'
                  : 'PLACE BET'}
        </button>
      )}

      {/* Dashed Separator */}
      <div className="custom-dashed-border mb-4" />

      {/* Players List - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <PlayersList
          players={players.map(p => ({
            id: p.playerID,
            username: p.username || 'Anonymous',
            avatar: p.avatar || '',
            betAmount: p.betAmount,
            status: p.status === 1 ? 'IN-PLAY' : p.status === 2 ? 'CASHED' : 'BUST',
            profit: p.winningAmount ? p.winningAmount - p.betAmount : undefined,
            currentMultiplier: p.status === 1 ? undefined : p.stoppedAt,
          }))}
          totalPlayers={totalPlayers}
          totalBetPool={totalBetPool}
        />
      </div>
    </div>
  );
}
