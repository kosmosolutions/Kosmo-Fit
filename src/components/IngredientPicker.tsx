"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Barcode,
  ChevronRight,
  Loader2,
  PencilLine,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  lookupBarcode,
  searchFoods,
  type FoodItem,
  type FoodUnit,
} from "@/lib/foods";

const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 p-10 text-xs text-chalk-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading scanner…
      </div>
    ),
  },
);

export interface PickedIngredient {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const DEBOUNCE_MS = 350;

/**
 * Modal for adding a recipe ingredient. Searches USDA by name, looks up
 * packaged items by barcode, or falls back to a fully custom entry when the
 * food isn't in either database. Returns the ingredient + its macros so the
 * recipe form can sum nutrition automatically.
 */
export function IngredientPicker({
  onAdd,
  onClose,
}: {
  onAdd: (ing: PickedIngredient) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [custom, setCustom] = useState(false);
  useBodyScrollLock(true);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (scanning) setScanning(false);
      else if (picked) setPicked(null);
      else if (custom) setCustom(false);
      else onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [scanning, picked, custom, onClose]);

  useEffect(() => {
    if (picked || scanning || custom) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      searchFoods(q, controller.signal)
        .then((foods) => {
          if (!controller.signal.aborted) setResults(foods);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (err instanceof Error && err.name === "AbortError") return;
          setError(String(err));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, picked, scanning, custom]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function handleBarcode(code: string) {
    setScanning(false);
    setScanError(null);
    try {
      const product = await lookupBarcode(code);
      if (!product) {
        setScanError(`No food for barcode ${code}. Try search or custom.`);
        return;
      }
      setPicked(product);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add ingredient"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-ink-900 sm:h-auto sm:max-h-[88svh] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+1.25rem)] sm:pt-5">
          <div className="text-[18px] font-bold tracking-tight text-white">
            Add ingredient
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-ink-800 text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-ink-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-1">
          {scanning ? (
            <BarcodeScanner
              onDetect={handleBarcode}
              onCancel={() => setScanning(false)}
            />
          ) : custom ? (
            <CustomIngredient
              onBack={() => setCustom(false)}
              onAdd={(ing) => {
                onAdd(ing);
                onClose();
              }}
            />
          ) : picked ? (
            <IngredientDetail
              food={picked}
              onBack={() => setPicked(null)}
              onAdd={(ing) => {
                onAdd(ing);
                onClose();
              }}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search foods (e.g. oats, chicken)"
                    className="field pl-9"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScanError(null);
                    setScanning(true);
                  }}
                  className="rounded-xl border border-accent-cyan/40 bg-accent-cyan/10 p-2.5 text-accent-cyan transition hover:bg-accent-cyan/20"
                  aria-label="Scan barcode"
                >
                  <Barcode className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCustom(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-chalk-200 transition hover:bg-white/[0.07]"
              >
                <PencilLine className="h-4 w-4" /> Add custom ingredient
              </button>

              {scanError && (
                <div className="rounded-xl border border-dashed border-accent-rose/40 p-3 text-center text-xs text-accent-rose">
                  {scanError}
                </div>
              )}

              <div className="space-y-2">
                {error ? (
                  <div className="rounded-xl border border-dashed border-accent-rose/40 p-6 text-center text-xs text-accent-rose">
                    {error}
                  </div>
                ) : query.trim().length < 2 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-chalk-400">
                    Search USDA foods, scan a barcode, or add a custom
                    ingredient.
                  </div>
                ) : loading ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-6 text-xs text-chalk-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                  </div>
                ) : results.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-chalk-400">
                    No foods found. Try a custom ingredient.
                  </div>
                ) : (
                  results.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setPicked(f)}
                      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-accent-cyan/40 hover:bg-white/[0.06]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="line-clamp-2 text-[13px] font-bold leading-snug text-chalk-50">
                          {f.name}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-chalk-400">
                          {f.brand && <span>{f.brand} · </span>}
                          {f.units[0]
                            ? `${Math.round(f.units[0].kcal)} cal · ${f.units[0].label}`
                            : "No nutrition data"}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-chalk-400" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IngredientDetail({
  food,
  onBack,
  onAdd,
}: {
  food: FoodItem;
  onBack: () => void;
  onAdd: (ing: PickedIngredient) => void;
}) {
  const units = food.units;
  const [unitIdx, setUnitIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const unit: FoodUnit | undefined = units[unitIdx];

  if (!unit) {
    return (
      <div className="space-y-4">
        <BackBtn onBack={onBack} />
        <div className="rounded-xl border border-dashed border-accent-rose/40 p-6 text-center text-xs text-accent-rose">
          No nutrition data for this food.
        </div>
      </div>
    );
  }

  const kcal = unit.kcal * qty;
  const protein = unit.protein * qty;
  const carbs = unit.carbs * qty;
  const fat = unit.fat * qty;
  const name = food.brand ? `${food.brand} — ${food.name}` : food.name;

  return (
    <div className="space-y-4">
      <BackBtn onBack={onBack} />
      <div className="text-sm font-extrabold leading-snug text-chalk-50">
        {food.name}
      </div>

      {units.length > 1 && (
        <div>
          <div className="label-tiny mb-1.5">Unit</div>
          <div className="flex flex-wrap gap-1.5">
            {units.map((u, i) => (
              <button
                key={u.label}
                type="button"
                onClick={() => setUnitIdx(i)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] font-bold transition",
                  i === unitIdx
                    ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
                    : "border-white/10 bg-white/[0.04] text-chalk-300",
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div>
          <div className="label-tiny">Quantity</div>
          <div className="text-[11px] text-chalk-400">× {unit.label}</div>
        </div>
        <input
          type="number"
          step={0.1}
          min={0.1}
          value={qty}
          onChange={(e) => setQty(Math.max(0.1, parseFloat(e.target.value) || 1))}
          className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-right text-sm font-bold text-chalk-50 outline-none"
        />
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center">
        <Stat label="kcal" value={Math.round(kcal)} color="#f59e0b" />
        <Stat label="P" value={`${Math.round(protein)}g`} color="#a78bfa" />
        <Stat label="C" value={`${Math.round(carbs)}g`} color="#22d3ee" />
        <Stat label="F" value={`${Math.round(fat)}g`} color="#fbbf24" />
      </div>

      <button
        type="button"
        onClick={() =>
          onAdd({
            name,
            amount: qty === 1 ? unit.label : `${qty} × ${unit.label}`,
            kcal,
            protein,
            carbs,
            fat,
          })
        }
        className="btn-primary w-full py-3"
      >
        Add to recipe
      </button>
    </div>
  );
}

function CustomIngredient({
  onBack,
  onAdd,
}: {
  onBack: () => void;
  onAdd: (ing: PickedIngredient) => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [macros, setMacros] = useState({ kcal: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="space-y-3">
      <BackBtn onBack={onBack} />
      <label className="block">
        <span className="label-tiny">Ingredient</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. olive oil"
          className="field mt-1"
        />
      </label>
      <label className="block">
        <span className="label-tiny">Amount</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 1 tbsp"
          className="field mt-1"
        />
      </label>
      <div className="grid grid-cols-4 gap-2">
        <CustomNum label="kcal" value={macros.kcal} onChange={(v) => setMacros({ ...macros, kcal: v })} />
        <CustomNum label="P" value={macros.protein} onChange={(v) => setMacros({ ...macros, protein: v })} />
        <CustomNum label="C" value={macros.carbs} onChange={(v) => setMacros({ ...macros, carbs: v })} />
        <CustomNum label="F" value={macros.fat} onChange={(v) => setMacros({ ...macros, fat: v })} />
      </div>
      <div className="text-[11px] text-chalk-500">
        Macros optional — leave at 0 if you just want the line listed.
      </div>
      <button
        type="button"
        disabled={!name.trim()}
        onClick={() =>
          onAdd({
            name: name.trim(),
            amount: amount.trim(),
            kcal: macros.kcal,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
          })
        }
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        Add to recipe
      </button>
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Back
    </button>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-1.5 py-1.5">
      <div className="text-[9px] font-bold uppercase tracking-wider text-chalk-400">
        {label}
      </div>
      <div className="text-[13px] font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function CustomNum({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2">
      <span className="text-[9px] font-bold uppercase tracking-wider text-chalk-400">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={0.1}
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder="0"
        className="mt-0.5 w-full border-none bg-transparent p-0 text-sm font-extrabold text-chalk-50 outline-none placeholder:text-chalk-600"
      />
    </label>
  );
}
