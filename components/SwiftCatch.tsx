"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// The "catch the swift" reward, shown under Share on a fresh win for signed-in
// players. The photo is served by the gated /api/bird route (which verifies the
// solve and streams it from a private bucket), so it's never publicly reachable.
//
// `unoptimized` makes the browser load the src directly — Next's image optimizer
// fetches server-side without the user's cookie and would get a 401. Same-origin
// also keeps the tap-to-download (`<a download>`) working.
//
// Tapping the bird downloads the full-resolution photo and "catches" it (the
// bobbing stops, it settles with a pop, the caption flips to "Caught it!").
// Decorative motion only — stilled under prefers-reduced-motion. If the request
// is somehow rejected, the component quietly removes itself.
export default function SwiftCatch({ dayNumber }: { dayNumber: number }) {
  const t = useTranslations("Result");
  const [caught, setCaught] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = `/api/bird?day=${dayNumber}`;
  if (failed) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={src}
        download={`swordle-day-${dayNumber}-swift.png`}
        aria-label={t("saveBird")}
        onClick={() => setCaught(true)}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span
          className={`relative block h-44 w-44 overflow-hidden border-2 border-ink ${
            caught ? "animate-pop" : "animate-bob"
          }`}
        >
          <Image
            src={src}
            alt=""
            aria-hidden
            fill
            unoptimized
            sizes="176px"
            className="object-cover"
            onError={() => setFailed(true)}
          />
        </span>
      </a>

      <p className="text-sm font-bold text-ink">
        {caught ? t("caught") : t("catchHint")}
      </p>
    </div>
  );
}
