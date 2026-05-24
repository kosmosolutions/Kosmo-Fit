"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Check,
  Sparkles,
  Dumbbell,
  LayoutGrid,
  Flame,
  Repeat,
  Zap,
  Anchor,
  PersonStanding,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { applyTemplate } from "@/lib/actions/workout-plan";
import {
  WORKOUT_TEMPLATES,
  type WorkoutTemplate,
  type TemplateBadge,
} from "@/data/workout-templates";

const ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Dumbbell,
  LayoutGrid,
  Flame,
  Repeat,
  Zap,
  Anchor,
  PersonStanding,
};

const BADGE_CLASSES: Record<TemplateBadge["tone"], string> = {
  cyan: "border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan",
  violet: "border-accent-violet/30 bg-accent-violet/10 text-accent-violet",
  amber: "border-accent-amber/30 bg-accent-amber/10 text-accent-amber",
  green: "border-accent-green/30 bg-accent-green/10 text-accent-green",
  rose: "border-accent-rose/30 bg-accent-rose/10 text-accent-rose",
};

interface Props {
  open: boolean;
  onClose: () => void;
  activeTemplateId: string | null;
  hasCustomizations: boolean;
}

export function PlanPicker({
  open,
  onClose,
  activeTemplateId,
  hasCustomizations,
}: Props) {
  const [selected, setSelected] = useState<string | null>(activeTemplateId);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(activeTemplateId);
      setConfirming(null);
      setError(null);
    }
  }, [open, activeTemplateId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function handleApply(templateId: string) {
    // If switching templates and the user has customized any day, ask
    // for confirmation before wiping their edits. Re-selecting the
    // current template is a no-op.
    if (templateId === activeTemplateId) {
      onClose();
      return;
    }
    if (hasCustomizations) {
      setConfirming(templateId);
      return;
    }
    runApply(templateId);
  }

  function runApply(templateId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await applyTemplate(templateId);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not apply template");
        setConfirming(null);
      }
    });
  }

  const confirmTemplate = confirming
    ? WORKOUT_TEMPLATES.find((t) => t.id === confirming)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a workout plan"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-ink-900 sm:h-[88vh] sm:max-w-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 bg-ink-900/95 p-5 backdrop-blur">
          <div>
            <div className="label-tiny">Workout plan</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-chalk-50">
              Choose your program
            </h2>
            <p className="mt-1 text-sm text-chalk-400">
              Pick a structured template — switch any time.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plan picker"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-chalk-300 transition hover:bg-white/[0.08] hover:text-chalk-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
              {error}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {WORKOUT_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isActive={t.id === activeTemplateId}
                isSelected={t.id === selected}
                onSelect={() => setSelected(t.id)}
                onApply={() => handleApply(t.id)}
                pending={pending && confirming === null}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Confirm wipe */}
      {confirmTemplate && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur"
          onClick={(e) => {
            e.stopPropagation();
            if (!pending) setConfirming(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="label-tiny">Heads up</div>
            <h3 className="mt-1 text-lg font-extrabold text-chalk-50">
              Switch to {confirmTemplate.name}?
            </h3>
            <p className="mt-2 text-sm text-chalk-300">
              You&apos;ve customized some days. Switching will replace them
              with the new template&apos;s exercises.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={pending}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-chalk-200 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => runApply(confirmTemplate.id)}
                disabled={pending}
                className="flex-1 rounded-xl bg-accent-rose px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-accent-rose/90 disabled:opacity-50"
              >
                {pending ? "Switching…" : "Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CardProps {
  template: WorkoutTemplate;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
  pending: boolean;
}

function TemplateCard({
  template,
  isActive,
  isSelected,
  onSelect,
  onApply,
  pending,
}: CardProps) {
  const Icon = ICONS[template.icon] ?? Sparkles;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-ink-900 transition",
        isActive
          ? "border-white/20 ring-2 ring-offset-2 ring-offset-ink-900"
          : "border-white/10 hover:border-white/20",
      )}
      style={
        isActive
          ? ({
              ["--tw-ring-color" as string]: template.accent,
            } as React.CSSProperties)
          : undefined
      }
    >
      {/* Hero — gradient with large icon + tagline */}
      <button
        type="button"
        onClick={onSelect}
        className="relative block h-32 w-full overflow-hidden text-left"
        style={{
          background: `linear-gradient(135deg, ${template.gradient.from}, ${template.gradient.to})`,
        }}
        aria-label={`Select ${template.name}`}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-black/30 blur-3xl" />
        <div className="relative flex h-full items-end justify-between p-4 text-ink-950">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[3px] text-ink-950/75">
              {template.tagline}
            </div>
            <div className="mt-0.5 text-xl font-black leading-tight tracking-tight">
              {template.name}
            </div>
          </div>
          <Icon className="h-12 w-12 shrink-0 text-ink-950/80" strokeWidth={1.5} />
        </div>
        {isActive && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-chalk-50">
            <Check className="h-3 w-3" />
            Active
          </div>
        )}
      </button>

      {/* Body */}
      <div className="space-y-3 p-4">
        <p className="line-clamp-3 text-[12.5px] leading-relaxed text-chalk-300">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {template.badges.map((b) => (
            <span
              key={b.label}
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                BADGE_CLASSES[b.tone],
              )}
            >
              {b.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          onClick={onApply}
          disabled={pending}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-50",
            isActive
              ? "border border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]"
              : "text-ink-950 shadow-glow",
          )}
          style={
            isActive
              ? undefined
              : { background: template.accent }
          }
        >
          {isActive ? (
            <>
              <Check className="h-4 w-4" />
              Currently active
            </>
          ) : (
            <>{pending && isSelected ? "Applying…" : "Use this plan"}</>
          )}
        </button>
      </div>
    </div>
  );
}
