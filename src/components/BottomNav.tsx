"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, Salad, Dumbbell, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS: {
  href: string;
  label: string;
  Icon: LucideIcon;
  activeColor: string;
}[] = [
  { href: "/overview", label: "Summary", Icon: CalendarDays, activeColor: "text-accent-blue" },
  { href: "/diet", label: "Nutrition", Icon: Salad, activeColor: "text-accent-orange" },
  { href: "/workout", label: "Fitness", Icon: Dumbbell, activeColor: "text-accent-green" },
];

export function BottomNav() {
  const pathname = usePathname();
  // Optimistic target: these are dynamic, server-rendered routes, so after a tap
  // nothing repaints until the next page's data arrives. Highlight the tapped
  // tab immediately (before navigation resolves) so the press feels instant,
  // then reconcile to the real pathname once it lands.
  const [target, setTarget] = useState<string | null>(null);
  useEffect(() => setTarget(null), [pathname]);
  const activePath = target ?? pathname;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-4 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <nav className="glass mx-auto flex max-w-sm items-stretch gap-1 rounded-full border border-white/[0.10] p-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)]">
        {TABS.map(({ href, label, Icon, activeColor }) => {
          const active = activePath === href || activePath.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              prefetch
              onClick={() => setTarget(href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-150 ease-ios active:scale-[0.94]",
                active ? "bg-white/[0.12]" : "hover:bg-white/[0.04]",
              )}
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors",
                  active ? activeColor : "text-chalk-400",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-[0.04em] transition-colors",
                  active ? activeColor : "text-chalk-400",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
