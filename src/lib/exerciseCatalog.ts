export const FED_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

export type ExerciseLevel = "beginner" | "intermediate" | "expert";

export interface CatalogExercise {
  id: string;
  name: string;
  level: ExerciseLevel;
  equipment: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
}

export const LEVEL_COLOR: Record<ExerciseLevel, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  expert: "#f43f5e",
};

let cache: Promise<CatalogExercise[]> | null = null;

export function loadExerciseCatalog(): Promise<CatalogExercise[]> {
  if (!cache) {
    cache = fetch("/exercise-catalog.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogExercise[]>;
      })
      .catch((err) => {
        cache = null; // allow a later retry
        throw err;
      });
  }
  return cache;
}

// Daily-plan images are `${FED_BASE}/<id>/0.jpg`; the catalog is keyed by that
// same `<id>` (its directory). Pull the id back out of a frame URL.
export function fedIdFromImageUrl(url: string): string | null {
  const tail = url.split("/exercises/")[1];
  if (!tail) return null;
  const dir = tail.split("/")[0];
  return dir || null;
}
