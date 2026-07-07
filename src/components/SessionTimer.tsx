"use client";

import { useEffect, useState } from "react";
import { Play, Pause, Square } from "lucide-react";

type Status = "idle" | "running" | "paused";

// Persisted so the timer survives remounts (switching to Wellness/another
// day) and page reloads mid-session.
const STORE_KEY = "kosmo-session-timer";

interface Persisted {
  status: Exclude<Status, "idle">;
  /** Epoch ms when the running stretch started. */
  startedAt: number;
  /** Seconds accumulated before the current running stretch. */
  baseElapsed: number;
}

function load(): Persisted | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Persisted;
    if (p.status !== "running" && p.status !== "paused") return null;
    return p;
  } catch {
    return null;
  }
}

function save(p: Persisted | null) {
  try {
    if (p) sessionStorage.setItem(STORE_KEY, JSON.stringify(p));
    else sessionStorage.removeItem(STORE_KEY);
  } catch {
    // Private-mode storage failures just lose persistence, not the timer.
  }
}

function elapsedOf(p: Persisted, now: number): number {
  const live = p.status === "running" ? Math.floor((now - p.startedAt) / 1000) : 0;
  return p.baseElapsed + Math.max(0, live);
}

function format(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function SessionTimer({ color }: { color: string }) {
  const [session, setSession] = useState<Persisted | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Restore a persisted session after mount (sessionStorage is unavailable
  // during SSR, so state must start empty and hydrate here).
  useEffect(() => {
    setSession(load());
  }, []);

  // Elapsed is derived from wall-clock timestamps, so throttled/suspended
  // intervals (backgrounded tab, locked phone) can't undercount — the tick
  // only refreshes the display.
  useEffect(() => {
    if (session?.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session?.status]);

  const update = (p: Persisted | null) => {
    setSession(p);
    save(p);
    setNow(Date.now());
  };

  if (!session) {
    return (
      <button
        type="button"
        onClick={() =>
          update({ status: "running", startedAt: Date.now(), baseElapsed: 0 })
        }
        className="flex min-h-[52px] w-full items-center justify-center rounded-full px-5 text-[15px] font-semibold text-black transition-all duration-200 ease-ios active:scale-[0.98] hover:brightness-110"
        style={{ background: color }}
      >
        Start session
      </button>
    );
  }

  const running = session.status === "running";
  const elapsed = elapsedOf(session, now);

  return (
    <div className="flex items-center gap-2 rounded-2xl bg-ink-850 p-2">
      <div className="flex flex-1 items-center gap-2 px-3">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: running ? color : `${color}55`,
            boxShadow: running ? `0 0 10px ${color}` : "none",
          }}
          aria-hidden
        />
        <span
          className="font-display text-[22px] font-black tabular-nums tracking-tightest"
          style={{ color }}
        >
          {format(elapsed)}
        </span>
        <span className="metric-label">{running ? "Live" : "Paused"}</span>
      </div>
      <button
        type="button"
        onClick={() =>
          update(
            running
              ? { status: "paused", startedAt: 0, baseElapsed: elapsed }
              : { status: "running", startedAt: Date.now(), baseElapsed: session.baseElapsed },
          )
        }
        className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-ink-700 px-4 text-[12px] font-semibold text-white transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-600"
      >
        {running ? (
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
        onClick={() => update(null)}
        className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-accent-rose/20 px-4 text-[12px] font-semibold text-accent-rose transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-rose/30"
      >
        <Square className="h-3.5 w-3.5 fill-current" />
        Stop
      </button>
    </div>
  );
}
