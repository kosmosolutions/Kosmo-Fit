import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { signupAction } from "./actions";

export default async function SignupPage({
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
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-chalk-300">
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
          <span className="label-tiny">Full name</span>
          <input name="full_name" type="text" required className="field mt-2" placeholder="Your name" />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            className="field mt-2"
            placeholder="At least 8 characters"
          />
        </label>
        <button type="submit" className="btn-primary w-full py-3">
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-chalk-300">
        Already have one?{" "}
        <Link href="/login" className="font-bold text-accent-cyan">
          Log in
        </Link>
      </p>
    </div>
  );
}
