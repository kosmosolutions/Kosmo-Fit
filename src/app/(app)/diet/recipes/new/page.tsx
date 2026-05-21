import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecipeForm } from "../RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="space-y-5">
      <Link
        href="/diet/recipes"
        className="flex items-center gap-1 text-sm font-bold text-chalk-300 hover:text-chalk-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to recipes
      </Link>
      <div>
        <div className="label-tiny">New recipe</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
          Save a meal for next time
        </h1>
      </div>
      <RecipeForm />
    </div>
  );
}
