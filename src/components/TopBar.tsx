import { LogoMark } from "./LogoMark";
import { AvatarMenu } from "./AvatarMenu";
import Link from "next/link";

interface TopBarProps {
  weight: number;
  goalWeight: number;
  weeklyLoss: number;
  fullName: string | null;
  email: string;
}

export function TopBar({
  weight,
  goalWeight,
  weeklyLoss,
  fullName,
  email,
}: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-20 bg-ink-950/80 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:max-w-5xl md:px-8 lg:max-w-6xl">
        <Link href="/overview" className="md:hidden">
          <LogoMark />
        </Link>
        <div className="md:hidden flex items-center gap-3">
          <div className="text-right leading-tight">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-400">
              Progress
            </div>
            <div className="text-[13px] font-bold text-white">
              {weight} → {goalWeight} lb
            </div>
            <div className="text-[11px] font-semibold text-accent-blue">
              {weeklyLoss} lb/wk
            </div>
          </div>
          <AvatarMenu fullName={fullName} email={email} />
        </div>
        <div className="hidden flex-1 md:block" />
        <div className="hidden md:block">
          <AvatarMenu fullName={fullName} email={email} />
        </div>
      </div>
    </header>
  );
}
