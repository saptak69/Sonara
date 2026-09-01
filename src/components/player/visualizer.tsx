import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-store";

export function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayer((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const bars = 48;
    const draw = (t: number) => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const w = width / bars;
      for (let i = 0; i < bars; i += 1) {
        const wave = Math.sin(t / 240 + i * 0.35) * 0.5 + 0.5;
        const pulse = isPlaying ? 0.35 + wave * 0.65 : 0.12;
        const h = pulse * height * (0.4 + (i % 7) * 0.08);
        const x = i * w;
        ctx.fillStyle = `rgba(255,255,255,${0.12 + pulse * 0.28})`;
        ctx.fillRect(x + 1, height - h, Math.max(2, w - 3), h);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={72}
      className="h-16 w-full opacity-80"
      aria-hidden
    />
  );
}
