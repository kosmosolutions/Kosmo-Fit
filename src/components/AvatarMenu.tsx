"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/cn";

interface AvatarMenuProps {
  fullName: string | null;
  email: string;
}

function initials(fullName: string | null, email: string): string {
  const source = (fullName ?? email).trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function AvatarMenu({ fullName, email }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border border-accent-lime/30",
          "bg-accent-lime/15",
          "text-[12px] font-extrabold tracking-wide text-accent-lime",
          "transition hover:bg-accent-lime/25",
          open && "ring-2 ring-accent-lime/40",
        )}
      >
        {initials(fullName, email)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-card"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="truncate text-sm font-bold text-chalk-50">
              {fullName?.trim() || "Account"}
            </div>
            <div className="truncate text-xs text-chalk-400">{email}</div>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-chalk-200 transition hover:bg-white/[0.04] hover:text-chalk-50"
          >
            <User className="h-4 w-4 text-chalk-400" />
            Profile & settings
          </Link>
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 border-t border-white/[0.06] px-4 py-2.5 text-left text-sm font-semibold text-chalk-200 transition hover:bg-accent-rose/10 hover:text-accent-rose"
            >
              <LogOut className="h-4 w-4 text-chalk-400" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
