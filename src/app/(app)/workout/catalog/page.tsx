import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CatalogClient } from "@/components/CatalogClient";

export const metadata = {
  title: "Exercise library · Kosmo Fitness",
};

export default async function CatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CatalogClient />;
}
