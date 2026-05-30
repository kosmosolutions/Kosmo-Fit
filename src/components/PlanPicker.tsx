"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Check,
  Wand2,
  Pencil,
  Trash2,
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
import {
  applyTemplate,
  applyPlan,
  deletePlan,
  renamePlan,
  type WorkoutPlanRow,
} from "@/lib/actions/workout-plan";
import { TemplateHero } from "./TemplateHero";
import { PlanBuilder } from "./PlanBuilder";
import {
  WORKOUT_TEMPLATES,
  getTemplate,
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
  plans: WorkoutPlanRow[];
  activePlanId: string | null;
  hasCustomizations: boolean;
}

export function PlanPicker({
  open,
  onClose,
  activeTemplateId,
  plans,
  activePlanId,
  hasCustomizations,
}: Props) {
  const [selected, setSelected] = useState<string | null>(activeTemplateId);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<WorkoutPlanRow | null>(null);
  const [renaming, setRenaming] = useState<WorkoutPlanRow | null>(null);
  const [building, setBuilding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelected(activeTemplateId);
      setConfirming(null);
      setDeleting(null);
      setRenaming(null);
      setBuilding(false);
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

  function handleApplyTemplate(templateId: string) {
    // Re-selecting the active stock template is a no-op. Switching when the
    // user has scratch customizations asks before wiping them.
    if (templateId === activeTemplateId && !activePlanId) {
      onClose();
      return;
    }
    if (hasCustomizations && !activePlanId) {
      setConfirming(templateId);
      return;
    }
    runApplyTemplate(templateId);
  }

  function runApplyTemplate(templateId: string) {
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

  function runApplyPlan(planId: string) {
    if (planId === activePlanId) {
      onClose();
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await applyPlan(planId);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not switch plan");
      }
    });
  }

  function runDeletePlan(plan: WorkoutPlanRow) {
    setError(null);
    startTransition(async () => {
      try {
        await deletePlan(plan.id);
        setDeleting(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not delete plan");
      }
    });
  }

  function runRename(name: string) {
    if (!renaming) return;
    setError(null);
    startTransition(async () => {
      try {
        await renamePlan(renaming.id, name);
        setRenaming(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not rename plan");
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
              Pick a template or one of your saved plans — switch any time.
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {error && (
            <div className="mb-4 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
              {error}
            </div>
          )}

          {/* Create your own program */}
          <button
            type="button"
            onClick={() => setBuilding(true)}
            disabled={pending}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-accent-cyan/40 bg-accent-cyan/[0.06] px-4 py-3 text-sm font-extrabold text-accent-cyan transition hover:bg-accent-cyan/[0.12] disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            Create your own program
          </button>

          {/* Saved plans */}
          {plans.length > 0 && (
            <div className="mb-6">
              <div className="label-tiny mb-2">Your plans</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => (
                  <SavedPlanCard
                    key={plan.id}
                    plan={plan}
                    isActive={plan.id === activePlanId}
                    onApply={() => runApplyPlan(plan.id)}
                    onRename={() => setRenaming(plan)}
                    onDelete={() => setDeleting(plan)}
                    pending={pending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stock templates */}
          <div className="label-tiny mb-2">Templates</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {WORKOUT_TEMPLATES.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isActive={t.id === activeTemplateId}
                isSelected={t.id === selected}
                onSelect={() => setSelected(t.id)}
                onApply={() => handleApplyTemplate(t.id)}
                pending={pending && confirming === null}
                query={t.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Confirm template wipe */}
      {confirmTemplate && (
        <ConfirmModal
          title={`Switch to ${confirmTemplate.name}?`}
          body="You've customized some days. Switching will replace them with the new template's exercises."
          confirmLabel={pending ? "Switching…" : "Switch"}
          pending={pending}
          onCancel={() => !pending && setConfirming(null)}
          onConfirm={() => runApplyTemplate(confirmTemplate.id)}
        />
      )}

      {/* Confirm plan delete */}
      {deleting && (
        <ConfirmModal
          title={`Delete "${deleting.name}"?`}
          body="This saved plan and its exercises will be removed. This can't be undone."
          confirmLabel={pending ? "Deleting…" : "Delete"}
          pending={pending}
          onCancel={() => !pending && setDeleting(null)}
          onConfirm={() => runDeletePlan(deleting)}
        />
      )}

      {/* Rename plan */}
      {renaming && (
        <NameModal
          title="Rename plan"
          initial={renaming.name}
          confirmLabel="Rename"
          pending={pending}
          onCancel={() => !pending && setRenaming(null)}
          onConfirm={runRename}
        />
      )}

      {/* Create-your-own builder */}
      <PlanBuilder
        open={building}
        onClose={() => setBuilding(false)}
        onCreated={() => {
          setBuilding(false);
          onClose();
        }}
      />
    </div>
  );
}

// ─── Saved plan card ──────────────────────────────────────────────────────

interface SavedPlanCardProps {
  plan: WorkoutPlanRow;
  isActive: boolean;
  onApply: () => void;
  onRename: () => void;
  onDelete: () => void;
  pending: boolean;
}

function SavedPlanCard({
  plan,
  isActive,
  onApply,
  onRename,
  onDelete,
  pending,
}: SavedPlanCardProps) {
  const isBuilt = plan.is_built;
  const base = plan.base_template_id
    ? getTemplate(plan.base_template_id)
    : undefined;
  const Icon = (base && ICONS[base.icon]) ?? Sparkles;
  const accent = base?.accent ?? "#22d3ee";
  const gradient = base?.gradient ?? { from: "#22d3ee", to: "#a78bfa" };
  const motif = base?.motif ?? "burst";
  const dayCount = isBuilt ? (plan.days?.length ?? 0) : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-ink-900 transition",
        isActive
          ? "border-white/20 ring-2 ring-offset-2 ring-offset-ink-900"
          : "border-white/10 hover:border-white/20",
      )}
      style={
        isActive
          ? ({ ["--tw-ring-color" as string]: accent } as React.CSSProperties)
          : undefined
      }
    >
      <button
        type="button"
        onClick={onApply}
        className="block w-full text-left"
        aria-label={`Use ${plan.name}`}
      >
        <TemplateHero
          Icon={Icon}
          motif={motif}
          gradient={gradient}
          name={plan.name}
          tagline={isBuilt ? "Custom program" : "Saved plan"}
          active={isActive}
          query={plan.name}
        />
      </button>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
            {isBuilt ? "Built" : "Custom"}
          </span>
          {isBuilt && dayCount != null && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-300">
              {dayCount} day{dayCount === 1 ? "" : "s"}
            </span>
          )}
          {!isBuilt && base && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-300">
              Based on {base.name}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApply}
            disabled={pending}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-extrabold transition disabled:opacity-50",
              isActive
                ? "border border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]"
                : "text-ink-950 shadow-glow",
            )}
            style={isActive ? undefined : { background: accent }}
          >
            {isActive ? (
              <>
                <Check className="h-4 w-4" />
                Currently active
              </>
            ) : (
              "Use this plan"
            )}
          </button>
          <button
            type="button"
            onClick={onRename}
            disabled={pending}
            aria-label={`Rename ${plan.name}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-chalk-300 transition hover:bg-white/[0.08] hover:text-chalk-50 disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label={`Delete ${plan.name}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent-rose/25 bg-accent-rose/10 text-accent-rose transition hover:bg-accent-rose/20 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stock template card ──────────────────────────────────────────────────

interface CardProps {
  template: WorkoutTemplate;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onApply: () => void;
  pending: boolean;
  query?: string;
}

function TemplateCard({
  template,
  isActive,
  isSelected,
  onSelect,
  onApply,
  pending,
  query,
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
      <button
        type="button"
        onClick={onSelect}
        className="block w-full text-left"
        aria-label={`Select ${template.name}`}
      >
        <TemplateHero
          Icon={Icon}
          motif={template.motif}
          gradient={template.gradient}
          name={template.name}
          tagline={template.tagline}
          active={isActive}
          query={query}
        />
      </button>

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
          style={isActive ? undefined : { background: template.accent }}
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

// ─── Shared modals ────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label-tiny">Heads up</div>
        <h3 className="mt-1 text-lg font-extrabold text-chalk-50">{title}</h3>
        <p className="mt-2 text-sm text-chalk-300">{body}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-chalk-200 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 rounded-xl bg-accent-rose px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-accent-rose/90 disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function NameModal({
  title,
  initial,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  initial: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="label-tiny">Plan name</div>
        <h3 className="mt-1 text-lg font-extrabold text-chalk-50">{title}</h3>
        <input
          autoFocus
          value={value}
          maxLength={40}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed && !pending) onConfirm(trimmed);
          }}
          placeholder="e.g. Summer Cut, My PPL Tweaks"
          className="field mt-3 w-full"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-chalk-200 transition hover:bg-white/[0.08] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={pending || !trimmed}
            className="flex-1 rounded-xl bg-accent-cyan px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-accent-cyan/90 disabled:opacity-50"
          >
            {pending ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
