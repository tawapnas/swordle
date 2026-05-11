import { getTranslations } from "next-intl/server";
import type { AdminOverview } from "@/lib/account";

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function StatCards({ overview }: { overview: AdminOverview }) {
  const t = await getTranslations("Admin.stats");
  const cards: { label: string; value: string }[] = [
    { label: t("totalUsers"), value: String(overview.totalUsers) },
    { label: t("totalAttempts"), value: String(overview.totalAttempts) },
    { label: t("totalSolved"), value: String(overview.totalSolved) },
    { label: t("solveRate"), value: pct(overview.totalSolved, overview.totalAttempts) },
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
