"use client";

// Tab bar for /admin: "Dashboard" (analytics) and "Puzzles". Both slots stay
// mounted — the inactive one is just `hidden` — so an in-progress puzzle form
// survives a tab switch. The slots are server-rendered subtrees passed as
// props, which is valid React composition (Server Component children of a
// Client Component).

import { useState } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

type Tab = "dashboard" | "puzzles";

export default function AdminTabs({
  dashboard,
  puzzles,
}: {
  dashboard: ReactNode;
  puzzles: ReactNode;
}) {
  const t = useTranslations("Admin.tabs");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: t("dashboard") },
    { id: "puzzles", label: t("puzzles") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={t("dashboard")}
        className="flex gap-1 rounded-2xl bg-card p-1 ring-1 ring-line"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink-soft hover:bg-line/40 hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className={activeTab === "dashboard" ? "" : "hidden"}>
        {dashboard}
      </div>
      <div role="tabpanel" className={activeTab === "puzzles" ? "" : "hidden"}>
        {puzzles}
      </div>
    </div>
  );
}
