import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import type { AdminOverview } from "@/lib/account";
import type { Puzzle } from "@/lib/types";
import StatCards from "./StatCards";
import ByDayTable from "./ByDayTable";
import StreakHistogram from "./StreakHistogram";
import RecentSignups from "./RecentSignups";
import AdminTabs from "./AdminTabs";
import PuzzlesPanel from "./PuzzlesPanel";

export default async function AdminDashboard({
  overview,
  configured,
  adminEmail,
  puzzles,
  puzzlesConfigured,
  todayDayNumber,
}: {
  overview: AdminOverview;
  configured: boolean;
  adminEmail: string;
  puzzles: Puzzle[];
  puzzlesConfigured: boolean;
  todayDayNumber: number;
}) {
  const t = await getTranslations("Admin");
  const tLogin = await getTranslations("Login");
  const locale = await getLocale();
  const empty =
    overview.totalUsers === 0 &&
    overview.totalAttempts === 0 &&
    overview.recentSignups.length === 0 &&
    overview.byDay.length === 0;

  const dashboard = (
    <div className="flex flex-col gap-8">
      {!configured && (
        <p className="rounded-2xl bg-card px-5 py-4 text-sm text-ink ring-1 ring-line">
          {t("unconfigured")}
        </p>
      )}

      <StatCards overview={overview} />

      {empty ? (
        <div className="rounded-2xl bg-card px-5 py-10 text-center text-sm text-ink-soft ring-1 ring-line">
          {t("noData")}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <ByDayTable byDay={overview.byDay} />
          <StreakHistogram distribution={overview.streakDistribution} />
          <RecentSignups signups={overview.recentSignups} />
        </div>
      )}
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-brand">{t("title")}</h1>
          <p className="text-sm text-ink-soft">{adminEmail}</p>
        </div>
        <Link
          href={`/${locale}`}
          className="text-sm font-bold text-ink-soft underline-offset-2 hover:text-brand hover:underline"
        >
          {tLogin("back")}
        </Link>
      </header>

      <AdminTabs
        dashboard={dashboard}
        puzzles={
          <PuzzlesPanel
            puzzles={puzzles}
            configured={puzzlesConfigured}
            todayDayNumber={todayDayNumber}
          />
        }
      />
    </main>
  );
}
