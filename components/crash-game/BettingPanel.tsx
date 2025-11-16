'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { BetMode } from '@/types/game';
import { PlayersList } from './PlayersList';
import { dummyPlayers } from '@/lib/dummy-data';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GAME_STATES } from './GameCanvas';

interface BettingPanelProps {
  cashoutMultiplier: number;
  onCashoutChange: (value: number) => void;
  onBetAmountChange?: (value: number) => void;
  betPlaced?: boolean;
  gameStatus?: number;
}

export function BettingPanel({ cashoutMultiplier, onCashoutChange, onBetAmountChange, betPlaced = false, gameStatus }: BettingPanelProps) {
  const [betMode, setBetMode] = useState<BetMode>('manual');
  const [betAmount, setBetAmount] = useState<string>('0.00');
  const [estimatedProfit, setEstimatedProfit] = useState<string>('0.00');
  const [balance] = useState<number>(43.8);

  useEffect(() => {
    if (parseFloat(betAmount) > 0) {
      const profit = parseFloat(betAmount) * cashoutMultiplier - parseFloat(betAmount);
      setEstimatedProfit(profit.toFixed(2));
    }
  }, [cashoutMultiplier, betAmount]);

  const handleBetAmountChange = (value: string) => {
    setBetAmount(value);
    if (parseFloat(value) > 0) {
      const profit = parseFloat(value) * cashoutMultiplier - parseFloat(value);
      setEstimatedProfit(profit.toFixed(2));
    } else {
      setEstimatedProfit('0.00');
    }
  };

  const handleMultiplyBet = (multiplier: number) => {
    const current = parseFloat(betAmount) || 0;
    handleBetAmountChange((current * multiplier).toFixed(2));
  };

  const handleMaxBet = () => {
    handleBetAmountChange(balance.toFixed(2));
  };

  const handleCashoutChange = (delta: number) => {
    const newValue = Math.max(1.01, cashoutMultiplier + delta);
    onCashoutChange(parseFloat(newValue.toFixed(2)));
  };

  const totalPlayers = dummyPlayers.length;
  const totalBetPool = dummyPlayers.reduce((sum, p) => sum + p.betAmount, 0);

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
            className="w-full bet-input text-white rounded-lg px-4 py-3 text-lg font-medium retro-body "
            placeholder="0.00"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={() => handleMultiplyBet(0.5)}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background: "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
              }}
            >
              1/2
            </button>
            <button
              onClick={() => handleMultiplyBet(2)}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
              }}
            >
              2×
            </button>
            <button
              onClick={handleMaxBet}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
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
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
              }}
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => handleCashoutChange(0.1)}
              className="px-2.5 py-1 text-white text-sm rounded-md retro-body transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background:
                  "radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))",
                border: "1.8px solid #232323",
                boxShadow: "0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset",
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

      {/* Place Bet Button */}
      <button
        disabled={!betAmount || parseFloat(betAmount) <= 0 || betPlaced || gameStatus === GAME_STATES.InProgress}
        onClick={() => {
          if (onBetAmountChange && parseFloat(betAmount) > 0 && !betPlaced && gameStatus !== GAME_STATES.InProgress) {
            onBetAmountChange(parseFloat(betAmount));
          }
        }}
        className="w-full retro-text text-lg mb-4 px-6 py-3 text-white rounded-lg transition-all duration-150"
        style={{
          background:
            "radial-gradient(87.05% 70.83% at 50% 70.83%, #FFC83E 55.29%, #F38A00 100%)",
          border: "1.8px solid #BB5700",
          boxShadow: "0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset",
          opacity: !betAmount || parseFloat(betAmount) <= 0 || betPlaced || gameStatus === GAME_STATES.InProgress ? 0.4 : 1,
          cursor: !betAmount || parseFloat(betAmount) <= 0 || betPlaced || gameStatus === GAME_STATES.InProgress ? 'not-allowed' : 'pointer',
        }}
      >
        {gameStatus === GAME_STATES.InProgress ? 'GAME IN PROGRESS' : betPlaced ? 'BET PLACED' : 'PLACE BET'}
      </button>

      {/* Dashed Separator */}
      <div className="custom-dashed-border mb-4" />

      {/* Players List - Takes remaining space */}
      <div className="flex-1 overflow-hidden">
        <PlayersList
          players={dummyPlayers}
          totalPlayers={totalPlayers}
          totalBetPool={totalBetPool}
        />
      </div>
    </div>
  );
}
