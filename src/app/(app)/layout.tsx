import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { SideNav } from "@/components/SideNav";
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
    <div className="min-h-svh overflow-x-hidden md:flex">
      <SideNav
        weight={profile.current_weight}
        goalWeight={profile.goal_weight}
        weeklyLoss={stats.weeklyLoss}
      />
      <div className="flex-1 pb-24 md:pb-0">
        <TopBar
          weight={profile.current_weight}
          goalWeight={profile.goal_weight}
          weeklyLoss={stats.weeklyLoss}
          fullName={profile.full_name}
          email={user.email ?? ""}
        />
        <main className="mx-auto w-full max-w-3xl px-4 py-5 md:max-w-5xl md:px-8 md:py-8 lg:max-w-6xl">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
