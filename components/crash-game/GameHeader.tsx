'use client';

import Image from 'next/image';
import { Wallet } from 'lucide-react';

export function GameHeader() {
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

      <button
        onClick={() => console.log("Connect wallet")}
        className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-lg transition-all duration-150 cursor-pointer"
        style={{
          background: 'radial-gradient(80.22% 65.28% at 50% 76.39%, #FFC83E 55.29%, #F38A00 100%)',
          border: '1.8px solid #BB5700',
          boxShadow: '0px 4.4px 2px 0px rgba(255, 255, 255, 0.33) inset'
        }}
      >
        <Wallet
          className="w-4 h-4 md:w-5 md:h-5"
          style={{ fill: '#3D2502', stroke: '#3D2502' }}
        />
        <span
          className="px-2 py-0.5 rounded retro-text text-white"
        >
          CONNECT
        </span>
      </button>
    </header>
  );
}
