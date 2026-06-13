import { cn } from "@/lib/cn";

// FatSecret's API license (Basic / Premier Free) requires visible attribution
// linking back to www.fatsecret.com wherever their content is shown — and, for
// login-gated apps, in at least one place reachable without logging in. Keep
// the casing as the lowercase "fatsecret" wordmark per their brand guidelines.
export function FatSecretAttribution({ className }: { className?: string }) {
  return (
    <a
      href="https://www.fatsecret.com"
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold text-chalk-500 transition hover:text-chalk-300",
        className,
      )}
    >
      Powered by <span className="font-bold text-accent-cyan">fatsecret</span>
    </a>
  );
}
