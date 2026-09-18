"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { loginAction, signUpAction } from "@/features/auth/actions";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const create = mode === "signup";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    const input = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      ...(create ? { businessName: String(form.get("businessName") ?? "") } : {}),
    };
    const result = create ? await signUpAction(input) : await loginAction(input);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="auth-page">
      <Link className="wordmark" href="/">cleanie</Link>
      <section className="auth-card">
        <div className="eyebrow">{create ? "Start in minutes" : "Welcome back"}</div>
        <h1>{create ? "Your next booking starts here." : "Pick up where you left off."}</h1>
        <p>{create ? "Create your account, choose a template, and publish your first page when it feels right." : "Log in to manage your page and see your next booking."}</p>
        <form onSubmit={submit}>
          {create && <label>Business name<input name="businessName" placeholder="Jessica’s Home Care" required autoComplete="organization" /></label>}
          <label>Email<input name="email" type="email" placeholder="you@example.com" required autoComplete="email" /></label>
          <label>Password<input name="password" type="password" placeholder="At least 8 characters" minLength={8} required autoComplete={create ? "new-password" : "current-password"} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button" disabled={loading} aria-busy={loading}>
            {loading ? <><LoaderCircle className="spin" size={16} /> {create ? "Creating your page" : "Signing you in"}</> : <>{create ? "Create my page" : "Log in"}<ArrowRight size={16} /></>}
          </button>
        </form>
        {!create && <div className="demo-credentials"><b>Try the demo</b><span>jessica@example.com</span><span>cleanie-demo</span></div>}
        <p className="auth-switch">{create ? "Already have an account?" : "New to Cleanie?"} <Link href={create ? "/login" : "/signup"}>{create ? "Log in" : "Create your page"}</Link></p>
      </section>
    </main>
  );
}
