import Link from "next/link";
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
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <LogoMark />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Log in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Hero */}
        <section className="relative pt-10 pb-20 sm:pt-20 sm:pb-28">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(34,211,238,0.18),transparent_60%)]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[2px] text-chalk-300">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" />
              Personal coach in your pocket
            </div>
            <h1 className="text-balance text-4xl font-black tracking-tight sm:text-6xl">
              Train smarter, eat sharper,{" "}
              <span className="bg-gradient-to-r from-accent-cyan via-sky-300 to-accent-violet bg-clip-text text-transparent">
                close the gap
              </span>{" "}
              every day.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-chalk-300 sm:text-lg">
              Kosmo Fitness builds your daily calorie target from your body and
              goals, then tells you exactly what to eat and how to move — even
              suggesting walks or cardio to close the gap when you go over.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup" className="btn-primary px-6 py-3 text-base">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3 text-base">
                I already have one
              </Link>
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-chalk-400">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-green" />
              No credit card · your data stays yours
            </div>
          </div>
        </section>

        {/* Feature carousel */}
        <section className="pb-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="label-tiny mb-1">Inside Kosmo Fitness</div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Built for the whole stack.
              </h2>
            </div>
            <div className="hidden text-xs text-chalk-400 sm:block">
              Swipe or use the arrows →
            </div>
          </div>
          <FeatureCarousel />
        </section>

        {/* Math card */}
        <section className="card-elev mb-20 p-8 sm:p-10">
          <div className="flex items-start gap-3">
            <LineChart className="h-6 w-6 text-accent-cyan" />
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                The simple math under the hood
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-chalk-300">
                Your daily calorie target = Life TDEE + today&apos;s workout burn −
                your deficit. Net result is always the same deficit — the gym
                just earns you more food. Miss a workout? Kosmo Fitness tells you
                how many minutes to walk to keep the day balanced.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] py-8 text-center text-xs text-chalk-500">
        © {new Date().getFullYear()} Kosmo Fitness
      </footer>
    </div>
  );
}
