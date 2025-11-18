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
  multiplier?: number;
  crashPoint?: number | null;
  isAuthenticated?: boolean;
  gameStatus?: number; // Pass game status from parent when using Socket.IO
  socketCountdown?: number; // Countdown from Socket.IO
  cashedOut?: boolean;
}

export function GameCanvas({ betAmount, onGameStatusChange, multiplier, crashPoint, isAuthenticated, gameStatus: parentGameStatus, socketCountdown, cashedOut }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rocketImageRef = useRef<HTMLImageElement | null>(null);
  const explosionImageRef = useRef<HTMLImageElement | null>(null);

  // Use parent gameStatus if provided (Socket.IO), otherwise use local state
  const [localGameStatus, setLocalGameStatus] = useState(GAME_STATES.NotStarted);
  const gameStatus = parentGameStatus !== undefined ? parentGameStatus : localGameStatus;

  const [payout, setPayout] = useState(1.0); // Start from 1.00x
  const [startTime, setStartTime] = useState(Date.now());
  const [countdown, setCountdown] = useState(10);

  // Use Socket.IO multiplier if available, otherwise use local state
  const currentMultiplier = multiplier !== undefined && multiplier >= 1.0 ? multiplier : payout;
  const currentCrashPoint = crashPoint !== null && crashPoint !== undefined ? crashPoint : 2.5;

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

  // Sync multiplier from Socket.IO
  useEffect(() => {
    if (multiplier !== undefined && multiplier >= 1.0) {
      setPayout(multiplier);
    }
  }, [multiplier]);

  // Sync countdown from Socket.IO
  useEffect(() => {
    if (socketCountdown !== undefined && gameStatus === GAME_STATES.Starting) {
      setCountdown(socketCountdown);
    }
  }, [socketCountdown, gameStatus]);

  // Sync game status from parent (which comes from Socket.IO)
  // When using Socket.IO, gameStatus prop should be passed from parent
  // This effect only notifies parent of local state changes (fallback mode)
  useEffect(() => {
    if (onGameStatusChange && multiplier === undefined) {
      // Only notify if not using Socket.IO (fallback mode)
      onGameStatusChange(gameStatus);
    }
  }, [gameStatus, onGameStatusChange, multiplier]);

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

  // Clear trail and reset game state when transitioning to Starting phase
  useEffect(() => {
    if (gameStatus === GAME_STATES.Starting) {
      // COMPLETELY CLEAR TRAIL
      trailRef.current = [];
      gameStateRef.current.particles = [];
      gameStateRef.current.rocketX = 0;
      gameStateRef.current.rocketY = 0;
      setPayout(1.0);
      console.log('TRAIL CLEARED - New game starting');
    } else if (gameStatus === GAME_STATES.Over) {
      // Game ended - freeze trail at crash position
      console.log('Game crashed - trail frozen at', trailRef.current.length, 'points');
    }
  }, [gameStatus]);

  // Game state machine - sync with Socket.IO or use local fallback
  useEffect(() => {
    let interval: NodeJS.Timeout;

    // If using Socket.IO, sync with parent gameStatus prop
    // Otherwise use local state machine
    if (multiplier !== undefined) {
      // Using Socket.IO - sync status from parent
      // Trail will be managed in the draw loop
    } else {
      // Fallback: Local game state machine (for testing without Socket.IO)
      if (localGameStatus === GAME_STATES.NotStarted) {
        setTimeout(() => {
          setLocalGameStatus(GAME_STATES.Starting);
          setStartTime(Date.now() + 20000);
          setCountdown(20);
        }, 1000);
      } else if (localGameStatus === GAME_STATES.Starting) {
        interval = setInterval(() => {
          const timeLeft = Math.max(0, (startTime - Date.now()) / 1000);
          setCountdown(Math.ceil(timeLeft));

          if (timeLeft <= 0) {
            setLocalGameStatus(GAME_STATES.InProgress);
            setStartTime(Date.now());
            setPayout(1.0);
            trailRef.current = [];
          }
        }, 100);
      } else if (localGameStatus === GAME_STATES.InProgress) {
        interval = setInterval(() => {
          setPayout(prev => {
            const next = prev + 0.01;
            if (next >= currentCrashPoint) {
              setLocalGameStatus(GAME_STATES.Over);
              return currentCrashPoint;
            }
            return next;
          });
        }, 30);
      } else if (localGameStatus === GAME_STATES.Over) {
        setTimeout(() => {
          setLocalGameStatus(GAME_STATES.Starting);
          setStartTime(Date.now() + 20000);
          setCountdown(20);
          setPayout(1.0);
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
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus, localGameStatus, startTime, currentCrashPoint, multiplier]);

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

      // Clear canvas completely
      ctx.clearRect(0, 0, width, height);

      // If game is starting or not started, don't draw anything (clear state)
      if (gameStatus === GAME_STATES.Starting || gameStatus === GAME_STATES.NotStarted) {
        // Canvas is cleared - no trail, no rocket
        return;
      }

      // Calculate dynamic max value for Y-axis (smooth scaling)
      const maxValue = Math.max(6, currentMultiplier + 1);

      // Calculate rocket Y position directly from multiplier to match Y-axis
      // Map multiplier value (1.0x to maxValue) to Y position (bottom to top)
      const payoutRange = maxValue - 1.0; // Range from 1.0x to maxValue
      const progress = (currentMultiplier - 1.0) / payoutRange; // 0 to 1 (1.0x = 0, maxValue = 1)

      // Calculate Y position - rocket should be at exact Y-axis label position
      const startY = height - padding; // Bottom (1.0x position)
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

      // DRAW TRAIL FIRST (so it appears BEHIND the rocket)
      // Only draw trail during game or after crash
      if ((gameStatus === GAME_STATES.InProgress || gameStatus === GAME_STATES.Over) && trailRef.current.length > 1) {
        const trailStart = trailRef.current[0];
        const trailEnd = trailRef.current[trailRef.current.length - 1];

        // Outer glow (thickest layer)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 200, 62, 0.4)';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.filter = 'blur(10px)';
        ctx.beginPath();
        ctx.moveTo(trailStart.x, trailStart.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Middle glow
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 202, 21, 0.6)';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.filter = 'blur(5px)';
        ctx.beginPath();
        ctx.moveTo(trailStart.x, trailStart.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Main trail with gradient (thick)
        const gradient = ctx.createLinearGradient(
          trailStart.x,
          trailStart.y,
          trailEnd.x,
          trailEnd.y
        );
        gradient.addColorStop(0, 'rgba(110, 170, 206, 0.5)');
        gradient.addColorStop(0.5, 'rgba(250, 202, 21, 0.9)');
        gradient.addColorStop(1, '#FFC83E');

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(trailStart.x, trailStart.y);
        for (let i = 1; i < trailRef.current.length; i++) {
          ctx.lineTo(trailRef.current[i].x, trailRef.current[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Inner bright core (white)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
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

      // Add current position to trail ONLY during flight (not after crash or before start)
      if (gameStatus === GAME_STATES.InProgress && currentMultiplier >= 1.0) {
        // Add every point - no distance filtering for smooth trail
        trailRef.current.push({ x: rocketX, y: rocketY });

        // Keep trail longer for visibility at high multipliers (1500 points)
        // This ensures trail is visible even at 20x+ multipliers
        if (trailRef.current.length > 1500) {
          trailRef.current.shift();
        }
      }

      // DRAW ROCKET SECOND (so it appears ON TOP of trail)
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
  }, [gameStatus, currentMultiplier, multiplier, currentCrashPoint]);

  // Generate dynamic Y-axis values based on current multiplier
  const generateYAxisValues = () => {
    // Smooth scaling - always show current multiplier + buffer
    const maxValue = Math.max(6, currentMultiplier + 1);

    const values = [];

    // Generate values with 0.5x increments starting from 1.00x
    const numSteps = Math.floor((maxValue - 1.0) * 2); // 0.5x increments
    for (let i = 0; i <= numSteps; i++) {
      const value = 1.0 + (i * 0.5);
      let size = 'text-xs';

      // Make certain values more prominent
      if (value % 2 === 0) {
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
              {currentMultiplier.toFixed(2)}x
            </div>
            {/* Show profit if bet is placed and multiplier >= 1.0x */}
            {betAmount > 0 && gameStatus === GAME_STATES.InProgress && currentMultiplier >= 1.0 && !cashedOut && (
              <div className="text-[#0AFDA5] retro-body text-xl md:text-2xl font-semibold mt-2 flex flex-row items-center gap-2 justify-center">
                  <Image
                    src="/solana.svg"
                    alt="Coin"
                    width={20}
                    height={20}
                    className="text-gray-500"
                  />{" "}
                  +{(betAmount * (currentMultiplier - 1)).toFixed(4)}
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
