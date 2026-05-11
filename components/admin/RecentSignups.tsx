import { getLocale, getTranslations } from "next-intl/server";
import type { AdminOverview } from "@/lib/account";

function fmtDate(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RecentSignups({
  signups,
}: {
  signups: AdminOverview["recentSignups"];
}) {
  const t = await getTranslations("Admin.signups");
  const locale = await getLocale();
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-black text-ink">{t("title")}</h2>
      {signups.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl bg-card shadow-sm ring-1 ring-line">
          {signups.map((s) => (
            <li
              key={`${s.email}-${s.createdAt}`}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span className="min-w-0 truncate font-medium text-ink">{s.email}</span>
              <span className="shrink-0 text-ink-soft">{fmtDate(s.createdAt, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
