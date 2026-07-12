"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { ChevronRight, Plus, Receipt, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  BtnRow,
  Button,
  Card,
  cx,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  SkeletonCards,
  TextInput,
} from "@/components/ui";
import { useCreateCustomer, useCustomers } from "@/hooks/use-durian";
import { rupiah } from "@/lib/format";

const AVATAR_TONES = ["lime", "sage", "yellow"] as const;

const toneBg = {
  lime: "bg-lime",
  sage: "bg-sage",
  yellow: "bg-yellow",
} as const;

function avatarTone(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i) * (i + 1);
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export default function PelangganPage() {
  const { data: customers, isLoading, error } = useCustomers();
  const createCustomer = useCreateCustomer();

  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");

  const filtered = useMemo(() => {
    const list = customers ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, query]);

  function openCreate() {
    setName("");
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
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Isi nama pelanggan.");
      return;
    }

    try {
      await createCustomer.mutateAsync({ name: trimmed });
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menambah pelanggan.",
      );
    }
  }

  return (
    <AppShell subtitle="Kelola daftar pelanggan">
      <div className="mb-3.5 mt-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.55rem] font-bold leading-tight tracking-[-0.02em] text-ink">
          Pelanggan.
        </h2>
        <Button type="button" variant="ghost" size="sm" onClick={openCreate}>
          <Plus strokeWidth={2.25} />
          Tambah
        </Button>
      </div>

      <div className="relative mb-3.5">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          className="w-full min-h-[52px] rounded-pill border-[1.5px] border-solid border-line bg-card py-3 pr-[18px] pl-[46px] text-ink outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus:border-sage-deep focus:shadow-[0_0_0_3px_rgba(197,214,58,0.18)]"
          placeholder="Cari pelanggan…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari pelanggan"
        />
      </div>

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : error ? (
        <Card>
          <ErrorState message="Gagal memuat pelanggan." />
        </Card>
      ) : !customers?.length ? (
        <Card>
          <EmptyState>
            Belum ada pelanggan. Ketuk Tambah untuk membuat yang baru.
          </EmptyState>
        </Card>
      ) : !filtered.length ? (
        <Card>
          <EmptyState>Tidak ada pelanggan yang cocok dengan pencarian.</EmptyState>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-card bg-card shadow-soft">
          {filtered.map((c) => {
            const txCount = c._count?.transactions ?? 0;
            return (
              <Link
                key={c.id}
                href={`/customers/${c.id}`}
                className="flex items-center gap-3.5 border-b border-line p-4 text-inherit transition-colors duration-150 ease-out last:border-b-0 active:bg-[rgba(228,237,223,0.45)]"
              >
                <div
                  className={cx(
                    "grid size-16 shrink-0 place-items-center rounded-box text-[1.35rem] font-extrabold tracking-[-0.03em] text-ink",
                    toneBg[avatarTone(c.name)],
                  )}
                  aria-hidden
                >
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.05rem] font-bold tracking-[-0.02em] text-ink">
                    {c.name}
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[0.84rem] text-muted-foreground [&_svg]:size-3.5 [&_svg]:shrink-0">
                    <Receipt strokeWidth={2} aria-hidden />
                    <span>{txCount} transaksi</span>
                  </div>
                  <div className="mt-0.5 font-mono text-base font-extrabold tracking-[-0.02em] text-ink tabular-nums">
                    {rupiah(c.totalSpent ?? 0)}
                  </div>
                </div>
                <ChevronRight
                  className="size-5 shrink-0 text-muted-foreground opacity-55"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} title="Tambah pelanggan" onClose={closeDialog}>
        <form onSubmit={onSubmit}>
          <Field label="Nama pelanggan" htmlFor="customerName">
            <TextInput
              id="customerName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama pelanggan"
              autoComplete="off"
            />
          </Field>
          {formError ? <FormError>{formError}</FormError> : null}
          <BtnRow>
            <Button
              type="button"
              variant="ghost"
              onClick={closeDialog}
              disabled={createCustomer.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createCustomer.isPending}
            >
              {createCustomer.isPending ? "Menyimpan…" : "Tambah"}
            </Button>
          </BtnRow>
        </form>
      </Dialog>
    </AppShell>
  );
}
