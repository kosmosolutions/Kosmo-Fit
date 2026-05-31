"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { X, Check, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { createBuiltPlan } from "@/lib/actions/workout-plan";
import type { BuiltExercisePayload } from "@/lib/workout-plan-types";
import {
  FOCUS_PRESETS,
  WEEKDAY_ORDER,
  WEEKDAY_LABELS,
  WEEKDAY_FULL,
  pickExercisesForFocus,
  catalogImageUrls,
  defaultSetsForFocus,
  type CatalogExercise,
} from "@/data/focus-presets";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * "Create your own" plan builder. The user names the program, toggles which
 * weekdays they train, and assigns a focus to each. On create we auto-fill a
 * balanced exercise set per day for both home and gym from the catalog and
 * persist it as a built plan (createBuiltPlan).
 */
export function PlanBuilder({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  // focusByWeekday[weekday] = focus key; presence of a key = day selected.
  const [focusByWeekday, setFocusByWeekday] = useState<Record<number, string>>(
    {},
  );
  const [catalog, setCatalog] = useState<CatalogExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setFocusByWeekday({});
      setError(null);
      bodyRef.current?.scrollTo({ top: 0 });
    }
  }, [open]);

  // Lazy-load the exercise catalog once the builder opens.
  useEffect(() => {
    if (!open || catalog) return;
    let cancelled = false;
    fetch("/exercise-catalog.json", { cache: "force-cache" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CatalogExercise[]) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, catalog]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const selectedDays = useMemo(
    () =>
      WEEKDAY_ORDER.filter((wd) => focusByWeekday[wd] != null).map((wd) => ({
        weekday: wd,
        focus: focusByWeekday[wd],
      })),
    [focusByWeekday],
  );

  if (!open) return null;

  function toggleDay(weekday: number) {
    setFocusByWeekday((prev) => {
      const next = { ...prev };
      if (next[weekday] != null) {
        delete next[weekday];
      } else {
        next[weekday] = "full"; // sensible default focus
      }
      return next;
    });
  }

  function setFocus(weekday: number, focus: string) {
    setFocusByWeekday((prev) => ({ ...prev, [weekday]: focus }));
  }

  const trimmed = name.trim();
  const canCreate =
    trimmed.length > 0 && selectedDays.length > 0 && catalog != null;

  function handleCreate() {
    if (!canCreate || !catalog) return;
    setError(null);

    const days = selectedDays.map((d) => ({
      weekday: d.weekday,
      focus: d.focus,
    }));
    const toPayload =
      (focus: string) =>
      (e: CatalogExercise): BuiltExercisePayload => ({
        catalog_id: e.id,
        name: e.name,
        sets: defaultSetsForFocus(focus),
        search_query: `${e.name} proper form tutorial`,
        images: catalogImageUrls(e),
      });
    const home = days.map((d) =>
      pickExercisesForFocus(catalog, d.focus, "home").map(toPayload(d.focus)),
    );
    const gym = days.map((d) =>
      pickExercisesForFocus(catalog, d.focus, "gym").map(toPayload(d.focus)),
    );

    startTransition(async () => {
      try {
        await createBuiltPlan({ name: trimmed, days, home, gym });
        onCreated();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create plan");
      }
    });
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-ink-900"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-ink-900/95 p-5 backdrop-blur">
        <div>
          <div className="label-tiny">Create your own</div>
          <h2 className="text-2xl font-extrabold tracking-tight text-chalk-50">
            Build a program
          </h2>
          <p className="mt-1 text-sm text-chalk-400">
            Pick your training days and a focus for each — we&apos;ll fill in
            the exercises.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close builder"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-chalk-300 transition hover:bg-white/[0.08] hover:text-chalk-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 sm:p-5">
        {error && (
          <div className="mb-4 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="label-tiny mb-2">Program name</div>
        <input
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Shred, My Split"
          className="field w-full"
        />

        {/* Weekday picker */}
        <div className="label-tiny mb-2 mt-6">Training days</div>
        <div className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_ORDER.map((wd) => {
            const on = focusByWeekday[wd] != null;
            return (
              <button
                key={wd}
                type="button"
                onClick={() => toggleDay(wd)}
                aria-pressed={on}
                aria-label={WEEKDAY_FULL[wd]}
                className={cn(
                  "rounded-xl border-2 py-2.5 text-center text-xs font-extrabold transition",
                  on
                    ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan"
                    : "border-white/[0.07] bg-white/[0.04] text-chalk-400 hover:bg-white/[0.08]",
                )}
              >
                {WEEKDAY_LABELS[wd]}
              </button>
            );
          })}
        </div>
        {selectedDays.length === 0 && (
          <p className="mt-2 text-xs text-chalk-500">
            Tap the days you want to train.
          </p>
        )}

        {/* Per-day focus */}
        {selectedDays.length > 0 && (
          <>
            <div className="label-tiny mb-2 mt-6">Focus per day</div>
            <div className="space-y-3">
              {selectedDays.map((d) => (
                <div
                  key={d.weekday}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="mb-2 text-sm font-extrabold text-chalk-100">
                    {WEEKDAY_FULL[d.weekday]}
                  </div>
                  <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
                    {FOCUS_PRESETS.map((p) => {
                      const active = d.focus === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setFocus(d.weekday, p.key)}
                          className={cn(
                            "shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-bold transition",
                            active
                              ? "text-ink-950"
                              : "border-white/[0.07] bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
                          )}
                          style={
                            active
                              ? { background: p.color, borderColor: p.color }
                              : undefined
                          }
                        >
                          <span className="mr-1">{p.icon}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 bg-ink-900/95 p-4 backdrop-blur">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!canCreate || pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent-cyan px-4 py-3 text-sm font-extrabold text-ink-950 shadow-glow transition hover:bg-accent-cyan/90 disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Building your plan…
            </>
          ) : !catalog ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading exercises…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Create program
              {selectedDays.length > 0 && (
                <span className="opacity-80">
                  · {selectedDays.length} day
                  {selectedDays.length > 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
        </button>
        {canCreate && !pending && (
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-chalk-500">
            <Check className="h-3 w-3" />
            Editable any time on the workout page
          </p>
        )}
      </div>
    </div>
  );
}
