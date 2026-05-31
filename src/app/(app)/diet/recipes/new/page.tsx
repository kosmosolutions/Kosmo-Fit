import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecipeForm } from "../RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="space-y-5">
      <Link
        href="/diet/recipes"
        className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-ink-800 px-3 text-[13px] font-semibold text-chalk-200 transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-700 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to recipes
      </Link>
      <div>
        <div className="metric-label">New recipe</div>
        <h1 className="display text-[28px] leading-tight text-white">
          Save a meal for next time
        </h1>
      </div>
      <RecipeForm />
    </div>
  );
}
