import { LogoMark } from "./LogoMark";
import { AvatarMenu } from "./AvatarMenu";
import { MoveRight, TrendingDown, TrendingUp } from "lucide-react";
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
  const losing = weight > goalWeight;
  const TrendIcon = losing ? TrendingDown : TrendingUp;
  return (
    <header
      className="sticky top-0 z-20 bg-ink-950/80 backdrop-blur-xl"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:max-w-5xl md:px-8 lg:max-w-6xl">
        <Link href="/overview" className="md:hidden">
          <LogoMark compact />
        </Link>
        <div className="md:hidden flex items-center gap-2">
          <Link
            href="/profile"
            aria-label={`Progress: ${weight} to ${goalWeight} pounds, ${weeklyLoss} per week`}
            className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-3 transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-white/[0.09]"
          >
            <TrendIcon className="h-3.5 w-3.5 text-accent-green" />
            <span className="flex items-center gap-1 text-[12px] font-bold leading-none text-white">
              {Math.round(weight)}
              <MoveRight className="h-3 w-3 text-chalk-500" />
              {Math.round(goalWeight)}
              <span className="font-semibold text-chalk-400">lb</span>
            </span>
          </Link>
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
