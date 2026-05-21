import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { calcStats } from "@/lib/calc";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const stats = calcStats(profile, profile.workout_mode === "gym" ? "gym" : "home");

  return (
    <div className="min-h-svh pb-24">
      <TopBar
        weight={profile.current_weight}
        goalWeight={profile.goal_weight}
        weeklyLoss={stats.weeklyLoss}
      />
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
