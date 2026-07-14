"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Sprout } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  BtnRow,
  Button,
  Card,
  cx,
  Dialog,
  DialogMessage,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  SkeletonCards,
  TextInput,
} from "@/components/ui";
import {
  useCreateVariety,
  useDeleteVariety,
  useUpdateVariety,
  useVarieties,
} from "@/hooks/use-durian";
import { useSearchQueryUrlState } from "@/hooks/use-url-filters";
import { rupiah } from "@/lib/format";
import type { Variety } from "@/lib/types";

type DialogMode = "create" | "edit" | "delete" | null;

const AVATAR_TONES = ["lime", "sage", "yellow"] as const;
const PAGE_SIZE = 5;

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

function dialogTitle(mode: DialogMode) {
  if (mode === "edit") return "Ubah jenis";
  if (mode === "delete") return "Hapus jenis";
  return "Tambah jenis";
}

export default function JenisPage() {
  return (
    <Suspense
      fallback={
        <AppShell subtitle="Atur jenis & harga per kg">
          <SkeletonCards count={3} />
        </AppShell>
      }
    >
      <JenisPageContent />
    </Suspense>
  );
}

function JenisPageContent() {
  const { data: varieties, isLoading, error } = useVarieties();
  const createVariety = useCreateVariety();
  const updateVariety = useUpdateVariety();
  const deleteVariety = useDeleteVariety();

  const { query, setQuery, page, setPage } = useSearchQueryUrlState({
    paginated: true,
  });
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [activeVariety, setActiveVariety] = useState<Variety | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [formError, setFormError] = useState("");

  const totalCount = varieties?.length ?? 0;
  const hasQuery = query.trim().length > 0;

  const filtered = useMemo(() => {
    const list = varieties ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        String(v.pricePerKg).includes(q),
    );
  }, [varieties, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const pageEnd = pageStart + pageItems.length;

  function openCreate() {
    setActiveVariety(null);
    setName("");
    setPrice("");
    setFormError("");
    setDialogMode("create");
  }

  function openEdit(variety: Variety) {
    setActiveVariety(variety);
    setName(variety.name);
    setPrice(String(variety.pricePerKg));
    setFormError("");
    setDialogMode("edit");
  }

  function openDelete(variety: Variety) {
    setActiveVariety(variety);
    setFormError("");
    setDialogMode("delete");
  }

  function closeDialog() {
    setDialogMode(null);
    setActiveVariety(null);
    setFormError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    const trimmed = name.trim();
    const pricePerKg = Number(price);

    if (!trimmed) {
      setFormError("Isi nama jenis.");
      return;
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      setFormError("Harga per kg tidak valid.");
      return;
    }

    try {
      if (dialogMode === "create") {
        await createVariety.mutateAsync({
          name: trimmed,
          pricePerKg: Math.round(pricePerKg),
        });
      } else if (dialogMode === "edit" && activeVariety) {
        await updateVariety.mutateAsync({
          id: activeVariety.id,
          name: trimmed,
          pricePerKg: Math.round(pricePerKg),
        });
      }
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : dialogMode === "create"
            ? "Gagal menambah jenis."
            : "Gagal mengubah jenis.",
      );
    }
  }

  async function onConfirmDelete() {
    if (!activeVariety) return;
    setFormError("");
    try {
      await deleteVariety.mutateAsync(activeVariety.id);
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menghapus jenis.",
      );
    }
  }

  const saving = createVariety.isPending || updateVariety.isPending;
  const deleting = deleteVariety.isPending;

  return (
    <AppShell subtitle="Atur jenis & harga per kg">
      <div className="mb-3.5 mt-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="m-0 text-[1.55rem] font-bold leading-tight tracking-[-0.02em] text-ink">
            Jenis Durian.
          </h2>
          {!isLoading && !error ? (
            <p className="m-0 mt-1 text-[0.88rem] font-medium text-muted-foreground">
              {hasQuery
                ? `${filtered.length} cocok · ${totalCount} jenis`
                : `${totalCount} jenis`}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={openCreate}>
          <Plus strokeWidth={2.25} />
          Tambah
        </Button>
      </div>

      <p className="mb-3.5 mt-0 text-[0.9rem] leading-normal text-muted-foreground">
        Perubahan harga hanya berlaku untuk transaksi baru. Transaksi lama tetap
        memakai harga saat penjualan dicatat.
      </p>

      <div className="relative mb-3.5">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-foreground"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          className="w-full min-h-[52px] rounded-pill border-[1.5px] border-solid border-line bg-card py-3 pr-[18px] pl-[46px] text-ink outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus:border-sage-deep focus:shadow-[0_0_0_3px_rgba(197,255,102,0.18)]"
          placeholder="Cari jenis…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Cari jenis durian"
        />
      </div>

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : error ? (
        <Card>
          <ErrorState message="Gagal memuat daftar jenis." />
        </Card>
      ) : !varieties?.length ? (
        <Card>
          <EmptyState>
            Belum ada jenis. Ketuk Tambah untuk membuat yang baru.
          </EmptyState>
        </Card>
      ) : !filtered.length ? (
        <Card>
          <EmptyState>Tidak ada jenis yang cocok dengan pencarian.</EmptyState>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {pageItems.map((v) => (
              <article
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-[20px] border-[1.5px] border-solid border-line bg-card px-4 py-3.5 shadow-soft"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div
                    className={cx(
                      "grid size-12 shrink-0 place-items-center rounded-full text-ink [&_svg]:size-[22px]",
                      toneBg[avatarTone(v.name)],
                    )}
                    aria-hidden
                  >
                    <Sprout strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[1.05rem] font-bold tracking-[-0.02em] text-ink">
                      {v.name}
                    </div>
                    <div className="mt-0.5 font-mono text-[0.88rem] font-medium tabular-nums text-muted-foreground">
                      {rupiah(v.pricePerKg)}/kg
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <button
                    type="button"
                    className="min-h-7 cursor-pointer rounded-pill border-none bg-sage px-3 py-1.5 text-[0.75rem] font-bold leading-none tracking-[-0.01em] text-ink transition-[transform,opacity] duration-100 ease-out active:enabled:scale-96 disabled:cursor-not-allowed disabled:opacity-55 hover:enabled:bg-sage-deep"
                    onClick={() => openEdit(v)}
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    className="min-h-7 cursor-pointer rounded-pill border-none bg-danger-bg px-3 py-1.5 text-[0.75rem] font-bold leading-none tracking-[-0.01em] text-danger transition-[transform,opacity] duration-100 ease-out active:enabled:scale-96 disabled:cursor-not-allowed disabled:opacity-55 hover:enabled:bg-[#f3d9d3]"
                    onClick={() => openDelete(v)}
                    disabled={deleting}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="mt-3.5 flex flex-col gap-2.5">
              <p className="m-0 text-center text-[0.84rem] font-medium text-muted-foreground tabular-nums">
                Menampilkan {pageStart + 1}–{pageEnd} dari {filtered.length}
                {hasQuery ? ` (total ${totalCount})` : ""}
              </p>
              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft strokeWidth={2.25} />
                  Sebelumnya
                </Button>
                <span className="text-[0.88rem] font-bold text-ink tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  aria-label="Halaman berikutnya"
                >
                  Berikutnya
                  <ChevronRight strokeWidth={2.25} />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={dialogMode !== null}
        title={dialogTitle(dialogMode)}
        onClose={closeDialog}
      >
        {dialogMode === "delete" && activeVariety ? (
          <>
            <DialogMessage>
              Hapus jenis <strong>{activeVariety.name}</strong> dari daftar
              harga? Tindakan ini tidak bisa dibatalkan.
            </DialogMessage>
            {formError ? <FormError>{formError}</FormError> : null}
            <BtnRow>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeDialog}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={onConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Menghapus…" : "Hapus"}
              </Button>
            </BtnRow>
          </>
        ) : (
          <form onSubmit={onSubmit}>
            <Field label="Nama jenis" htmlFor="varietyName">
              <TextInput
                id="varietyName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Mis. Musang King"
                autoComplete="off"
              />
            </Field>
            <Field label="Harga per kg (Rp)" htmlFor="varietyPrice">
              <TextInput
                id="varietyPrice"
                type="number"
                min={0}
                step={500}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="35000"
              />
            </Field>
            {formError ? <FormError>{formError}</FormError> : null}
            <BtnRow>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closeDialog}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan…"
                  : dialogMode === "edit"
                    ? "Simpan"
                    : "Tambah"}
              </Button>
            </BtnRow>
          </form>
        )}
      </Dialog>
    </AppShell>
  );
}
