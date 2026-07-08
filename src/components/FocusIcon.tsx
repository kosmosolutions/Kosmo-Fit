import {
  Activity,
  BicepsFlexed,
  Dumbbell,
  Footprints,
  HeartPulse,
  MoonStar,
  PersonStanding,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Map a free-form day focus ("Push (Heavy)", "Back + Biceps", "Cardio", …)
 * to a crisp vector icon. The workout data files carry emoji per day; emoji
 * read as informal in UI chrome, so screens render this instead.
 */
export function focusIcon(focus: string): LucideIcon {
  const f = focus.toLowerCase();
  if (f.includes("rest")) return MoonStar;
  if (/hiit|sprint|interval/.test(f)) return Zap;
  if (f.includes("cardio")) return HeartPulse;
  if (/leg|lower|glute|calf|calv/.test(f)) return Footprints;
  if (/pull|back|arm|bicep|tricep/.test(f)) return BicepsFlexed;
  if (/core|abs/.test(f) && !/[+&]/.test(f)) return Activity;
  if (/full/.test(f)) return PersonStanding;
  return Dumbbell;
}

export function FocusIcon({
  focus,
  className,
  style,
}: {
  focus: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = focusIcon(focus);
  return <Icon className={className} style={style} aria-hidden />;
}
