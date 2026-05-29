"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Play, ExternalLink, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  type CatalogExercise,
  fedIdFromImageUrl,
  LEVEL_COLOR,
  loadExerciseCatalog,
} from "@/lib/exerciseCatalog";
import type { Exercise } from "@/data/workouts";

function useFrameCycle(frameCount: number, intervalMs = 700) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (frameCount < 2) return;
    const id = setInterval(
      () => setFrame((f) => (f + 1) % frameCount),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [frameCount, intervalMs]);
  return frame;
}

function FrameLoop({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const frame = useFrameCycle(images.length);
  return (
    <div className={`relative ${className ?? ""}`}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150"
          style={{ opacity: i === frame ? 1 : 0 }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

export function ExerciseCard({
  index,
  exercise,
  color,
}: {
  index: number;
  exercise: Exercise;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<CatalogExercise | null>(null);
  const [detailState, setDetailState] = useState<"idle" | "loading" | "done">(
    "idle",
  );
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Enrich the popup with full instructions/muscles by matching the frame
  // image's free-exercise-db id against the catalog (fetched once, cached).
  useEffect(() => {
    if (!open || detailState !== "idle") return;
    const fedId = exercise.images?.length
      ? fedIdFromImageUrl(exercise.images[0])
      : null;
    if (!fedId) {
      setDetailState("done");
      return;
    }
    setDetailState("loading");
    let cancelled = false;
    loadExerciseCatalog()
      .then((list) => {
        if (cancelled) return;
        setDetail(list.find((e) => e.id === fedId) ?? null);
        setDetailState("done");
      })
      .catch(() => {
        if (!cancelled) setDetailState("done");
      });
    return () => {
      cancelled = true;
    };
  }, [open, detailState, exercise.images]);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.searchQuery,
  )}`;
  const watchUrl = exercise.youtubeId
    ? `https://www.youtube.com/watch?v=${exercise.youtubeId}`
    : searchUrl;
  const hasImages = (exercise.images?.length ?? 0) > 0;
  const ytThumb = exercise.youtubeId
    ? `https://i.ytimg.com/vi/${exercise.youtubeId}/hqdefault.jpg`
    : null;

  return (
    <>
      <div className="flex items-start gap-3 border-b border-white/[0.05] py-3 last:border-b-0">
        <div
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border font-mono text-[11px] font-extrabold"
          style={{
            color,
            borderColor: `${color}44`,
            background: `${color}1c`,
          }}
        >
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-bold text-chalk-50">
              {exercise.name}
            </div>
            <div
              className="rounded-md border px-2 py-0.5 font-mono text-[10px] whitespace-nowrap"
              style={{
                color,
                borderColor: `${color}33`,
                background: `${color}1c`,
              }}
            >
              {exercise.sets}
            </div>
          </div>
          {exercise.note ? (
            <div className="mt-1 text-[11px] text-chalk-400">
              💡 {exercise.note}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group relative mt-2 block aspect-video w-full max-w-[200px] overflow-hidden rounded-lg border border-white/10 bg-ink-900 transition hover:border-white/30"
            aria-label={`Watch demo: ${exercise.name}`}
          >
            {hasImages ? (
              <FrameLoop
                images={exercise.images!}
                alt={exercise.name}
                className="h-full w-full"
              />
            ) : ytThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ytThumb}
                alt=""
                className="h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
                loading="lazy"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(135deg, ${color}33, ${color}11)`,
                }}
                aria-hidden
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/15">
              <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-chalk-50 backdrop-blur">
                <Play className="h-3 w-3 fill-current" />
                Watch
              </div>
            </div>
          </button>
        </div>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setOpen(false)}
          >
          <div
            className="flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-900 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-chalk-50">
                  {exercise.name}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400">
                  <span
                    className="rounded px-1.5 py-0.5"
                    style={{ color, background: `${color}1c` }}
                  >
                    {exercise.sets}
                  </span>
                  {detail?.level && (
                    <span
                      className="rounded px-1.5 py-0.5"
                      style={{
                        color: LEVEL_COLOR[detail.level],
                        background: `${LEVEL_COLOR[detail.level]}20`,
                      }}
                    >
                      {detail.level}
                    </span>
                  )}
                  {detail?.equipment && <span>· {detail.equipment}</span>}
                  {detail?.category && <span>· {detail.category}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="aspect-video w-full shrink-0 bg-black">
              {hasImages ? (
                <FrameLoop
                  images={exercise.images!}
                  alt={exercise.name}
                  className="h-full w-full"
                />
              ) : (
                <iframe
                  className="h-full w-full"
                  src={
                    exercise.youtubeId
                      ? `https://www.youtube.com/embed/${exercise.youtubeId}?modestbranding=1&rel=0&autoplay=1`
                      : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(
                          exercise.searchQuery,
                        )}`
                  }
                  title={exercise.name}
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            <div className="overflow-y-auto px-4 py-3">
              {exercise.note && (
                <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[12px] text-chalk-300">
                  <span className="font-bold text-chalk-100">Coach note: </span>
                  {exercise.note}
                </div>
              )}

              {detail &&
                (detail.primaryMuscles.length > 0 ||
                  detail.secondaryMuscles.length > 0) && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {detail.primaryMuscles.map((m) => (
                      <span
                        key={`p-${m}`}
                        className="rounded-full bg-accent-blue/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan"
                      >
                        {m}
                      </span>
                    ))}
                    {detail.secondaryMuscles.map((m) => (
                      <span
                        key={`s-${m}`}
                        className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}

              {detail && detail.instructions.length > 0 ? (
                <ol className="space-y-2 text-sm text-chalk-200">
                  {detail.instructions.map((step, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-blue/15 text-[10px] font-bold text-accent-cyan">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : detailState === "loading" ? (
                <div className="text-xs text-chalk-500">Loading details…</div>
              ) : (
                <div className="text-xs text-chalk-500">
                  No step-by-step guide for this move yet — use the tutorials
                  below.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <a
                href={watchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                <ExternalLink className="h-3 w-3" />{" "}
                {exercise.youtubeId ? "Open on YouTube" : "Search on YouTube"}
              </a>
              <a
                href={searchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                More tutorials <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}
