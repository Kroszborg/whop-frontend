'use client';

import { MultiplierBadge } from '@/types/game';

interface MultiplierHistoryProps {
  onMultiplierClick: (value: number) => void;
  history?: Array<{ crash_point: number; id: string }>;
}

export function MultiplierHistory({ onMultiplierClick, history = [] }: MultiplierHistoryProps) {
  // Convert crash history to badge format
  const multiplierHistory: MultiplierBadge[] = history
    .filter((game) => game && game.crash_point != null && Number(game.crash_point) > 0)
    .map((game) => ({
      value: Number(game.crash_point),
      color: getColorForMultiplier(Number(game.crash_point)),
    }));

  // If no history, show empty state or placeholder
  if (multiplierHistory.length === 0) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max px-1 py-1">
            <span className="text-gray-500 text-sm retro-body">No game history yet</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600">
        <div className="flex gap-2 min-w-max px-1 py-1">
          {multiplierHistory.map((badge, index) => (
            <MultiplierBadgeComponent
              key={`${badge.value}-${index}`}
              badge={badge}
              onClick={() => onMultiplierClick(badge.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper function to determine color based on multiplier value
function getColorForMultiplier(value: number): MultiplierBadge['color'] {
  if (value < 1.5) return 'dark'; // Red for low multipliers
  if (value < 2.0) return 'orange';
  if (value < 3.0) return 'yellow';
  if (value < 5.0) return 'green';
  if (value < 10.0) return 'cyan';
  return 'purple'; // Purple for very high multipliers
}

interface MultiplierBadgeComponentProps {
  badge: MultiplierBadge;
  onClick: () => void;
}

function MultiplierBadgeComponent({ badge, onClick }: MultiplierBadgeComponentProps) {
  // Get background gradient based on badge color
  const getBackgroundGradient = (color: MultiplierBadge['color']): string => {
    const gradients = {
      green: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #22C55E 55.29%, #16A34A 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))', // green
      purple: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #A855F7 55.29%, #7C3AED 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))', // purple
      orange: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #FB923C 55.29%, #EA580C 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))', // orange
      dark: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #EF4444 55.29%, #B91C1C 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))', // red
      cyan: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #22D3EE 55.29%, #0891B2 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))', // cyan
      yellow: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #FFC83E 55.29%, #F38A00 100%), linear-gradient(0deg, rgba(0, 0, 0, 0.67), rgba(0, 0, 0, 0.67))', // yellow
    };
    return gradients[color];
  };

  // Get border color based on badge color (lighter version for shadow effect)
  const getBorderColor = (color: MultiplierBadge['color']): string => {
    const colors = {
      green: '#22C55E', // lighter green
      purple: '#A855F7', // lighter purple
      orange: '#FB923C', // lighter orange
      dark: '#EF4444', // lighter red
      cyan: '#22D3EE', // lighter cyan
      yellow: '#FFC83E', // lighter yellow
    };
    return colors[color];
  };

  const backgroundGradient = getBackgroundGradient(badge.color);
  const borderColor = getBorderColor(badge.color);

  return (
    <button
      onClick={onClick}
      className="retro-text text-sm whitespace-nowrap hover:opacity-90 active:opacity-100 transition-all duration-200 hover:-translate-y-0.5 rounded-md px-3 py-1.5 font-medium text-white"
      style={{
        background: backgroundGradient,
        border: `1.8px solid ${borderColor}`,
        boxShadow: '0px 2px 2px 0px rgba(255, 255, 255, 0.25) inset',
      }}
    >
      {badge.value.toFixed(2)}x
    </button>
  );
}
