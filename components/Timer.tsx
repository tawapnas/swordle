"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 60_000;
const TICK_MS = 100;

/**
 * 60-second visual countdown ring. Calls `onExpire` once when time runs out.
 * `running` gates the countdown (pause it on the result screen).
 */
export default function Timer({
  running,
  onExpire,
}: {
  running: boolean;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(DURATION_MS);
  const startRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    if (startRef.current === null) startRef.current = Date.now();

    const id = setInterval(() => {
      const elapsed = Date.now() - (startRef.current ?? Date.now());
      const left = Math.max(0, DURATION_MS - elapsed);
      setRemainingMs(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(id);
        onExpire();
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [running, onExpire]);

  const seconds = Math.ceil(remainingMs / 1000);
  const fraction = remainingMs / DURATION_MS;
  const R = 20;
  const C = 2 * Math.PI * R;
  const low = seconds <= 10;

  return (
    <div
      className="relative h-12 w-12 shrink-0"
      role="timer"
      aria-label={`${seconds} seconds remaining`}
    >
      <svg viewBox="0 0 48 48" className="h-full w-full -rotate-90">
        <circle cx="24" cy="24" r={R} fill="none" stroke="var(--color-line)" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke={low ? "var(--color-danger)" : "var(--color-brand)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fraction)}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-sm font-extrabold tabular-nums ${
          low ? "text-danger" : "text-ink"
        }`}
      >
        {seconds}
      </span>
    </div>
  );
}
