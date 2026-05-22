"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Square } from "lucide-react";

type Status = "idle" | "running" | "paused";

function format(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function SessionTimer({ color }: { color: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => {
          setElapsed(0);
          setStatus("running");
        }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition hover:brightness-110"
        style={{
          color: "#0a0c14",
          background: color,
          borderColor: color,
        }}
      >
        <Play className="h-4 w-4 fill-current" />
        Start session
      </button>
    );
  }

  return (
    <div
      className="flex items-center gap-2 rounded-2xl border p-2"
      style={{
        background: `${color}14`,
        borderColor: `${color}55`,
      }}
    >
      <div className="flex flex-1 items-center gap-2 px-2">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: status === "running" ? color : `${color}55`,
            boxShadow:
              status === "running" ? `0 0 8px ${color}` : "none",
          }}
          aria-hidden
        />
        <span
          className="font-mono text-xl font-extrabold tabular-nums"
          style={{ color }}
        >
          {format(elapsed)}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[2px] text-chalk-400">
          {status === "running" ? "Live" : "Paused"}
        </span>
      </div>
      <button
        type="button"
        onClick={() =>
          setStatus(status === "running" ? "paused" : "running")
        }
        className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold text-chalk-50 hover:bg-white/[0.12]"
      >
        {status === "running" ? (
          <>
            <Pause className="h-3.5 w-3.5 fill-current" />
            Pause
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 fill-current" />
            Resume
          </>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          setStatus("idle");
          setElapsed(0);
        }}
        className="flex items-center gap-1.5 rounded-xl border border-accent-rose/30 bg-accent-rose/15 px-3 py-2 text-xs font-bold text-accent-rose hover:bg-accent-rose/25"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        Stop
      </button>
    </div>
  );
}
