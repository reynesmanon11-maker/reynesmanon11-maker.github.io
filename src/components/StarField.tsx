import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
};

type RingStar = Star & { radiusOffset: number };

export type StarFieldProps = {
  count?: number;
  className?: string;
  ring?: boolean;
  ringCount?: number;
  ringRadiusFactor?: number;
  ringBandWidth?: number;
};

/** Box-Muller transform: one sample from a normal distribution. */
function gaussian(mean: number, stdDev: number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function randomRadius(tiers: Array<[number, number, number]>) {
  const roll = Math.random();
  let acc = 0;
  for (const [chance, min, max] of tiers) {
    acc += chance;
    if (roll < acc) return min + Math.random() * (max - min);
  }
  const last = tiers[tiers.length - 1];
  return last[1] + Math.random() * (last[2] - last[1]);
}

export default function StarField({
  count = 600,
  className = "absolute inset-0 pointer-events-none",
  ring = false,
  ringCount = 240,
  ringRadiusFactor = 0.36,
  ringBandWidth = 52,
}: StarFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Array<Star> = [];
    let ringStars: Array<RingStar> = [];
    let width = 0;
    let height = 0;
    let ringR = 0;

    const build = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      width = parent.clientWidth;
      height = parent.clientHeight;
      if (width === 0 || height === 0) return;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: randomRadius([
          [0.65, 0.25, 0.5],
          [0.27, 0.5, 0.8],
          [0.08, 0.8, 1.3],
        ]),
        opacity: 0.2 + Math.random() * 0.75,
        twinkleSpeed: 0.4 + Math.random() * 1.2,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));

      ringStars = [];
      if (ring) {
        const cx = width / 2;
        const cy = height / 2;
        ringR = Math.min(width, height) * ringRadiusFactor;
        const half = ringBandWidth / 2;
        for (let i = 0; i < ringCount * 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radiusOffset = gaussian(0, half * 0.65);
          const dist = ringR + radiusOffset;
          ringStars.push({
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            r: randomRadius([
              [0.7, 0.15, 0.3],
              [0.23, 0.3, 0.5],
              [0.07, 0.5, 0.7],
            ]),
            opacity: 0.25 + Math.random() * 0.55,
            twinkleSpeed: 0.3 + Math.random() * 1.0,
            twinkleOffset: Math.random() * Math.PI * 2,
            radiusOffset,
          });
        }
      }
    };

    let frame = 0;
    const draw = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, width, height);

      if (ring && ringStars.length > 0) {
        const cx = width / 2;
        const cy = height / 2;
        const halo = ctx.createRadialGradient(
          cx,
          cy,
          Math.max(0, ringR - ringBandWidth * 4),
          cx,
          cy,
          ringR + ringBandWidth * 4,
        );
        halo.addColorStop(0, "rgba(255,255,255,0)");
        halo.addColorStop(0.42, "rgba(255,255,255,0.022)");
        halo.addColorStop(0.5, "rgba(255,255,255,0.038)");
        halo.addColorStop(0.58, "rgba(255,255,255,0.022)");
        halo.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, width, height);
      }

      for (const star of stars) {
        const twinkle =
          0.55 +
          0.45 * (Math.sin(t * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5);
        const alpha = star.opacity * twinkle;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        if (star.r > 1.1) {
          const glow = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.r * 4,
          );
          glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.3})`);
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.fillStyle = glow;
          ctx.arc(star.x, star.y, star.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const star of ringStars) {
        const twinkle =
          0.55 +
          0.45 * (Math.sin(t * star.twinkleSpeed + star.twinkleOffset) * 0.5 + 0.5);
        const falloff = Math.max(
          0.15,
          1 - Math.abs(star.radiusOffset) / (ringBandWidth * 0.65),
        );
        const alpha = star.opacity * twinkle * falloff;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        if (star.r > 1.0) {
          const glow = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.r * 5,
          );
          glow.addColorStop(0, `rgba(255,255,255,${alpha * 0.4})`);
          glow.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.fillStyle = glow;
          ctx.arc(star.x, star.y, star.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    build();
    frame = requestAnimationFrame(draw);

    const parent = canvas.parentElement;
    const observer = new ResizeObserver(() => build());
    if (parent) observer.observe(parent);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [count, ring, ringCount, ringRadiusFactor, ringBandWidth]);

  return <canvas ref={canvasRef} className={className} style={{ zIndex: 0 }} aria-hidden />;
}
