import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 py-10">
      <Link href="/" className="self-start">
        <LogoMark />
      </Link>
      <div className="mt-12">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-chalk-300">
          Log in to your PocketCoach account.
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
        <button type="submit" className="btn-primary w-full py-3">
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-chalk-300">
        No account yet?{" "}
        <Link href="/signup" className="font-bold text-accent-cyan">
          Sign up
        </Link>
      </p>
    </div>
  );
}
