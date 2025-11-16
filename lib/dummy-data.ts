import { Player, MultiplierBadge } from '@/types/game';

export const dummyPlayers: Player[] = [
  {
    id: '1',
    username: 'MelonUsk',
    avatar: '/avatars/player1.png',
    betAmount: 0.2439,
    status: 'CASHED',
    cashedAt: 2.45,
    profit: 0.3536,
  },
  {
    id: '2',
    username: 'AlliBaba99',
    avatar: '/avatars/player2.png',
    betAmount: 0.1573,
    status: 'BUST',
  },
  {
    id: '3',
    username: 'BeffJezos912',
    avatar: '/avatars/player3.png',
    betAmount: 0.2439,
    status: 'IN-PLAY',
    currentMultiplier: 1.62,
  },
  {
    id: '4',
    username: 'CryptoKing',
    avatar: '/avatars/player4.png',
    betAmount: 0.5000,
    status: 'CASHED',
    cashedAt: 3.21,
    profit: 1.1050,
  },
  {
    id: '5',
    username: 'MoonLambo',
    avatar: '/avatars/player5.png',
    betAmount: 0.3250,
    status: 'IN-PLAY',
    currentMultiplier: 1.62,
  },
];

export const multiplierHistory: MultiplierBadge[] = [
  { value: 1.89, color: 'dark' },
  { value: 4.1, color: 'yellow' },
  { value: 2.22, color: 'purple' },
  { value: 1.12, color: 'dark' },
  { value: 1.05, color: 'dark' },
  { value: 4.99, color: 'yellow' },
  { value: 3.21, color: 'orange' },
  { value: 1.12, color: 'dark' },
  { value: 2.95, color: 'purple' },
  { value: 4.53, color: 'yellow' },
  { value: 1.92, color: 'dark' },
  { value: 1.01, color: 'dark' },
  { value: 1.99, color: 'dark' },
  { value: 2.0, color: 'purple' },
  { value: 5.42, color: 'green' },
  { value: 3.67, color: 'orange' },
  { value: 2.13, color: 'purple' },
  { value: 1.58, color: 'dark' },
];

export const getMultiplierColor = (color: MultiplierBadge['color']): string => {
  const colors = {
    green: 'bg-green-600 text-white', // 5.0x+ Excellent
    purple: 'bg-purple-600 text-white', // 2.0x-3.0x Medium
    orange: 'bg-orange-500 text-white', // 3.0x-4.0x Good
    dark: 'bg-red-600 text-white', // <2.0x Low/Crash
    cyan: 'bg-cyan-500 text-white', // Alternative
    yellow: 'bg-yellow-500 text-black', // 4.0x-5.0x Very Good
  };
  return colors[color];
};

export const getRetroButtonVariant = (color: MultiplierBadge['color']): 'yellow' | 'orange' | 'green' | 'purple' | 'blue' | 'red' => {
  const variantMap = {
    green: 'green' as const,
    purple: 'purple' as const,
    orange: 'orange' as const,
    dark: 'red' as const,
    cyan: 'blue' as const,
    yellow: 'yellow' as const,
  };
  return variantMap[color];
};

// Auto-assign color based on multiplier value (for crash game theme)
export const getColorFromMultiplier = (value: number): MultiplierBadge['color'] => {
  if (value < 2.0) return 'dark'; // Red - Low/Crash
  if (value < 3.0) return 'purple'; // Purple - Medium
  if (value < 4.0) return 'orange'; // Orange - Good
  if (value < 5.0) return 'yellow'; // Yellow - Very Good
  return 'green'; // Green - Excellent
};

export const getPlayerAvatar = (username: string): string => {
  // Generate a simple gradient background based on username
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};
