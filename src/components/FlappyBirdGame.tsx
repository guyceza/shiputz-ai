"use client";

import { useRef, useEffect, useState, useCallback } from "react";

/**
 * Mini Flappy Bird game for loading screens
 * Ultra-lightweight: pure canvas, no dependencies, ~3KB
 * EASY MODE - meant to be fun while waiting, not frustrating
 */

const CANVAS_W = 280;
const CANVAS_H = 200;
const BIRD_SIZE = 14;
const PIPE_WIDTH = 30;
const PIPE_GAP = 110; // Very wide gap - easy to pass
const GRAVITY = 0.22; // Gentle gravity
const JUMP_FORCE = -4.2; // Soft jump
const PIPE_SPEED = 1.2; // Slow pipes
const PIPE_INTERVAL = 160; // More space between pipes

interface Pipe {
  x: number;
  topH: number;
  scored: boolean;
}

interface FlappyBirdGameProps {
  isReady?: boolean; // When true, show "result ready" banner
  onShowResult?: () => void; // Callback when user clicks to see result
}

export default function FlappyBirdGame({ isReady, onShowResult }: FlappyBirdGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"idle" | "playing" | "dead">("idle");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showReadyBanner, setShowReadyBanner] = useState(false);

  // Game state refs (avoid re-renders during animation)
  const birdY = useRef(CANVAS_H / 2);
  const birdVel = useRef(0);
  const pipes = useRef<Pipe[]>([]);
  const frameCount = useRef(0);
  const scoreRef = useRef(0);
  const gameStateRef = useRef<"idle" | "playing" | "dead">("idle");
  const animRef = useRef<number>(0);
  const isTouchDevice = useRef(false);

  // Show ready banner when isReady changes
  useEffect(() => {
    if (isReady) {
      setShowReadyBanner(true);
    }
  }, [isReady]);

  const resetGame = useCallback(() => {
    birdY.current = CANVAS_H / 2;
    birdVel.current = 0;
    pipes.current = [];
    frameCount.current = 0;
    scoreRef.current = 0;
    setScore(0);
  }, []);

  const doJump = useCallback(() => {
    if (gameStateRef.current === "idle") {
      resetGame();
      gameStateRef.current = "playing";
      setGameState("playing");
      birdVel.current = JUMP_FORCE;
    } else if (gameStateRef.current === "playing") {
      birdVel.current = JUMP_FORCE;
    } else if (gameStateRef.current === "dead") {
      resetGame();
      gameStateRef.current = "playing";
      setGameState("playing");
      birdVel.current = JUMP_FORCE;
    }
  }, [resetGame]);

  const handleTouchTap = useCallback(() => {
    isTouchDevice.current = true;
    doJump();
  }, [doJump]);

  const handleClickTap = useCallback(() => {
    if (isTouchDevice.current) return;
    doJump();
  }, [doJump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const saved = localStorage.getItem("shipazti_flappy_best");
      if (saved) setBestScore(parseInt(saved, 10));
    } catch {}

    const draw = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#e8f4fd");
      grad.addColorStop(1, "#b8d8f0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Ground
      ctx.fillStyle = "#8B7355";
      ctx.fillRect(0, CANVAS_H - 16, CANVAS_W, 16);
      ctx.fillStyle = "#6d9b3a";
      ctx.fillRect(0, CANVAS_H - 18, CANVAS_W, 4);

      if (gameStateRef.current === "playing") {
        // Update bird
        birdVel.current += GRAVITY;
        birdY.current += birdVel.current;

        // Clamp bird so it doesn't go above screen (forgiving)
        if (birdY.current < 0) {
          birdY.current = 0;
          birdVel.current = 0;
        }

        // Update pipes
        frameCount.current++;
        if (frameCount.current % PIPE_INTERVAL === 0) {
          const minTop = 20;
          const maxTop = CANVAS_H - PIPE_GAP - 20 - 18;
          const topH = minTop + Math.random() * (maxTop - minTop);
          pipes.current.push({ x: CANVAS_W, topH, scored: false });
        }

        for (const pipe of pipes.current) {
          pipe.x -= PIPE_SPEED;

          if (!pipe.scored && pipe.x + PIPE_WIDTH < 40) {
            pipe.scored = true;
            scoreRef.current++;
            setScore(scoreRef.current);
          }
        }

        pipes.current = pipes.current.filter(p => p.x > -PIPE_WIDTH);

        // Collision detection
        const birdLeft = 36;
        const birdRight = birdLeft + BIRD_SIZE;
        const birdTop = birdY.current;
        const birdBottom = birdY.current + BIRD_SIZE;

        // Ground only (ceiling is forgiving - just clamp)
        if (birdBottom > CANVAS_H - 18) {
          gameStateRef.current = "dead";
          setGameState("dead");
          if (scoreRef.current > bestScore) {
            setBestScore(scoreRef.current);
            try { localStorage.setItem("shipazti_flappy_best", String(scoreRef.current)); } catch {}
          }
        }

        // Pipes - slightly forgiving hitbox (shrink by 2px each side)
        for (const pipe of pipes.current) {
          if (
            birdRight - 2 > pipe.x + 2 &&
            birdLeft + 2 < pipe.x + PIPE_WIDTH - 2 &&
            (birdTop + 2 < pipe.topH || birdBottom - 2 > pipe.topH + PIPE_GAP)
          ) {
            gameStateRef.current = "dead";
            setGameState("dead");
            if (scoreRef.current > bestScore) {
              setBestScore(scoreRef.current);
              try { localStorage.setItem("shipazti_flappy_best", String(scoreRef.current)); } catch {}
            }
          }
        }
      }

      // Draw pipes with rounded look
      for (const pipe of pipes.current) {
        // Top pipe
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topH);
        ctx.fillStyle = "#388E3C";
        ctx.fillRect(pipe.x - 2, pipe.topH - 10, PIPE_WIDTH + 4, 10);

        // Bottom pipe
        const bottomY = pipe.topH + PIPE_GAP;
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, CANVAS_H - bottomY - 18);
        ctx.fillStyle = "#388E3C";
        ctx.fillRect(pipe.x - 2, bottomY, PIPE_WIDTH + 4, 10);
      }

      // Draw bird
      const bx = 40;
      const by = birdY.current;

      // Body
      ctx.fillStyle = "#FFD700";
      ctx.beginPath();
      ctx.ellipse(bx + BIRD_SIZE / 2, by + BIRD_SIZE / 2, BIRD_SIZE / 2 + 1, BIRD_SIZE / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(bx + BIRD_SIZE / 2 + 3, by + BIRD_SIZE / 2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(bx + BIRD_SIZE / 2 + 4, by + BIRD_SIZE / 2 - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#FF6B00";
      ctx.beginPath();
      ctx.moveTo(bx + BIRD_SIZE, by + BIRD_SIZE / 2);
      ctx.lineTo(bx + BIRD_SIZE + 5, by + BIRD_SIZE / 2 + 1);
      ctx.lineTo(bx + BIRD_SIZE, by + BIRD_SIZE / 2 + 3);
      ctx.fill();

      // Wing
      ctx.fillStyle = "#FFC107";
      ctx.beginPath();
      const wingFlap = gameStateRef.current === "playing" ? Math.sin(frameCount.current * 0.3) * 2 : 0;
      ctx.ellipse(bx + BIRD_SIZE / 2 - 2, by + BIRD_SIZE / 2 + wingFlap, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Score display (during play)
      if (gameStateRef.current === "playing") {
        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.strokeText(String(scoreRef.current), CANVAS_W / 2, 30);
        ctx.fillText(String(scoreRef.current), CANVAS_W / 2, 30);
      }

      // Idle screen
      if (gameStateRef.current === "idle") {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🐤 לחצו כדי לשחק!", CANVAS_W / 2, CANVAS_H / 2 - 8);
        ctx.font = "11px Arial";
        ctx.fillText("בזמן שההדמיה נטענת", CANVAS_W / 2, CANVAS_H / 2 + 14);
      }

      // Death screen
      if (gameStateRef.current === "dead") {
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${scoreRef.current} ⭐`, CANVAS_W / 2, CANVAS_H / 2 - 18);
        ctx.font = "12px Arial";
        ctx.fillText(`שיא: ${Math.max(scoreRef.current, bestScore)}`, CANVAS_W / 2, CANVAS_H / 2 + 2);
        ctx.font = "11px Arial";
        ctx.fillText("לחצו לנסות שוב", CANVAS_W / 2, CANVAS_H / 2 + 22);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [bestScore]);

  return (
    <div className="flex flex-col items-center mt-2 mb-1 relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-xl border border-gray-200 cursor-pointer touch-none"
        style={{ maxWidth: "100%", height: "auto" }}
        onClick={handleClickTap}
        onTouchStart={(e) => { e.preventDefault(); handleTouchTap(); }}
      />
      {/* Ready banner - slides in when result is done */}
      {showReadyBanner && (
        <div className="absolute inset-x-0 top-0 flex justify-center z-10 animate-bounce-in">
          <button
            onClick={(e) => { e.stopPropagation(); onShowResult?.(); }}
            onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); onShowResult?.(); }}
            className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 transition-colors"
          >
            <span>✨</span>
            <span>ההדמיה מוכנה! לחצו לצפות</span>
          </button>
        </div>
      )}
    </div>
  );
}
