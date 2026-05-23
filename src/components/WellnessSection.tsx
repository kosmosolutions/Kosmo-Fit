"use client";

import { useEffect, useState } from "react";
import { Play, ExternalLink, X } from "lucide-react";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  WELLNESS_ROUTINES,
  type WellnessLevel,
  type WellnessRoutine,
} from "@/data/workouts";

type Selection = {
  routine: WellnessRoutine;
  level: WellnessLevel;
};

const LEVEL_LABEL: Record<WellnessLevel["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function WellnessSection() {
  const [active, setActive] = useState<Selection | null>(null);
  useBodyScrollLock(active !== null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WELLNESS_ROUTINES.map((r) => (
          <div
            key={r.id}
            className="group flex flex-col overflow-hidden rounded-2xl border"
            style={{
              background: `${r.color}0f`,
              borderColor: `${r.color}33`,
            }}
          >
            {/* Thumbnail uses the intermediate video as the visual preview */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={`https://i.ytimg.com/vi/${r.levels[1].youtubeId}/hqdefault.jpg`}
                alt=""
                className="h-full w-full object-cover opacity-80"
                loading="lazy"
              />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur">
                <span className="text-base leading-none">{r.icon}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[2px] text-white"
                >
                  {r.title}
                </span>
              </div>
            </div>

            {/* Info + level buttons */}
            <div className="flex-1 p-4">
              <p className="text-[12px] leading-relaxed text-chalk-300">
                {r.description}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {r.levels.map((lvl) => (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setActive({ routine: r, level: lvl })}
                    className="flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-center transition hover:border-white/30 hover:bg-white/5"
                    style={{
                      borderColor: `${r.color}33`,
                      background: `${r.color}0a`,
                    }}
                  >
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: r.color }}
                    >
                      {LEVEL_LABEL[lvl.level]}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-chalk-100">
                      <Play className="h-2.5 w-2.5 fill-current" />
                      {lvl.duration}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-ink-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: `${active.routine.color}30` }}
            >
              <div className="flex items-center gap-2">
                <span>{active.routine.icon}</span>
                <span className="text-sm font-bold text-chalk-50">
                  {active.routine.title}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: active.routine.color,
                    background: `${active.routine.color}20`,
                  }}
                >
                  {LEVEL_LABEL[active.level.level]} · {active.level.duration}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${active.level.youtubeId}?modestbranding=1&rel=0&autoplay=1`}
                title={active.level.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <a
                href={`https://www.youtube.com/watch?v=${active.level.youtubeId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                <ExternalLink className="h-3 w-3" /> Open on YouTube
              </a>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(active.level.title)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                Search alternatives <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
