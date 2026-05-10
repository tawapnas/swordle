import { redirect } from "next/navigation";
import GamePage from "@/components/GamePage";
import WelcomeScreen from "@/components/WelcomeScreen";
import { getSessionUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getProfileSummary } from "@/lib/account-data";

// Reads the auth cookie, so this route renders dynamically.
export const dynamic = "force-dynamic";

export default async function Home() {
  // No Supabase configured → no auth backend to gate on; play directly.
  if (!isSupabaseConfigured()) return <GamePage />;

  const user = await getSessionUser();
  if (!user) return <WelcomeScreen />;

  // Signed in but hasn't completed the account form yet → onboarding first.
  const profile = await getProfileSummary(user);
  if (!profile?.onboarded) redirect("/onboarding");

  return <GamePage />;
}
