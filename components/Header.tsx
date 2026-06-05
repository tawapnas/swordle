import LanguageToggle from "@/components/LanguageToggle";
import AccountBar from "@/components/AccountBar";

// Minimal top bar, pinned top-right: language switch + account menu (the latter
// shows only when signed in). The Swift Coding Club logo/wordmark and rainbow
// stripe were removed — the org credit still lives in the footer.
export default function Header() {
  return (
    <header className="flex shrink-0 items-center justify-end gap-3 px-4 py-3">
      <LanguageToggle />
      <AccountBar />
    </header>
  );
}
