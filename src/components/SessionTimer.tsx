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
        className="flex min-h-[52px] w-full items-center justify-center rounded-full px-5 text-[15px] font-semibold text-black transition-all duration-200 ease-ios active:scale-[0.98] hover:brightness-110"
        style={{ background: color }}
      >
        Start session
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-ink-850 p-2">
      <div className="flex flex-1 items-center gap-2 px-3">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: status === "running" ? color : `${color}55`,
            boxShadow:
              status === "running" ? `0 0 10px ${color}` : "none",
          }}
          aria-hidden
        />
        <span
          className="font-display text-[22px] font-black tabular-nums tracking-tightest"
          style={{ color }}
        >
          {format(elapsed)}
        </span>
        <span className="metric-label">
          {status === "running" ? "Live" : "Paused"}
        </span>
      </div>
      <button
        type="button"
        onClick={() =>
          setStatus(status === "running" ? "paused" : "running")
        }
        className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-ink-700 px-4 text-[12px] font-semibold text-white transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-600"
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
        className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-accent-rose/20 px-4 text-[12px] font-semibold text-accent-rose transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-rose/30"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        Stop
      </button>
    </div>
  );
}
