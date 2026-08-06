import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.svg";
import { useImageFallback } from "@/components/useImageFallback";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Per-segment easing for an n-keyframe animation. Passing the bezier on its own
 * would ease the timeline as a whole and pull every keyframe time forward; one
 * easing per segment keeps `times` at the milliseconds they name.
 */
const segments = (n: number): Array<typeof EASE> =>
  Array.from({ length: n - 1 }, () => [...EASE] as typeof EASE);

/** Full intro runtime in seconds. Every keyframe time below is a fraction of this. */
const TOTAL = 3.6;

const RAY_ANGLES = [0, 30, 60, 120, 150, 210, 240, 300, 330];

/** Visible logo box: the icon is the first 64px of a 268×64 wordmark. */
const LOGO_W = 268;
const LOGO_H = 64;
const ICON_W = 64;
const ICON_CENTER_X = 32;

export default function IntroSequence() {
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const { failed: logoFailed, imgProps: logoProps } = useImageFallback();

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);
    const timeout = window.setTimeout(
      () => setHidden(true),
      prefersReduced ? 100 : TOTAL * 1000,
    );
    return () => window.clearTimeout(timeout);
  }, []);

  if (hidden) return null;

  if (reduced) {
    return (
      <motion.div
        className="fixed inset-0 z-100"
        style={{ pointerEvents: "none", background: "oklch(0.16 0.004 240)" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        aria-hidden
      />
    );
  }

  const logoMark = logoFailed ? (
    <span
      className="font-display block font-black text-white"
      style={{ fontSize: 48, lineHeight: `${LOGO_H}px`, letterSpacing: "0.06em" }}
    >
      VALMAX
    </span>
  ) : (
    <img
      src={logo}
      alt="VALMAX"
      width={LOGO_W}
      height={LOGO_H}
      className="max-w-none"
      style={{ width: LOGO_W, height: LOGO_H }}
      {...logoProps}
    />
  );

  return (
    <div className="fixed inset-0 z-100" style={{ pointerEvents: "none" }}>
      <motion.div
        className="absolute inset-0"
        style={{ background: "oklch(0.16 0.004 240)" }}
        initial={{ opacity: 1 }}
        animate={{ opacity: [1, 1, 0] }}
        transition={{ duration: TOTAL, times: [0, 0.82, 1], ease: segments(3) }}
        aria-hidden
      />

      {[1, 2, 3].map((n, i) => (
        <motion.div
          key={n}
          className="absolute top-1/2 left-1/2 rounded-full border border-white/10"
          style={{
            width: 260 * n,
            height: 260 * n,
            marginLeft: -(260 * n) / 2,
            marginTop: -(260 * n) / 2,
          }}
          initial={{ opacity: 0, scale: 0.15 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.15, 1, 1.4] }}
          transition={{
            duration: 2.4,
            delay: 1.22 + i * 0.12,
            times: [0, 0.5, 1],
            ease: segments(3),
          }}
          aria-hidden
        />
      ))}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {RAY_ANGLES.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <motion.line
              key={angle}
              x1={50}
              y1={50}
              x2={50 + Math.cos(rad) * 60}
              y2={50 + Math.sin(rad) * 60}
              stroke="#ffffff"
              strokeWidth={0.12}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 1], opacity: [0, 0.65, 0] }}
              transition={{
                duration: 2,
                delay: 1.2 + i * 0.05,
                times: [0, 0.7, 1],
                ease: segments(3),
              }}
              style={{ strokeOpacity: 0.45 }}
            />
          );
        })}
      </svg>

      <motion.div
        className="absolute"
        style={{ transformOrigin: "top left", height: LOGO_H }}
        initial={{ top: "50%", left: "50%", x: "-50%", y: "-50%", scale: 1 }}
        animate={{
          top: ["50%", "50%", "50%", "24px"],
          left: ["50%", "50%", "50%", "24px"],
          x: ["-50%", "-50%", "-50%", "0%"],
          y: ["-50%", "-50%", "-50%", "0%"],
          scale: [1, 1, 1, 0.42],
        }}
        transition={{
          duration: TOTAL,
          times: [0, 0.6, 0.82, 1],
          ease: segments(4),
        }}
      >
        <motion.div
          className="overflow-hidden"
          style={{ height: LOGO_H }}
          initial={{ opacity: 0, width: ICON_W }}
          animate={{
            opacity: [0, 0, 1, 1, 1],
            width: [ICON_W, ICON_W, ICON_W, LOGO_W, LOGO_W],
          }}
          transition={{
            duration: TOTAL,
            times: [0, 0.3, 0.42, 0.78, 1],
            ease: segments(5),
          }}
        >
          {logoMark}
        </motion.div>

        <motion.div
          className="absolute rounded-full bg-white"
          style={{
            left: ICON_CENTER_X,
            top: LOGO_H / 2,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={{ width: 8, height: 8, opacity: 1 }}
          animate={{
            width: [8, 10, 64, 64],
            height: [8, 10, 64, 64],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: TOTAL,
            times: [0, 0.18, 0.4, 1],
            ease: segments(4),
          }}
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
