"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BarChart3,
  Dumbbell,
  Footprints,
  Loader2,
  Salad,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Ring } from "@/components/Ring";
import { fromISODate, shortDate, toISODate, todayISO } from "@/lib/dates";
import { getActivityStats, type ActivityStats } from "@/lib/actions/activity";

type Preset = "week" | "month" | "6mo" | "ytd" | "custom";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "30 days" },
  { id: "6mo", label: "6 months" },
  { id: "ytd", label: "YTD" },
  { id: "custom", label: "Custom" },
];

function rangeFor(
  preset: Preset,
  customStart: string,
  customEnd: string,
): { start: string; end: string } {
  const today = todayISO();
  if (preset === "custom") return { start: customStart, end: customEnd };
  const t = fromISODate(today);
  if (preset === "ytd") return { start: `${t.getFullYear()}-01-01`, end: today };
  const start = new Date(t);
  if (preset === "week") start.setDate(t.getDate() - 6);
  else if (preset === "month") start.setDate(t.getDate() - 29);
  else if (preset === "6mo") start.setMonth(t.getMonth() - 6);
  return { start: toISODate(start), end: today };
}

export function CalendarStats() {
  const today = todayISO();
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState<Preset>("month");
  const [customStart, setCustomStart] = useState(() => {
    const d = fromISODate(today);
    d.setDate(d.getDate() - 29);
    return toISODate(d);
  });
  const [customEnd, setCustomEnd] = useState(today);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [pending, start] = useTransition();

  const range = rangeFor(preset, customStart, customEnd);
  const validRange = range.start <= range.end;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !validRange) return;
    start(async () => {
      const s = await getActivityStats(range.start, range.end);
      setStats(s);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset, customStart, customEnd]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open activity stats"
        className="flex h-full min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-accent-blue/15 px-3 text-accent-blue transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-blue/25"
      >
        <BarChart3 className="h-4 w-4" />
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          Stats
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Activity stats"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full overflow-hidden rounded-t-3xl bg-ink-850 sm:max-w-md sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-accent-blue/20">
                  <BarChart3 className="h-5 w-5 text-accent-blue" />
                </div>
                <div>
                  <div className="metric-label">Consistency</div>
                  <h2 className="text-[20px] font-bold tracking-tight text-white">
                    Activity stats
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-9 w-9 place-items-center rounded-full bg-ink-800 text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-ink-700 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5 pt-0">
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreset(p.id)}
                    className={cn(
                      "min-h-[36px] rounded-full px-4 text-[13px] font-semibold transition-all duration-200 ease-ios active:scale-[0.96]",
                      preset === p.id
                        ? "bg-accent-blue/20 text-accent-blue"
                        : "bg-ink-800 text-chalk-300 hover:bg-ink-700",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {preset === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="metric-label">From</span>
                    <input
                      type="date"
                      max={today}
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="field mt-1 [color-scheme:dark]"
                    />
                  </label>
                  <label className="block">
                    <span className="metric-label">To</span>
                    <input
                      type="date"
                      max={today}
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="field mt-1 [color-scheme:dark]"
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center justify-between text-[12px] font-medium text-chalk-400">
                <span>
                  {validRange
                    ? `${shortDate(fromISODate(range.start))} – ${shortDate(
                        fromISODate(range.end),
                      )}`
                    : "Pick a valid date range"}
                </span>
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </div>

              {!validRange ? (
                <div className="grid h-32 place-items-center text-[13px] font-medium text-chalk-400">
                  Start date must be on or before the end date.
                </div>
              ) : stats ? (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <StatRing
                      label="Workouts"
                      Icon={Dumbbell}
                      days={stats.workoutDays}
                      total={stats.totalDays}
                      color="#30D158"
                    />
                    <StatRing
                      label="Steps"
                      Icon={Footprints}
                      days={stats.stepDays}
                      total={stats.totalDays}
                      color="#0A84FF"
                    />
                    <StatRing
                      label="Nutrition"
                      Icon={Salad}
                      days={stats.dietDays}
                      total={stats.totalDays}
                      color="#FF9F0A"
                    />
                  </div>
                  <div className="rounded-2xl bg-ink-800 px-4 py-3 text-center text-[12px] font-medium text-chalk-300">
                    {stats.totalSteps.toLocaleString()} steps over{" "}
                    {stats.totalDays} days
                    {stats.totalDays > 0 &&
                      ` · avg ${Math.round(
                        stats.totalSteps / stats.totalDays,
                      ).toLocaleString()}/day`}
                  </div>
                </>
              ) : (
                <div className="grid h-32 place-items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-chalk-400" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatRing({
  label,
  Icon,
  days,
  total,
  color,
}: {
  label: string;
  Icon: LucideIcon;
  days: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? days / total : 0;
  return (
    <div className="rounded-2xl bg-ink-800 p-3 text-center">
      <div className="relative mx-auto h-[72px] w-[72px]">
        <Ring pct={pct} color={color} size={72} stroke={7} />
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-[16px] font-black text-white">
            {Math.round(pct * 100)}%
          </span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-chalk-200">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        <span className="text-[12px] font-semibold">{label}</span>
      </div>
      <div className="text-[11px] font-medium text-chalk-400">
        {days} / {total} days
      </div>
    </div>
  );
}
