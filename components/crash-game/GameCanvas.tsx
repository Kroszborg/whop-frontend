'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';

export const GAME_STATES = {
  NotStarted: 1,
  Starting: 2,
  InProgress: 3,
  Over: 4,
};

// Explosion sprite animation class
class BoomSpriteFrame {
  image: HTMLImageElement;
  count: number;
  frame: number;
  x: number;
  y: number;
  loop: boolean;
  width: number;
  height: number;
  time: number;
  elapsed: number;
  active: boolean;
  w: number;

  constructor({ explosionImage, x, y, scale }: { explosionImage: HTMLImageElement, x: number, y: number, scale: number }) {
    this.image = explosionImage;
    this.count = 14; // Total frames in sprite sheet
    this.frame = 0;
    this.x = x;
    this.y = y;
    this.loop = false;
    this.width = explosionImage.width;
    this.height = explosionImage.height / this.count;
    this.time = 800; // Animation duration
    this.elapsed = Date.now();
    this.active = true;
    this.w = 50 * scale;
  }

  show(ctx: CanvasRenderingContext2D) {
    if (!this.active && !this.loop) return;

    const dt = Date.now() - this.elapsed;
    if (dt > this.time) this.active = false;

    if (this.active || this.loop) {
      this.frame = Math.floor((dt / this.time) * this.count);
      if (this.frame >= this.count) {
        if (this.loop) {
          this.frame = 0;
          this.elapsed = Date.now();
        } else {
          this.frame = this.count - 1;
          this.active = false;
        }
      }

      const sy = this.height * this.frame;
      ctx.drawImage(
        this.image,
        0,
        sy,
        this.width,
        this.height,
        this.x - this.w / 2,
        this.y - this.w / 2,
        this.w,
        this.w
      );
    }
  }
}

interface GameCanvasProps {
  betAmount: number;
  onGameStatusChange?: (status: number) => void;
}

export function GameCanvas({ betAmount, onGameStatusChange }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketImageRef = useRef<HTMLImageElement | null>(null);
  const explosionImageRef = useRef<HTMLImageElement | null>(null);

  const [gameStatus, setGameStatus] = useState(GAME_STATES.NotStarted);
  const [payout, setPayout] = useState(0.0); // Start from 0.00x
  const [crashPoint, setCrashPoint] = useState(2.5);
  const [startTime, setStartTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(20);

  // Game state
  const gameStateRef = useRef({
    particles: [] as BoomSpriteFrame[],
    stars: [] as { x: number, y: number, size: number, t: number }[],
    crashX: 0,
    crashY: 0,
    rocketX: 0,
    rocketY: 0,
    rotation: 0,
  });

  // Trail history
  const trailRef = useRef<{x: number, y: number}[]>([]);

  // Notify parent of game status changes
  useEffect(() => {
    if (onGameStatusChange) {
      onGameStatusChange(gameStatus);
    }
  }, [gameStatus, onGameStatusChange]);

  // Generate random crash point
  const generateCrashPoint = () => {
    const random = Math.random();
    if (random < 0.33) return 1.1 + Math.random() * 1.4; // 1.1-2.5
    if (random < 0.66) return 2.5 + Math.random() * 2.5; // 2.5-5.0
    return 5.0 + Math.random() * 5.0; // 5.0-10.0
  };

  // Load images
  useEffect(() => {
    // Load rocket SVG
    const rocketImg = new window.Image();
    rocketImg.src = '/rocket.svg';
    rocketImg.onload = () => {
      rocketImageRef.current = rocketImg;
    };

    // Create explosion sprite sheet
    const explosionCanvas = document.createElement('canvas');
    explosionCanvas.width = 100;
    explosionCanvas.height = 1400; // 14 frames * 100px
    const explosionCtx = explosionCanvas.getContext('2d');
    if (explosionCtx) {
      for (let i = 0; i < 14; i++) {
        const y = i * 100 + 50;
        const radius = 20 + i * 3;
        const gradient = explosionCtx.createRadialGradient(50, y, 0, 50, y, radius);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        explosionCtx.fillStyle = gradient;
        explosionCtx.fillRect(0, i * 100, 100, 100);
      }
    }
    const explosionImg = new window.Image();
    explosionImg.src = explosionCanvas.toDataURL();
    explosionImg.onload = () => {
      explosionImageRef.current = explosionImg;
    };
  }, []);

  // Game state machine
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameStatus === GAME_STATES.NotStarted) {
      // Start the game after a brief moment
      setTimeout(() => {
        setGameStatus(GAME_STATES.Starting);
        setStartTime(Date.now() + 20000); // 20 seconds from now
        setCountdown(20);
      }, 1000);
    } else if (gameStatus === GAME_STATES.Starting) {
      // Countdown timer
      interval = setInterval(() => {
        const timeLeft = Math.max(0, (startTime - Date.now()) / 1000);
        setCountdown(Math.ceil(timeLeft));

        if (timeLeft <= 0) {
          setGameStatus(GAME_STATES.InProgress);
          setStartTime(Date.now());
          setCrashPoint(generateCrashPoint());
          setPayout(0.0); // Start from 0.00x
          trailRef.current = []; // Reset trail
        }
      }, 100);
    } else if (gameStatus === GAME_STATES.InProgress) {
      // Game loop - smooth payout increment
      interval = setInterval(() => {
        setPayout(prev => {
          const next = prev + 0.01; // Increment speed

          if (next >= crashPoint) {
            setGameStatus(GAME_STATES.Over);
            return crashPoint; // Set to crash point
          }

          return next;
        });
      }, 30); // 30ms for smooth updates
    } else if (gameStatus === GAME_STATES.Over) {
      // Wait 3 seconds then restart
      setTimeout(() => {
        setGameStatus(GAME_STATES.Starting);
        setStartTime(Date.now() + 20000);
        setCountdown(20);
        setPayout(0.0); // Reset to 0.00x

        // Reset game state
        gameStateRef.current = {
          particles: [],
          stars: [],
          crashX: 0,
          crashY: 0,
          rocketX: 0,
          rocketY: 0,
          rotation: 0,
        };
        trailRef.current = [];
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus, startTime, crashPoint]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let animationFrameId: number;

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = canvas.width;
      const height = canvas.height;
      const padding = 60;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate dynamic max value for Y-axis (smooth scaling)
      const maxValue = Math.max(6, payout + 1);

      // Calculate rocket Y position directly from payout to match Y-axis
      // Map payout value (0.0x to maxValue) to Y position (bottom to top)
      const payoutRange = maxValue; // Range from 0.0x to maxValue
      const progress = payout / payoutRange; // 0 to 1 (0.0x = 0, maxValue = 1)

      // Calculate Y position - rocket should be at exact Y-axis label position
      const startY = height - padding; // Bottom (0.0x position)
      const endY = padding; // Top (maxValue position)
      const rocketY = startY - (progress * (startY - endY)); // Linear mapping from bottom to top

      // Calculate X position along parabolic curve for visual effect
      const startX = 100;
      const endX = width - 150;
      const controlX = width / 2;

      // Use quadratic easing for X position to create parabolic visual
      const t = Math.min(progress, 1);
      const rocketX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;

      // Calculate rotation based on movement direction
      // For smooth rotation, we need to look at the derivative of our curve
      const derivativeX = 2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX);
      const derivativeY = -(startY - endY) / payoutRange; // Negative because Y decreases as we go up
      const rotation = Math.atan2(derivativeY * (progress + 0.1), derivativeX);

      // Store rocket position for explosion
      gameStateRef.current.rocketX = rocketX;
      gameStateRef.current.rocketY = rocketY;
      gameStateRef.current.rotation = rotation;

      // Generate and draw stars only during active gameplay
     

      // Add current position to trail during flight
      if (gameStatus === GAME_STATES.InProgress) {
        trailRef.current.push({ x: rocketX, y: rocketY });
        // Don't limit trail length - let it grow from start to current position
      }

      // Draw trail during gameplay and after crash (to show full trail path)
      if (trailRef.current.length > 1 && (gameStatus === GAME_STATES.InProgress || gameStatus === GAME_STATES.Over)) {
        const trailStart = trailRef.current[0];
        const trailEnd = trailRef.current[trailRef.current.length - 1];

        // Trail glow
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 202, 21, 0.3)';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.filter = 'blur(8px)';
        ctx.beginPath();
        ctx.moveTo(trailStart.x, trailStart.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Main trail with gradient from start to end
        const gradient = ctx.createLinearGradient(
          trailStart.x,
          trailStart.y,
          trailEnd.x,
          trailEnd.y
        );
        gradient.addColorStop(0, 'rgba(110, 170, 206, 0.3)');
        gradient.addColorStop(0.5, 'rgba(250, 202, 21, 0.8)');
        gradient.addColorStop(1, '#FFC83E');

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(trailStart.x, trailStart.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Inner bright core
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(trailStart.x, trailStart.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Draw rocket or explosion
      if (gameStatus === GAME_STATES.InProgress) {
        // Only show rocket during active gameplay
        if (rocketImageRef.current) {
          const rocketSize = 70;

          ctx.save();
          ctx.translate(gameStateRef.current.rocketX, gameStateRef.current.rocketY);
          ctx.rotate(gameStateRef.current.rotation);

          // Rocket glow effect
          ctx.shadowColor = 'rgba(255, 200, 62, 0.6)';
          ctx.shadowBlur = 20;

          ctx.drawImage(
            rocketImageRef.current,
            -rocketSize / 2,
            -rocketSize / 2,
            rocketSize,
            rocketSize
          );
          ctx.restore();
        }
      } else if (gameStatus === GAME_STATES.Over) {
        // Generate explosion on crash
        if (gameStateRef.current.particles.length === 0 && explosionImageRef.current) {
          gameStateRef.current.particles.push(
            new BoomSpriteFrame({
              explosionImage: explosionImageRef.current,
              x: gameStateRef.current.rocketX,
              y: gameStateRef.current.rocketY,
              scale: 2
            })
          );
        }

        // Draw explosion
        ctx.save();
        gameStateRef.current.particles.forEach((p, index) => {
          p.show(ctx);
          if (!p.active) {
            gameStateRef.current.particles.splice(index, 1);
          }
        });
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStatus, payout]);

  // Generate dynamic Y-axis values based on current payout
  const generateYAxisValues = () => {
    // Smooth scaling - always show current payout + buffer
    const maxValue = Math.max(6, payout + 1);

    const values = [];

    // Generate values with 0.5x increments starting from 0.00x
    const numSteps = Math.floor(maxValue * 2); // 0.5x increments
    for (let i = 0; i <= numSteps; i++) { // Start from i=0 to get 0.0x
      const value = i * 0.5;
      let size = 'text-xs';

      // Make certain values more prominent
      if (value % 2 === 0 && value > 0) {
        size = 'text-sm font-semibold';
      } else if (value % 1 === 0) {
        size = 'text-xs font-medium';
      }

      values.push({ value, size });
    }

    return values.reverse(); // Reverse so highest is at top
  };

  const yAxisValues = generateYAxisValues();

  return (
    <div className="relative h-full game-panel-bg rounded-xl overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
            linear-gradient(to right, rgba(100, 100, 100, 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 100, 100, 0.5) 1px, transparent 1px)
          `,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      {/* Y-Axis Labels */}
      <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-between py-6 text-gray-500 font-medium z-10">
        {yAxisValues.map((item) => (
          <div key={item.value} className={item.size}>
            {item.value.toFixed(1)}x
          </div>
        ))}
      </div>

      {/* Crash Red Overlay */}
      {gameStatus === GAME_STATES.Over && (
        <div
          className="absolute inset-0 z-30 pointer-events-none animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0) 70%)",
            animation: "crash-flash 0.5s ease-out",
          }}
        />
      )}

      {/* Current Payout Display */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center z-20 pointer-events-none">
        {gameStatus === GAME_STATES.Starting ||
        gameStatus === GAME_STATES.NotStarted ? (
          <>
            <div className="text-white retro-label mb-2 tracking-wider">
              STARTING IN
            </div>
            <div
              className="text-white text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-2 retro-text"
              style={{
                fontSize: "5rem",
                lineHeight: "100%",
                WebkitTextStroke: "2px #000000",
                textShadow: "2px 4px 0px #000000",
              }}
            >
              {countdown > 0 ? countdown : "0"}s
            </div>
          </>
        ) : (
          <>
            <div className="text-white retro-label mb-2 tracking-wider">
              {gameStatus === GAME_STATES.Over ? "CRASHED!" : "CURRENT PAYOUT"}
            </div>
            <div
              className={`text-white text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-2 retro-text ${
                gameStatus === GAME_STATES.Over ? "text-red-500" : ""
              }`}
              style={{
                fontSize: "5rem",
                lineHeight: "100%",
                WebkitTextStroke:
                  gameStatus === GAME_STATES.Over
                    ? "2px #991b1b"
                    : "2px #000000",
                textShadow:
                  gameStatus === GAME_STATES.Over
                    ? "2px 4px 0px #991b1b, 0 0 20px rgba(220, 38, 38, 0.8)"
                    : "2px 4px 0px #000000",
              }}
            >
              {payout.toFixed(2)}x
            </div>
            {/* Show profit if bet is placed and payout >= 1.0x */}
            {betAmount > 0 && gameStatus === GAME_STATES.InProgress && payout >= 1.0 && (
              <div className="text-[#0AFDA5] retro-body text-xl md:text-2xl font-semibold mt-2 flex flex-row items-center gap-2 justify-center">
                  <Image
                    src="/solana.svg"
                    alt="Coin"
                    width={20}
                    height={20}
                    className="text-gray-500"
                  />{" "}
                  +{(betAmount * (payout - 1)).toFixed(4)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Canvas for game rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 5 }}
      />

      <style jsx>{`
        @keyframes crash-flash {
          0% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
