"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  BtnRow,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  FormSuccess,
  LoadingState,
  TextInput,
} from "@/components/ui";
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from "@/hooks/use-durian";
import { authClient } from "@/lib/auth-client";

function roleLabel(role: string) {
  if (role === "superadmin") return "Superadmin";
  if (role === "admin") return "Admin";
  return role;
}

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setEmail(profile.email);
  }, [profile]);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      setProfileError("Isi nama.");
      return;
    }
    if (!trimmedEmail) {
      setProfileError("Isi email.");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
      });
      await authClient.getSession({
        fetchOptions: { query: { disableCookieCache: true } },
      });
      setProfileSuccess("Profil berhasil diperbarui.");
    } catch (err) {
      setProfileError(
        err instanceof Error ? err.message : "Gagal menyimpan profil.",
      );
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Masukkan kata sandi saat ini.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    try {
      await changePassword.mutateAsync({
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Kata sandi berhasil diubah.");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Gagal mengubah kata sandi.",
      );
    }
  }

  return (
    <AppShell subtitle="Kelola profil dan keamanan akun">
      <h2 className="mb-3.5 mt-2 text-[1.55rem] font-bold leading-tight tracking-[-0.02em] text-ink">
        Profil.
      </h2>

      {isLoading ? (
        <Card>
          <LoadingState />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message="Gagal memuat profil." />
        </Card>
      ) : !profile ? (
        <Card>
          <EmptyState>Profil tidak ditemukan.</EmptyState>
        </Card>
      ) : (
        <>
          <Card className="mb-3.5">
            <div className="mb-4 flex items-center gap-3.5">
              <div
                className="grid size-16 shrink-0 place-items-center rounded-box bg-lime text-[1.35rem] font-extrabold tracking-[-0.03em] text-ink"
                aria-hidden
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.1rem] font-bold tracking-[-0.02em] text-ink">
                  {profile.name}
                </div>
                <div className="text-[0.88rem] text-muted-foreground">
                  {profile.email}
                </div>
                <div className="mt-1 inline-flex rounded-pill bg-sage px-2.5 py-0.5 text-[0.75rem] font-semibold text-ink">
                  {roleLabel(profile.role)}
                </div>
              </div>
            </div>

            <form onSubmit={onSaveProfile}>
              <Field label="Nama" htmlFor="profileName">
                <TextInput
                  id="profileName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field label="Email" htmlFor="profileEmail">
                <TextInput
                  id="profileEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </Field>
              {profileError ? <FormError>{profileError}</FormError> : null}
              {profileSuccess ? (
                <FormSuccess>{profileSuccess}</FormSuccess>
              ) : null}
              <BtnRow>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Menyimpan…" : "Simpan profil"}
                </Button>
              </BtnRow>
            </form>
          </Card>

          <Card>
            <h3 className="mb-1 text-[1.05rem] font-extrabold tracking-[-0.02em] text-ink">
              Ubah kata sandi
            </h3>
            <p className="mb-4 text-[0.9rem] leading-[1.45] text-muted-foreground">
              Masukkan kata sandi saat ini, lalu kata sandi baru.
            </p>
            <form onSubmit={onChangePassword}>
              <Field label="Kata sandi saat ini" htmlFor="currentPassword">
                <TextInput
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label="Kata sandi baru" htmlFor="newPassword">
                <TextInput
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
              <Field
                label="Konfirmasi kata sandi baru"
                htmlFor="confirmPassword"
              >
                <TextInput
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
              {passwordError ? <FormError>{passwordError}</FormError> : null}
              {passwordSuccess ? (
                <FormSuccess>{passwordSuccess}</FormSuccess>
              ) : null}
              <BtnRow>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending
                    ? "Menyimpan…"
                    : "Perbarui kata sandi"}
                </Button>
              </BtnRow>
            </form>
          </Card>
        </>
      )}
    </AppShell>
  );
}
