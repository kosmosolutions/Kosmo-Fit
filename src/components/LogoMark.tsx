import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-accent-cyan to-accent-violet text-ink-950">
        <span className="text-base font-black">K</span>
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-extrabold tracking-tight text-chalk-50">
          Kosmo Fitness
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[2px] text-chalk-400">
          Your fitness OS
        </div>
      </div>
    </div>
  );
}
