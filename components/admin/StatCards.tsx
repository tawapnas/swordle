import type { AdminOverview } from "@/lib/account";

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default function StatCards({ overview }: { overview: AdminOverview }) {
  const cards: { label: string; value: string }[] = [
    { label: "Players", value: String(overview.totalUsers) },
    { label: "Attempts", value: String(overview.totalAttempts) },
    { label: "Solved", value: String(overview.totalSolved) },
    { label: "Solve rate", value: pct(overview.totalSolved, overview.totalAttempts) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-4 shadow-sm ring-1 ring-line"
        >
          <span className="text-2xl font-black tabular-nums text-ink">{c.value}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-ink-soft">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}
