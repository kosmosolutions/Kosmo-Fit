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
          "flex h-10 w-10 items-center justify-center rounded-full",
          "bg-accent-blue/20",
          "text-[13px] font-bold text-accent-blue",
          "transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-blue/30",
          open && "ring-2 ring-accent-blue/40",
        )}
      >
        {initials(fullName, email)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl bg-ink-850 shadow-bento"
        >
          <div className="px-4 py-3">
            <div className="truncate text-[14px] font-semibold text-white">
              {fullName?.trim() || "Account"}
            </div>
            <div className="truncate text-[12px] font-medium text-chalk-400">
              {email}
            </div>
          </div>
          <div className="h-px w-full bg-white/[0.06]" />
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex min-h-[44px] items-center gap-2.5 px-4 text-[14px] font-semibold text-chalk-200 transition hover:bg-white/[0.04] hover:text-white"
          >
            <User className="h-4 w-4 text-chalk-400" />
            Profile & settings
          </Link>
          <div className="h-px w-full bg-white/[0.06]" />
          <form action="/auth/logout" method="post">
            <button
              type="submit"
              className="flex min-h-[44px] w-full items-center gap-2.5 px-4 text-left text-[14px] font-semibold text-chalk-200 transition hover:bg-accent-rose/15 hover:text-accent-rose"
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
