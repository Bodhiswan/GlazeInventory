"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroArt() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="relative h-[480px] w-full max-w-[560px] overflow-hidden border border-white/65 bg-background"
    >
      <motion.div
        className="absolute inset-0 opacity-80"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.03, 1] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
        }
        style={{
          background:
            "radial-gradient(circle at 26% 28%, rgba(255,248,238,0.92) 0%, rgba(255,248,238,0) 16%), radial-gradient(circle at 70% 36%, rgba(50,91,99,0.48) 0%, rgba(50,91,99,0) 25%), radial-gradient(circle at 34% 70%, rgba(189,108,63,0.5) 0%, rgba(189,108,63,0) 24%), linear-gradient(155deg, #f6e4d4 8%, #ddb294 38%, #b47050 58%, #5e7a74 86%)",
        }}
      />

      <motion.div
        className="absolute -left-14 top-12 h-48 w-48 border border-white/35 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(255,255,255,0)_38%),linear-gradient(160deg,#91a38b,#496764)]"
        animate={shouldReduceMotion ? undefined : { y: [0, 10, 0], rotate: [0, 6, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute right-0 top-20 h-56 w-56 border border-white/35 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.85),rgba(255,255,255,0)_34%),linear-gradient(165deg,#f0d7bf,#ca7d4e,#7f452f)]"
        animate={shouldReduceMotion ? undefined : { y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 13, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute bottom-[-20px] left-18 h-72 w-72 border border-white/30 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),rgba(255,255,255,0)_34%),linear-gradient(160deg,#e9eee4,#d8ad89,#6d5b45)]"
        animate={shouldReduceMotion ? undefined : { scale: [1, 1.05, 1], rotate: [0, 4, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
        }
      />


      <motion.div
        className="absolute bottom-8 left-8 right-8 border border-white/60 bg-panel p-5"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.15 }}
      >
        <p className="text-xs uppercase tracking-[0.26em] text-muted">Combination intelligence</p>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="bg-white/65 px-4 py-3">
            <p className="text-sm font-semibold">Sea Salt</p>
            <p className="text-xs text-muted">Warm gloss breaker</p>
          </div>
          <div className="display-font text-2xl text-accent">+</div>
          <div className="bg-white/65 px-4 py-3">
            <p className="text-sm font-semibold">Tiger&apos;s Eye</p>
            <p className="text-xs text-muted">Fluid iron brown</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
