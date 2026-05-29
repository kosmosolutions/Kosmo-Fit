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
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-6 pt-safe-6 sm:px-6">
        <LogoMark />
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/login" className="btn-ghost shrink-0">
            Log in
          </Link>
          {/* Primary signup lives in the hero on mobile — keep the header
              uncrowded; show it here only from sm up. */}
          <Link href="/signup" className="btn-primary hidden shrink-0 sm:inline-flex">
            Start free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero — one clean focal image with a single bottom scrim. Nothing
          floats on top of the photo on mobile; copy sits on the wash. */}
      <section className="relative isolate lg:mx-auto lg:max-w-6xl lg:px-6 lg:pt-10 lg:pb-24">
        <div className="absolute inset-0 -z-10 lg:hidden">
          <Image
            src={HERO_IMAGE}
            alt="Athlete training outdoors at sunrise"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Single smooth bottom-up scrim — keeps the photo clean while the
              copy stays legible. */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/15" />
        </div>

        <div className="grid min-h-[calc(100svh-env(safe-area-inset-top)-80px)] gap-8 px-4 pb-12 sm:px-6 lg:min-h-0 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:px-0 lg:pb-0">
          {/* Copy column */}
          <div className="relative z-10 flex flex-col justify-end lg:justify-center">
            <h1 className="display text-balance text-5xl leading-[0.95] text-chalk-50 sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
              TRAIN.
              <br />
              EAT.
              <br />
              RECOVER.{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">
                REPEAT.
              </span>
            </h1>
            <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-chalk-200 sm:text-lg lg:text-chalk-300">
              Your daily calorie target, built from your body and goals — with
              exactly what to eat and how to move to hit it.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-start">
              <Link href="/signup" className="btn-primary px-6 py-3.5 text-base">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary px-6 py-3.5 text-base"
              >
                I already have an account
              </Link>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs text-chalk-300 lg:text-chalk-400">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-cyan" />
              No credit card · your data stays yours
            </div>
          </div>

          {/* Desktop image column */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900">
              <Image
                src={HERO_IMAGE}
                alt="Athlete training outdoors at sunrise"
                fill
                sizes="50vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
            </div>
            <div className="pointer-events-none absolute -inset-x-6 -top-6 -z-10 h-72 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,rgba(0,102,255,0.16),transparent_70%)]" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Product-preview band — proof moved OFF the hero image into a clean
            card + stat row. */}
        <section className="border-t border-white/[0.06] py-8">
          <div className="grid gap-5 sm:grid-cols-[1.2fr_1fr] sm:items-center">
            <div className="card-elev p-5">
              <KpiCardContent />
            </div>
            <dl className="grid grid-cols-3 gap-6">
              <Stat k="2,180" v="kcal target" />
              <Stat k="165g" v="protein/day" />
              <Stat k="6-day" v="training split" />
            </dl>
          </div>
        </section>

        {/* Feature carousel */}
        <section className="pb-16 pt-4">
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
      <div className="label-eyebrow">A day on Kosmo</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="display text-4xl text-chalk-50">820</span>
        <span className="text-sm text-chalk-300">kcal left</span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[62%] rounded-full bg-brand-gradient" />
      </div>
      <div className="mt-2 text-[11px] text-chalk-400">
        62% — walk 22 min to close the gap
      </div>
    </>
  );
}
