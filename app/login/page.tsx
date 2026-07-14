"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Sprout } from "lucide-react";
import {
  Button,
  Field,
  FormError,
  TextInput,
} from "@/components/ui";
import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message || "Email atau kata sandi salah.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(197,255,102,0.35),transparent_55%),linear-gradient(180deg,var(--sage)_0%,var(--cream)_55%)] px-4 py-6 pt-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] max-[380px]:px-3.5">
      <div className="flex w-full max-w-[380px] flex-col gap-5">
        <div className="flex flex-col items-center px-1 text-center">
          <div
            className="mb-3.5 grid size-[52px] place-items-center rounded-box bg-lime shadow-card [&_svg]:size-[26px]"
            aria-hidden
          >
            <Sprout strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="mb-2 text-[clamp(1.75rem,7vw,2.15rem)] font-extrabold leading-[1.1] tracking-[-0.04em] text-ink">
              Sales Tracking System
            </h1>
            <p className="mx-auto max-w-[32ch] text-[0.95rem] leading-[1.45] text-muted-foreground">
              Kelola penjualan, pelanggan, dan laporan dalam satu tempat.
            </p>
          </div>
        </div>

        <div className="w-full rounded-card bg-card px-[18px] py-5 shadow-card">
          <h2 className="mb-1 text-[1.15rem] font-extrabold tracking-[-0.03em] text-ink">
            Masuk
          </h2>
          <form onSubmit={onSubmit} className="mt-3">
            <Field label="Email" htmlFor="email">
              <TextInput
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Kata sandi" htmlFor="password">
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi"
                required
                minLength={8}
                autoComplete="current-password"
              />
            </Field>

            {error ? <FormError>{error}</FormError> : null}

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Mohon tunggu…" : "Masuk"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(197,255,102,0.35),transparent_55%),linear-gradient(180deg,var(--sage)_0%,var(--cream)_55%)] px-4 py-6">
          <div className="flex w-full max-w-[380px] flex-col gap-5">
            <div className="w-full rounded-card bg-card px-[18px] py-5 shadow-card">
              <p className="text-muted-foreground">Memuat…</p>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
