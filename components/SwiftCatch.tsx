"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// The "catch the swift" reward, shown under Share on a fresh win for signed-in
// players. The image lives in a private Supabase bucket; it's reached only via a
// short-lived signed CDN URL.
//
// `imageUrl` is that signed URL when the win came straight from validate — which
// GamePage has already preloaded, so the <img> paints from cache the instant
// this mounts. Without it (e.g. a revisit) we fall back to the gated /api/bird
// route, which redirects to a fresh signed URL. A plain <img> (not next/image)
// keeps this simple and avoids the optimizer, which can't send the auth cookie.
//
// Tapping the bird downloads the full-resolution photo (via /api/bird&download=1,
// which keeps the filename) and "catches" it (the bobbing stops, it settles with
// a pop, the caption flips to "Caught it!"). Decorative motion only — stilled
// under prefers-reduced-motion. If the request is rejected, it removes itself.
export default function SwiftCatch({
  dayNumber,
  imageUrl,
}: {
  dayNumber: number;
  imageUrl?: string;
}) {
  const t = useTranslations("Result");
  const [caught, setCaught] = useState(false);
  const [failed, setFailed] = useState(false);

  const src = imageUrl ?? `/api/bird?day=${dayNumber}`;
  const downloadHref = `/api/bird?day=${dayNumber}&download=1`;
  if (failed) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={downloadHref}
        download="swordle-swift.png"
        aria-label={t("saveBird")}
        onClick={() => setCaught(true)}
        className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span
          className={`relative block h-44 w-44 overflow-hidden border-2 border-ink ${
            caught ? "animate-pop" : "animate-bob"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
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
