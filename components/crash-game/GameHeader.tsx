'use client';

import Image from 'next/image';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { SignInModal } from '@/components/auth/SignInModal';

interface GameHeaderProps {
  user?: any;
  isAuthenticated?: boolean;
  isConnected?: boolean;
}

export function GameHeader({ user, isAuthenticated, isConnected }: GameHeaderProps) {
  const { signOut, user: authUser } = useAuth();
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [profitPopup, setProfitPopup] = useState<number | null>(null);

  // Close modal when authenticated
  useEffect(() => {
    if (isAuthenticated && showSignInModal) {
      setShowSignInModal(false);
    }
  }, [isAuthenticated, showSignInModal]);

  // Listen for wallet updates with profit info
  useEffect(() => {
    const handleWalletUpdate = (event: CustomEvent) => {
      const { profit } = event.detail;
      if (profit && profit > 0) {
        setProfitPopup(profit);
        // Clear popup after animation
        setTimeout(() => setProfitPopup(null), 2000);
      }
    };

    window.addEventListener('wallet-updated', handleWalletUpdate as EventListener);
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate as EventListener);
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 md:px-8 lg:px-12">
      <div className="flex items-center gap-2">
        <Image
          src="/rocket.png"
          alt="Rocket"
          width={32}
          height={32}
          className="w-6 h-6 md:w-8 md:h-8"
        />
        <h1 className="!text-4xl retro-text !font-normal text-white !tracking-close">
          ROCKET
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated && user && (
          <>
            <div className="flex items-center gap-3 text-white retro-body relative">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg relative">
                <User className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Balance</span>
                  <div className="flex items-center gap-1">
                    <Image src="/solana.svg" alt="Coin" width={16} height={16} className="w-4 h-4" />
                    <span className="font-semibold">{user.amount.toFixed(4)}</span>
                  </div>
                </div>
                {/* Floating profit popup */}
                {profitPopup !== null && (
                  <div
                    className="absolute -top-12 left-1/2 -translate-x-1/2 text-[#0AFDA5] font-bold text-lg retro-text whitespace-nowrap animate-float-up pointer-events-none"
                    style={{
                      textShadow: '0 0 10px rgba(10, 253, 165, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    +{profitPopup.toFixed(4)}
                  </div>
                )}
              </div>
              {isConnected && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Connected" />
                  <span className="text-xs text-green-400">Live</span>
                </div>
              )}
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg transition-all duration-150 cursor-pointer hover:brightness-110"
              style={{
                background: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #525252 55.29%, #171717 100%)',
                border: '1.8px solid #232323',
              }}
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <span className="px-2 py-0.5 rounded retro-text text-white">
                Sign Out
              </span>
            </button>
          </>
        )}
        {!isAuthenticated && (
          <button
            onClick={() => setShowSignInModal(true)}
            className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg transition-all duration-150 cursor-pointer hover:brightness-110"
            style={{
              background: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #FFC83E 55.29%, #F38A00 100%)',
              border: '1.8px solid #BB5700',
              boxShadow: '0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset'
            }}
          >
            <LogIn
              className="w-4 h-4 md:w-5 md:h-5"
              style={{ fill: '#3D2502', stroke: '#3D2502' }}
            />
            <span className="px-2 py-0.5 rounded retro-text text-white">
              Sign In
            </span>
          </button>
        )}
      </div>
      
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />

      <style jsx>{`
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -30px);
          }
        }

        .animate-float-up {
          animation: float-up 2s ease-out forwards;
        }
      `}</style>
    </header>
  );
}
