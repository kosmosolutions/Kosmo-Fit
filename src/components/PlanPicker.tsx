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
import { templateImage, focusImage } from "@/lib/cardImages";
import { dominantFocusKey } from "@/data/focus-presets";
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
  cyan: "bg-accent-cyan/20 text-accent-cyan",
  violet: "bg-accent-violet/20 text-accent-violet",
  amber: "bg-accent-amber/20 text-accent-amber",
  green: "bg-accent-green/20 text-accent-green",
  rose: "bg-accent-rose/20 text-accent-rose",
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a workout plan"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-ink-900 sm:h-[88vh] sm:max-w-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 p-5">
          <div>
            <div className="metric-label">Workout plan</div>
            <h2 className="display text-[26px] leading-tight text-white">
              Choose your program
            </h2>
            <p className="mt-1 text-[13px] font-medium text-chalk-400">
              Pick a template or one of your saved plans.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plan picker"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-800 text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-ink-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {error && (
            <div className="mb-4 rounded-xl bg-accent-rose/15 px-4 py-3 text-[13px] font-semibold text-accent-rose">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={() => setBuilding(true)}
            disabled={pending}
            className="mb-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-accent-green/15 px-5 text-[15px] font-semibold text-accent-green transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-accent-green/20 disabled:opacity-50"
          >
            <Wand2 className="h-4 w-4" />
            Create your own program
          </button>

          {plans.length > 0 && (
            <div className="mb-6">
              <div className="metric-label mb-3">Your plans</div>
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

          <div className="metric-label mb-3">Templates</div>
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
                image={templateImage(t.id)}
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
  // Card image: a built plan uses its dominant focus's photo; a snapshot plan
  // uses its base template's photo. Falls back to query/motif inside the hero.
  const focusKey = isBuilt ? dominantFocusKey(plan.days) : undefined;
  const heroImage = isBuilt
    ? focusKey
      ? focusImage(focusKey)
      : null
    : plan.base_template_id
      ? templateImage(plan.base_template_id)
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-ink-850 shadow-bento transition-all duration-200 ease-ios",
        isActive && "ring-2",
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
        className="block w-full text-left transition-all duration-200 ease-ios active:scale-[0.99]"
        aria-label={`Use ${plan.name}`}
      >
        <TemplateHero
          Icon={Icon}
          motif={motif}
          gradient={gradient}
          name={plan.name}
          tagline={isBuilt ? "Custom program" : "Saved plan"}
          active={isActive}
          image={heroImage}
          query={plan.name}
        />
      </button>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-full bg-accent-blue/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-blue">
            {isBuilt ? "Built" : "Custom"}
          </span>
          {isBuilt && dayCount != null && (
            <span className="inline-flex items-center rounded-full bg-ink-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-chalk-300">
              {dayCount} day{dayCount === 1 ? "" : "s"}
            </span>
          )}
          {!isBuilt && base && (
            <span className="inline-flex items-center rounded-full bg-ink-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-chalk-300">
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
              "btn flex-1 disabled:opacity-50",
              isActive
                ? "bg-ink-800 text-chalk-300 hover:bg-ink-700"
                : "text-black",
            )}
            style={isActive ? undefined : { background: accent }}
          >
            {isActive ? (
              <>
                <Check className="h-4 w-4" />
                Active
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-800 text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-ink-700 hover:text-white disabled:opacity-50"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            aria-label={`Delete ${plan.name}`}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-rose/15 text-accent-rose transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-rose/25 disabled:opacity-50"
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
  image?: string | null;
  query?: string;
}

function TemplateCard({
  template,
  isActive,
  isSelected,
  onSelect,
  onApply,
  pending,
  image,
  query,
}: CardProps) {
  const Icon = ICONS[template.icon] ?? Sparkles;
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-ink-850 shadow-bento transition-all duration-200 ease-ios",
        isActive && "ring-2",
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
        className="block w-full text-left transition-all duration-200 ease-ios active:scale-[0.99]"
        aria-label={`Select ${template.name}`}
      >
        <TemplateHero
          Icon={Icon}
          motif={template.motif}
          gradient={template.gradient}
          name={template.name}
          tagline={template.tagline}
          active={isActive}
          image={image}
          query={query}
        />
      </button>

      <div className="space-y-3 p-4">
        <p className="line-clamp-3 text-[13px] font-medium leading-relaxed text-chalk-300">
          {template.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {template.badges.map((b) => (
            <span
              key={b.label}
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
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
            "btn w-full disabled:opacity-50",
            isActive
              ? "bg-ink-800 text-chalk-300 hover:bg-ink-700"
              : "text-black",
          )}
          style={isActive ? undefined : { background: template.accent }}
        >
          {isActive ? (
            <>
              <Check className="h-4 w-4" />
              Active
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
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-ink-850 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="metric-label">Heads up</div>
        <h3 className="mt-1 text-[20px] font-bold tracking-tight text-white">
          {title}
        </h3>
        <p className="mt-2 text-[14px] font-medium text-chalk-300">{body}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="btn flex-1 bg-accent-rose text-white hover:brightness-110 disabled:opacity-50"
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
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-ink-850 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="metric-label">Plan name</div>
        <h3 className="mt-1 text-[20px] font-bold tracking-tight text-white">
          {title}
        </h3>
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
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn-secondary flex-1 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(trimmed)}
            disabled={pending || !trimmed}
            className="btn flex-1 bg-accent-blue text-white hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
