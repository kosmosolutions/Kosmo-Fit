"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Salad, Dumbbell, User } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/overview", label: "Overview", Icon: CalendarDays },
  { href: "/diet", label: "Diet", Icon: Salad },
  { href: "/workout", label: "Workout", Icon: Dumbbell },
  { href: "/profile", label: "Profile", Icon: User },
];

interface SideNavProps {
  weight: number;
  goalWeight: number;
  weeklyLoss: number;
}

export function SideNav({ weight, goalWeight, weeklyLoss }: SideNavProps) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-white/[0.07] bg-ink-950/80 px-4 py-6 md:flex lg:w-64">
      <Link href="/overview" className="mb-8 inline-flex">
        <LogoMark />
      </Link>

      <nav className="flex flex-col gap-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-accent-cyan/10 text-accent-cyan"
                  : "text-chalk-300 hover:bg-white/[0.04] hover:text-chalk-100",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <div className="text-[10px] uppercase tracking-[2px] text-chalk-500">
          Progress
        </div>
        <div className="mt-1 text-sm font-extrabold text-chalk-100">
          {weight} → {goalWeight} lbs
        </div>
        <div className="text-[11px] text-accent-cyan">{weeklyLoss} lbs/wk</div>
      </div>
    </aside>
  );
}
