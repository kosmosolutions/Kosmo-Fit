"use client";

import { useState } from "react";
import { Play, ExternalLink, X } from "lucide-react";
import type { Exercise } from "@/data/workouts";

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
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    exercise.searchQuery,
  )}`;
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
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-chalk-300 hover:text-accent-cyan"
          >
            <Play className="h-3 w-3" /> Watch demo
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="text-sm font-bold text-chalk-50">
                {exercise.name}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              {exercise.youtubeId ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${exercise.youtubeId}?modestbranding=1&rel=0`}
                  title={exercise.name}
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-chalk-300">
                  <Play className="h-8 w-8" />
                  <div className="text-sm">
                    Open the best result on YouTube
                  </div>
                  <a
                    href={searchUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="btn-primary"
                  >
                    Watch on YouTube{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <a
                href={searchUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                <ExternalLink className="h-3 w-3" /> Search more on YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
