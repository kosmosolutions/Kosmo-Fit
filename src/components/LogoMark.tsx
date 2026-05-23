import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-brand-gradient text-white shadow-glow">
        <span className="font-display text-lg font-black">K</span>
      </div>
      <div className="leading-none">
        <div className="font-display text-[15px] font-black uppercase tracking-tight text-chalk-50">
          KOSMO FITNESS
        </div>
        <div className="mt-1 text-[9px] font-bold uppercase tracking-[2.5px] text-chalk-400">
          Train · Eat · Recover
        </div>
      </div>
    </div>
  );
}
