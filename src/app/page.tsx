import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoMark } from "@/components/LogoMark";
import { FeatureCarousel } from "@/components/landing/FeatureCarousel";
import { ArrowRight, LineChart, ShieldCheck } from "lucide-react";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/overview");

  return (
    <div className="min-h-svh overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
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

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Editorial split hero */}
        <section className="relative grid gap-8 pt-6 pb-20 sm:pt-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pt-16 lg:pb-28">
          {/* Copy column */}
          <div className="relative z-10 flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-accent-blue/30 bg-accent-blue/[0.10] px-3 py-1 text-[11px] font-bold uppercase tracking-[2.5px] text-accent-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
              Personal coach in your pocket
            </div>
            <h1 className="display text-balance text-5xl leading-[0.95] text-chalk-50 sm:text-6xl lg:text-7xl xl:text-8xl">
              TRAIN.
              <br />
              EAT.
              <br />
              RECOVER.{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">REPEAT.</span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-chalk-300 sm:text-lg">
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
            <div className="mt-5 flex items-center gap-2 text-xs text-chalk-400">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-cyan" />
              No credit card · your data stays yours
            </div>

            {/* Stat row */}
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-white/[0.08] pt-6">
              <Stat k="2,180" v="kcal target" />
              <Stat k="165g" v="protein/day" />
              <Stat k="6-day" v="training split" />
            </dl>
          </div>

          {/* Image column */}
          <div className="relative">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900 lg:aspect-auto lg:h-full lg:min-h-[560px]">
              <Image
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80"
                alt="Athlete training outdoors at sunrise"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-ink-950/60 via-transparent to-transparent" />
              {/* Floating KPI card */}
              <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/10 bg-ink-950/85 p-4 backdrop-blur-xl">
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
              </div>
            </div>
            {/* Accent flare */}
            <div className="pointer-events-none absolute -inset-x-6 -top-6 -z-10 h-72 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,rgba(198,255,0,0.15),transparent_70%)]" />
          </div>
        </section>

        {/* Feature carousel */}
        <section className="pb-16">
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

        {/* Math card */}
        <section className="card-elev mb-20 overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[1fr_1.2fr]">
            <div className="relative hidden aspect-[4/3] lg:block">
              <Image
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80"
                alt="Athlete writing in training journal"
                fill
                sizes="50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-950" />
            </div>
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-2 text-accent-cyan">
                <LineChart className="h-5 w-5" />
                <span className="label-eyebrow !text-accent-cyan">
                  Under the hood
                </span>
              </div>
              <h2 className="display mt-3 text-3xl text-chalk-50 sm:text-4xl">
                The math, made simple.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-chalk-300">
                Daily target = Life TDEE + today&apos;s workout burn − your
                deficit. Same net deficit every day — the gym just earns you more
                food. Miss a workout? Kosmo Fitness tells you how many minutes to
                walk to keep the day balanced.
              </p>
            </div>
          </div>
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
