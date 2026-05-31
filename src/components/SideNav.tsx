"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Salad, Dumbbell, type LucideIcon } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { cn } from "@/lib/cn";

const TABS: {
  href: string;
  label: string;
  Icon: LucideIcon;
  activeColor: string;
  bgTint: string;
}[] = [
  { href: "/overview", label: "Summary", Icon: CalendarDays, activeColor: "text-accent-blue", bgTint: "bg-accent-blue/10" },
  { href: "/diet", label: "Nutrition", Icon: Salad, activeColor: "text-accent-orange", bgTint: "bg-accent-orange/10" },
  { href: "/workout", label: "Fitness", Icon: Dumbbell, activeColor: "text-accent-green", bgTint: "bg-accent-green/10" },
];

interface SideNavProps {
  weight: number;
  goalWeight: number;
  weeklyLoss: number;
}

export function SideNav({ weight, goalWeight, weeklyLoss }: SideNavProps) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col bg-ink-950 px-4 py-6 md:flex lg:w-64">
      <Link href="/overview" className="mb-10 inline-flex">
        <LogoMark />
      </Link>

      <nav className="flex flex-col gap-1">
        {TABS.map(({ href, label, Icon, activeColor, bgTint }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition-all duration-200 ease-ios active:scale-[0.98]",
                active
                  ? cn(bgTint, activeColor)
                  : "text-chalk-300 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto card p-4">
        <div className="metric-label">Progress</div>
        <div className="mt-1 text-base font-bold text-white">
          {weight} → {goalWeight} lb
        </div>
        <div className="text-[12px] font-semibold text-accent-blue">
          {weeklyLoss} lb/wk
        </div>
      </div>
    </aside>
  );
}
