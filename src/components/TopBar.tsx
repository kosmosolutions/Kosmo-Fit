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
      className="sticky top-0 z-20 border-b border-white/[0.07] bg-ink-950/90 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:max-w-5xl md:px-8 lg:max-w-6xl">
        <Link href="/overview" className="md:hidden">
          <LogoMark />
        </Link>
        <div className="md:hidden text-right leading-tight">
          <div className="text-[10px] uppercase tracking-[2px] text-chalk-500">
            Progress
          </div>
          <div className="text-[13px] font-extrabold text-chalk-100">
            {weight} → {goalWeight} lbs
          </div>
          <div className="text-[10px] text-accent-cyan">
            {weeklyLoss} lbs/wk
          </div>
        </div>
        <div className="hidden flex-1 md:block" />
        <AvatarMenu fullName={fullName} email={email} />
      </div>
    </header>
  );
}
