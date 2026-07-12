"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  BtnRow,
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  SkeletonCards,
  TextInput,
} from "@/components/ui";
import { useCreateUser, useUsers } from "@/hooks/use-durian";
import { authClient } from "@/lib/auth-client";
import { isSuperAdmin } from "@/lib/permissions";
import { formatTanggal } from "@/lib/format";

function roleLabel(role: string) {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";
  return role;
}

export default function UsersPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const role =
    session?.user && "role" in session.user
      ? (session.user.role as string | undefined)
      : undefined;
  const allowed = isSuperAdmin(role);

  const { data: users, isLoading, error } = useUsers(allowed);
  const createUser = useCreateUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (sessionPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!allowed) {
      router.replace("/");
    }
  }, [sessionPending, session, allowed, router]);

  function openCreate() {
    setName("");
    setEmail("");
    setPassword("");
    setFormError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setFormError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setFormError("Isi nama pengguna.");
      return;
    }
    if (!trimmedEmail) {
      setFormError("Isi email.");
      return;
    }
    if (password.length < 8) {
      setFormError("Kata sandi minimal 8 karakter.");
      return;
    }

    try {
      await createUser.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menambah pengguna.",
      );
    }
  }

  if (sessionPending || !allowed) {
    return (
      <AppShell subtitle="Kelola akun admin">
        <Card>
          <p className="m-0 text-muted-foreground">Memuat…</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell subtitle="Kelola akun admin">
      <div className="mb-3.5 mt-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.55rem] font-bold leading-tight tracking-[-0.02em] text-ink">
          Pengguna.
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={openCreate}>
          <Plus strokeWidth={2.25} />
          Tambah
        </Button>
      </div>

      <p className="mb-3.5 text-[0.9rem] leading-[1.45] text-muted-foreground">
        Superadmin dapat menambahkan pengguna dengan peran admin.
      </p>

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : error ? (
        <Card>
          <ErrorState message="Gagal memuat daftar pengguna." />
        </Card>
      ) : !users?.length ? (
        <Card>
          <EmptyState>
            Belum ada pengguna. Ketuk Tambah untuk membuat admin baru.
          </EmptyState>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-card bg-card shadow-soft">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3.5 border-b border-line p-4 last:border-b-0"
            >
              <div
                className="grid size-14 shrink-0 place-items-center rounded-box bg-sage text-[1.2rem] font-extrabold tracking-[-0.03em] text-ink"
                aria-hidden
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.05rem] font-bold tracking-[-0.02em] text-ink">
                  {user.name}
                </div>
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.86rem] text-muted-foreground">
                  {user.email}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-pill bg-sage px-2 py-0.5 font-semibold text-ink">
                    <Shield className="size-3" strokeWidth={2.25} aria-hidden />
                    {roleLabel(user.role)}
                  </span>
                  <span>
                    Dibuat {formatTanggal(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} title="Tambah admin" onClose={closeDialog}>
        <form onSubmit={onSubmit}>
          <Field label="Nama" htmlFor="userName">
            <TextInput
              id="userName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama lengkap"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Email" htmlFor="userEmail">
            <TextInput
              id="userEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Kata sandi" htmlFor="userPassword">
            <TextInput
              id="userPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </Field>
          {formError ? <FormError>{formError}</FormError> : null}
          <BtnRow>
            <Button
              type="button"
              variant="ghost"
              onClick={closeDialog}
              disabled={createUser.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? "Menyimpan…" : "Tambah"}
            </Button>
          </BtnRow>
        </form>
      </Dialog>
    </AppShell>
  );
}
