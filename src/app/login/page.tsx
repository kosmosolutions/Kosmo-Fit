import Link from "next/link";
import Image from "next/image";
import { LogoMark } from "@/components/LogoMark";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Photo panel */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80"
          alt="Athlete training"
          fill
          sizes="55vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-ink-950 via-ink-950/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <div className="label-eyebrow">Welcome back</div>
          <h2 className="display mt-3 text-4xl leading-[0.95] text-chalk-50 xl:text-5xl">
            One more rep.
            <br />
            <span className="text-accent-lime">One more meal.</span>
          </h2>
        </div>
      </aside>

      {/* Form panel */}
      <div className="mx-auto flex w-full max-w-md flex-col px-6 py-10 lg:py-16">
        <Link href="/" className="self-start">
          <LogoMark />
        </Link>
        <div className="mt-12">
          <div className="label-eyebrow">Log in</div>
          <h1 className="display mt-2 text-4xl text-chalk-50">Welcome back.</h1>
          <p className="mt-3 text-sm text-chalk-300">
            Pick up where you left off.
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

        <form action={loginAction} className="mt-8 space-y-4">
          <label className="block">
            <span className="label-tiny">Email</span>
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
            <span className="label-tiny">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field mt-2"
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn-primary w-full py-3.5">
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-chalk-300">
          No account yet?{" "}
          <Link href="/signup" className="font-bold text-accent-lime">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
