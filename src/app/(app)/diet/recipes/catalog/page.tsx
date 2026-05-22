import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecipeCatalogClient } from "@/components/RecipeCatalogClient";

export const metadata = {
  title: "Recipe library · Kosmo Fitness",
};

export default async function RecipeCatalogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <RecipeCatalogClient />;
}
