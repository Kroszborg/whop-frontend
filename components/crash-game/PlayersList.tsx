'use client';

import { Player } from '@/types/game';
import { getPlayerAvatar } from '@/lib/dummy-data';
import { Coins, Users } from 'lucide-react';
import Image from 'next/image';

interface PlayersListProps {
  players: Player[];
  totalPlayers: number;
  totalBetPool: number;
}

export function PlayersList({ players, totalPlayers, totalBetPool }: PlayersListProps) {
  return (
    <div className="h-full flex flex-col space-y-3">
      <div className="flex items-center justify-between text-gray-400 px-1 flex-shrink-0 retro-body">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <Users className="fill-[#6B6B6B] w-3.5 h-3.5" />
            <span>{totalPlayers} playing</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Image src="/solana.svg" alt="Coin" width={16} height={16} className="w-4 h-4" />
          <span className='text-white'>{totalBetPool.toFixed(4)}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-1">
        {players.map((player) => (
          <PlayerItem key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
}

function PlayerItem({ player }: { player: Player }) {
  const avatarColor = getPlayerAvatar(player.username);
  const statusColors = {
    "IN-PLAY":
      "bg-gradient-to-r from-[#FFFFFF] to-[#999999] bg-clip-text text-transparent",
    CASHED:
      "bg-gradient-to-r from-[#18FFAA] to-[#01764D] bg-clip-text text-transparent",
    BUST:
      "bg-gradient-to-r from-[#EF4444] to-[#B91C1C] bg-clip-text text-transparent",
  };

  return (
    <div className="flex items-center justify-between p-2 player-card-retro rounded-lg hover:bg-gray-800/30 transition-colors">
      <div className="flex items-center gap-2.5 flex-1">
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: avatarColor }}
        >
          {player.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-white retro-body">{player.username}</span>
          <div className="flex items-center gap-1 text-xs">
            <Image
              src="/solana.svg"
              alt="Coin"
              width={16}
              height={16}
              className="w-4 h-4"
            />
            <span className="text-gray-400 retro-body">
              {player.betAmount.toFixed(4)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span
          className={`px-2 py-1 rounded text-sm font-bold ${
            statusColors[player.status]
          }`}
        >
          {player.status}
        </span>
        {player.status === "CASHED" && player.profit !== undefined && (
          <div className="flex items-center gap-1">
            <Image src="/solana.svg" alt="Coin" width={16} height={16} className="w-4 h-4" />
            <span className="text-xs text-green-400 retro-body font-bold">
              +{player.profit.toFixed(4)}
            </span>
          </div>
        )}
        {player.status === "IN-PLAY" && player.currentMultiplier && (
          <span className="text-xs text-yellow-400 retro-body font-bold">
            {player.currentMultiplier.toFixed(2)}x
          </span>
        )}
      </div>
    </div>
  );
}
