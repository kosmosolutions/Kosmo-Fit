"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signupAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If email confirmation is required by Supabase project settings, there will
  // be no session yet. Send them back with an instructional message.
  if (!data.session) {
    redirect(
      `/login?message=${encodeURIComponent(
        "Check your inbox to confirm your email, then log in.",
      )}`,
    );
  }

  redirect("/onboarding");
}
