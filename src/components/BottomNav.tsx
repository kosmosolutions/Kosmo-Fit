"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Salad, Dumbbell, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/overview", label: "Overview", Icon: CalendarDays },
  { href: "/diet", label: "Diet", Icon: Salad },
  { href: "/workout", label: "Workout", Icon: Dumbbell },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 px-4 md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
    >
      <nav className="mx-auto flex max-w-sm items-stretch gap-1 rounded-[26px] border border-white/10 bg-ink-900/80 p-1.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-[20px] py-2 transition-colors",
                active ? "bg-white/[0.10]" : "hover:bg-white/[0.04]",
              )}
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] transition-colors",
                  active ? "text-accent-cyan" : "text-chalk-500",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-bold tracking-wide transition-colors",
                  active ? "text-accent-cyan" : "text-chalk-500",
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
