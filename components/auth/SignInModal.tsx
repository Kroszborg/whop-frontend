'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn } = useAuth();
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!address.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(address.trim());
      console.log('Sign in successful:', result);
      setAddress('');
      // Close modal after successful sign-in
      onClose();
      // Force page refresh to ensure state updates
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign in');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white retro-text">Sign In</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 retro-label">
              Wallet Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white retro-body focus:outline-none focus:border-yellow-500"
              disabled={isLoading}
            />
            <p className="mt-2 text-sm text-gray-400 retro-body">
              Enter your wallet address to sign in. We'll create an account if you don't have one.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm retro-body">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#FFC83E] to-[#F38A00] text-white rounded-lg font-bold retro-text hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

