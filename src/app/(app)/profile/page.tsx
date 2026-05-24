import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeightHistory } from "@/lib/actions/weight";
import { ProfileEditor } from "./ProfileEditor";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, weightHistory] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    getWeightHistory(90),
  ]);
  if (!profile) redirect("/onboarding");

  return (
    <ProfileEditor
      profile={profile}
      email={user.email ?? ""}
      weightHistory={weightHistory}
    />
  );
}
