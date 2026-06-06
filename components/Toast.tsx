"use client";

import { useEffect } from "react";

/** Small auto-dismissing confirmation toast (e.g. "Copied to clipboard!"). */
export default function Toast({
  message,
  onDismiss,
  duration = 2000,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [onDismiss, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-rise fixed inset-x-0 bottom-6 z-50 mx-auto w-fit max-w-[90%] bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-lg"
    >
      {message}
    </div>
  );
}
