import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/LogoMark";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { ArrowRight, ShieldCheck } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/overview");

  return (
    <div className="min-h-svh overflow-x-hidden">
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-4 pb-6 pt-safe-6 sm:px-6">
        <LogoMark />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero — full-bleed image+copy on mobile, side-by-side editorial split on lg+ */}
      <section className="relative isolate lg:mx-auto lg:max-w-6xl lg:px-6 lg:pt-10 lg:pb-28">
        {/* Mobile background image (lg:hidden) */}
        <div className="absolute inset-0 -z-10 lg:hidden">
          <Image
            src={HERO_IMAGE}
            alt="Athlete training outdoors at sunrise"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Top fade so the header + badge stay legible against bright sky */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/70 to-transparent" />
          {/* Bottom fade — heavy, so headline + CTAs sit on a solid ink wash */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/10" />
        </div>

        <div className="grid min-h-[calc(100svh-env(safe-area-inset-top)-80px)] gap-8 px-4 pb-10 sm:px-6 lg:min-h-0 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:px-0 lg:pb-0">
          {/* Copy column */}
          <div className="relative z-10 flex flex-col justify-end lg:justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent-blue/40 bg-accent-blue/[0.15] px-3 py-1 text-[11px] font-bold uppercase tracking-[2.5px] text-accent-cyan backdrop-blur-md lg:border-accent-blue/30 lg:bg-accent-blue/[0.10] lg:backdrop-blur-none">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
              Personal coach in your pocket
            </div>
            <h1 className="display text-balance text-5xl leading-[0.95] text-chalk-50 [text-shadow:0_2px_24px_rgba(8,11,16,0.6)] sm:text-6xl lg:text-7xl lg:[text-shadow:none] xl:text-8xl">
              TRAIN.
              <br />
              EAT.
              <br />
              RECOVER.{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">REPEAT.</span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-chalk-200 sm:text-lg lg:text-chalk-300">
              Kosmo Fitness builds your daily calorie target from your body and
              goals — then tells you exactly what to eat and how to move. Even
              suggests walks or cardio to close the gap when you go over.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-6 py-3.5 text-base">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3.5 text-base">
                I already have an account
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-chalk-300 lg:text-chalk-400">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-cyan" />
              No credit card · your data stays yours
            </div>

            {/* Mobile KPI proof card — sits inline below the CTAs as the bottom anchor */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-ink-950/85 p-4 backdrop-blur-xl lg:hidden">
              <KpiCardContent />
            </div>

            {/* Stat row — desktop only (kept off the mobile hero to avoid clutter) */}
            <dl className="mt-10 hidden max-w-md grid-cols-3 gap-6 border-t border-white/[0.08] pt-6 lg:grid">
              <Stat k="2,180" v="kcal target" />
              <Stat k="165g" v="protein/day" />
              <Stat k="6-day" v="training split" />
            </dl>
          </div>

          {/* Desktop image column */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900 lg:aspect-auto lg:h-full lg:min-h-[560px]">
              <Image
                src={HERO_IMAGE}
                alt="Athlete training outdoors at sunrise"
                fill
                sizes="50vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink-950/60 via-transparent to-transparent" />
              {/* Floating KPI card */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-ink-950/85 p-4 backdrop-blur-xl">
                <KpiCardContent />
              </div>
            </div>
            {/* Accent flare */}
            <div className="pointer-events-none absolute -inset-x-6 -top-6 -z-10 h-72 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,rgba(0,102,255,0.18),transparent_70%)]" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Mobile-only stat strip — moved out of the hero to keep the first screen tight */}
        <section className="border-t border-white/[0.06] py-8 lg:hidden">
          <dl className="grid grid-cols-3 gap-6">
            <Stat k="2,180" v="kcal target" />
            <Stat k="165g" v="protein/day" />
            <Stat k="6-day" v="training split" />
          </dl>
        </section>

        {/* Feature carousel */}
        <section className="pt-10 pb-16 lg:pt-0">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="label-eyebrow">Inside Kosmo Fitness</div>
              <h2 className="display mt-2 text-3xl text-chalk-50 sm:text-4xl">
                Built for the whole stack.
              </h2>
            </div>
            <div className="hidden text-xs uppercase tracking-[2px] text-chalk-400 sm:block">
              Swipe →
            </div>
          </div>
          <FeatureCarousel />
        </section>
      </main>

      <footer className="border-t border-white/[0.05] py-8 text-center text-xs uppercase tracking-[2px] text-chalk-500">
        © {new Date().getFullYear()} Kosmo Fitness
      </footer>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="display text-2xl text-chalk-50 sm:text-3xl">{k}</dt>
      <dd className="mt-1 text-[11px] uppercase tracking-[2px] text-chalk-400">
        {v}
      </dd>
    </div>
  );
}

function KpiCardContent() {
  return (
    <>
      <div className="label-eyebrow">Today</div>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="display text-4xl text-chalk-50">820</span>
        <span className="text-sm text-chalk-300">kcal left</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[62%] rounded-full bg-brand-gradient" />
      </div>
      <div className="mt-2 text-[11px] text-chalk-400">
        62% — walk 22 min to close the gap
      </div>
    </>
  );
}
