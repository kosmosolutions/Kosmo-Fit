import { cn } from "@/lib/cn";

// Recipe visual: the Pexels photo when one was matched offline, otherwise the
// category emoji over its gradient. `children` renders on top (badges, close
// button). Plain <img> mirrors the existing food-image pattern so we don't need
// next/image remotePatterns config for the Pexels CDN.
export function RecipeHero({
  image,
  emoji,
  gradient,
  className,
  emojiClassName,
  children,
}: {
  image?: string | null;
  emoji: string;
  gradient: string;
  className?: string;
  emojiClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-gradient-to-br",
        gradient,
        className,
      )}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-ink-900/40" />
          <span className={cn("relative drop-shadow-lg", emojiClassName)}>
            {emoji}
          </span>
        </>
      )}
      {children}
    </div>
  );
}
