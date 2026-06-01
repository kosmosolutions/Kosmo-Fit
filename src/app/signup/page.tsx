import Link from "next/link";
import Image from "next/image";
import { LogoMark } from "@/components/LogoMark";
import { signupAction } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <div className="grid min-h-svh overflow-x-hidden lg:grid-cols-[1.1fr_1fr]">
      {/* Photo panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1600&q=80"
          alt="Athlete in motion"
          fill
          sizes="55vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink-950 via-ink-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <div className="label-eyebrow">Get started</div>
          <h2 className="display mt-3 text-4xl leading-[0.95] text-chalk-50 xl:text-5xl">
            Your plan,
            <br />
            <span className="text-accent-blue">built around you.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm text-chalk-300">
            Two-minute setup. Calorie target, macros and training split adapt to
            your body and goals.
          </p>
        </div>
      </aside>

      {/* Form panel */}
      <div className="mx-auto flex w-full max-w-md flex-col px-6 pb-10 pt-safe-10 lg:py-16">
        <Link href="/" className="self-start">
          <LogoMark />
        </Link>
        <div className="mt-12">
          <div className="label-eyebrow">Sign up</div>
          <h1 className="display mt-2 text-4xl text-chalk-50">
            Create your account.
          </h1>
          <p className="mt-3 text-sm text-chalk-300">
            Two minutes to set up. Then your daily plan adapts to you.
          </p>
        </div>

        {message ? (
          <div className="mt-6 rounded-xl border border-accent-green/30 bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="mt-6 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-4 py-3 text-sm text-accent-rose">
            {error}
          </div>
        ) : null}

        <form action={signupAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="metric-label">Full name</span>
            <input
              name="full_name"
              type="text"
              required
              className="field mt-2"
              placeholder="Your name"
            />
          </label>
          <label className="block">
            <span className="metric-label">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field mt-2"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="metric-label">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field mt-2"
              placeholder="At least 8 characters"
            />
          </label>
          <button type="submit" className="btn-primary w-full">
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-chalk-300">
          Already have one?{" "}
          <Link href="/login" className="font-bold text-accent-blue">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
