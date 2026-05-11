import { getTranslations } from "next-intl/server";
import type { AdminOverview } from "@/lib/account";

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default async function ByDayTable({
  byDay,
}: {
  byDay: AdminOverview["byDay"];
}) {
  const t = await getTranslations("Admin.byDay");
  const rows = [...byDay].sort((a, b) => b.dayNumber - a.dayNumber);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-black text-ink">{t("title")}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">—</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-card shadow-sm ring-1 ring-line">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2 font-bold">{t("day")}</th>
                <th className="px-4 py-2 font-bold">{t("players")}</th>
                <th className="px-4 py-2 font-bold">{t("solved")}</th>
                <th className="px-4 py-2 font-bold">{t("rate")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dayNumber} className="border-b border-line last:border-0">
                  <td className="px-4 py-2 font-bold text-ink">#{r.dayNumber}</td>
                  <td className="px-4 py-2 tabular-nums text-ink">{r.players}</td>
                  <td className="px-4 py-2 tabular-nums text-ink">{r.solved}</td>
                  <td className="px-4 py-2 tabular-nums text-ink-soft">
                    {pct(r.solved, r.players)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
