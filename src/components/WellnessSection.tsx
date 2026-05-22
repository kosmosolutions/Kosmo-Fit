"use client";

import { useState } from "react";
import { Play, ExternalLink, X } from "lucide-react";
import { WELLNESS_ROUTINES, type WellnessRoutine } from "@/data/workouts";

export function WellnessSection() {
  const [active, setActive] = useState<WellnessRoutine | null>(null);

  return (
    <>
      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {WELLNESS_ROUTINES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActive(r)}
            className="group flex flex-col overflow-hidden rounded-2xl border text-left transition hover:border-white/20"
            style={{
              background: `${r.color}0f`,
              borderColor: `${r.color}33`,
            }}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img
                src={
                  r.gifUrl ??
                  `https://i.ytimg.com/vi/${r.youtubeId}/hqdefault.jpg`
                }
                alt=""
                className="h-full w-full object-cover opacity-80 transition group-hover:opacity-100"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/10">
                <div className="flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-[12px] font-bold text-white backdrop-blur">
                  <Play className="h-3.5 w-3.5 fill-current" />
                  {r.duration}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{r.icon}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-[2px]"
                  style={{ color: r.color }}
                >
                  {r.title}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-chalk-300">
                {r.description}
              </p>
            </div>
          </button>
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
              style={{ borderColor: `${active.color}30` }}
            >
              <div className="flex items-center gap-2">
                <span>{active.icon}</span>
                <span className="text-sm font-bold text-chalk-50">
                  {active.title}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    color: active.color,
                    background: `${active.color}20`,
                  }}
                >
                  {active.duration}
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
                src={`https://www.youtube.com/embed/${active.youtubeId}?modestbranding=1&rel=0&autoplay=1`}
                title={active.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <a
                href={`https://www.youtube.com/watch?v=${active.youtubeId}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                <ExternalLink className="h-3 w-3" /> Open on YouTube
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
