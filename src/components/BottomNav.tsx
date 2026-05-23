"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Salad, Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/overview", label: "Overview", Icon: CalendarDays },
  { href: "/diet", label: "Diet", Icon: Salad },
  { href: "/workout", label: "Workout", Icon: Dumbbell },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.07] bg-ink-950/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-3xl">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 border-t-2 border-transparent py-2.5 transition-colors",
                active && "border-accent-blue",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-accent-blue" : "text-chalk-500",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  active ? "text-accent-blue" : "text-chalk-500",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
