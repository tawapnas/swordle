import type { AdminOverview } from "@/lib/account";

export default function StreakHistogram({
  distribution,
}: {
  distribution: AdminOverview["streakDistribution"];
}) {
  const rows = [...distribution].sort((a, b) => a.streak - b.streak);
  const max = rows.reduce((m, r) => Math.max(m, r.users), 0);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-black text-ink">Current streaks</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">No streaks to show yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-line">
          {rows.map((r) => (
            <div key={r.streak} className="flex items-center gap-3 text-sm">
              <span className="w-14 shrink-0 text-right font-bold tabular-nums text-ink-soft">
                {r.streak === 0 ? "0 🔥" : `${r.streak} 🔥`}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-flame"
                  style={{ width: max > 0 ? `${(r.users / max) * 100}%` : "0%" }}
                />
              </div>
              <span className="w-8 shrink-0 tabular-nums text-ink">{r.users}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
