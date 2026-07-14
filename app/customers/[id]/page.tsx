"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Pencil, Phone, Receipt, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { InvoiceDocument } from "@/components/invoice-document";
import { TransactionEditDialog } from "@/components/transaction-edit-dialog";
import { TransactionRow } from "@/components/transaction-row";
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
  IconButton,
  SkeletonCard,
  SkeletonCards,
  TextInput,
} from "@/components/ui";
import {
  useCustomer,
  useDeleteCustomer,
  useDeleteTransaction,
  useTransactions,
  useUpdateCustomer,
  useUpdateTransactionStatus,
} from "@/hooks/use-durian";
import { rupiah, formatDayGroupLabel, localDateKey } from "@/lib/format";
import { printInvoiceDocument } from "@/lib/invoice-print";
import type { Transaction } from "@/lib/types";

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

type DialogMode = "edit" | "delete" | null;

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: customer, isLoading, error } = useCustomer(id);
  const txFilters = useMemo(
    () => ({ customerId: id, sort: "tanggal-desc" as const }),
    [id],
  );
  const {
    data: transactions,
    isLoading: loadingTx,
    error: txError,
  } = useTransactions(txFilters);

  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const updateStatus = useUpdateTransactionStatus();
  const deleteTx = useDeleteTransaction();

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [formError, setFormError] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [issuedAt, setIssuedAt] = useState(() => new Date());

  const activeTransactions = useMemo(
    () => (transactions ?? []).filter((t) => t.status === "AKTIF"),
    [transactions],
  );

  const selectedTransactions = useMemo(
    () => activeTransactions.filter((t) => selectedIds.has(t.id)),
    [activeTransactions, selectedIds],
  );

  const selectedTotal = useMemo(
    () => selectedTransactions.reduce((sum, t) => sum + t.subtotal, 0),
    [selectedTransactions],
  );

  const dayGroups = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const tx of transactions ?? []) {
      const key = localDateKey(tx.soldAt);
      const list = byDay.get(key) ?? [];
      list.push(tx);
      byDay.set(key, list);
    }

    return Array.from(byDay.keys())
      .sort((a, b) => b.localeCompare(a))
      .map((dayKey) => {
        const items = byDay.get(dayKey) ?? [];
        const dayTotal = items
          .filter((t) => t.status === "AKTIF")
          .reduce((sum, t) => sum + t.subtotal, 0);
        return { dayKey, items, dayTotal };
      });
  }, [transactions]);

  // Drop selections that no longer exist or are no longer active
  useEffect(() => {
    const valid = new Set(activeTransactions.map((t) => t.id));
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [activeTransactions]);

  const activeTotal =
    transactions
      ?.filter((t) => t.status === "AKTIF")
      .reduce((sum, t) => sum + t.subtotal, 0) ?? 0;
  const txCount = customer?._count?.transactions ?? transactions?.length ?? 0;
  const busy =
    updateStatus.isPending || deleteTx.isPending || deleteCustomer.isPending;

  function openEdit() {
    if (!customer) return;
    setName(customer.name);
    setPhoneNumber(customer.phoneNumber ?? "");
    setFormError("");
    setDialogMode("edit");
  }

  function openDelete() {
    setFormError("");
    setDialogMode("delete");
  }

  function closeDialog() {
    setDialogMode(null);
    setFormError("");
  }

  function toggleSelect(txId: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(txId);
      else next.delete(txId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === activeTransactions.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(activeTransactions.map((t) => t.id)));
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Isi nama pelanggan.");
      return;
    }
    try {
      await updateCustomer.mutateAsync({
        id,
        name: trimmed,
        phoneNumber: phoneNumber.trim() || null,
      });
      closeDialog();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal mengubah pelanggan.",
      );
    }
  }

  async function onConfirmDelete() {
    setFormError("");
    try {
      await deleteCustomer.mutateAsync(id);
      router.replace("/customers");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menghapus pelanggan.",
      );
    }
  }

  return (
    <AppShell
      title={customer?.name ?? "Pelanggan"}
      subtitle="Detail & riwayat transaksi"
    >
      <Link
        href="/customers"
        className="mb-3.5 mt-1 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-muted-foreground transition-colors duration-150 ease-out hover:text-ink [&_svg]:size-[18px]"
      >
        <ArrowLeft strokeWidth={2.25} aria-hidden />
        Kembali ke daftar
      </Link>

      {isLoading ? (
        <Card>
          <SkeletonCard />
        </Card>
      ) : error || !customer ? (
        <Card>
          <ErrorState message="Pelanggan tidak ditemukan." />
        </Card>
      ) : (
        <>
          <section className="mb-3 flex items-center gap-3.5 rounded-card bg-card px-4 py-[18px] shadow-soft">
            <div
              className={cx(
                "grid size-[72px] shrink-0 place-items-center rounded-[18px] text-[1.6rem] font-extrabold tracking-[-0.03em] text-ink",
                toneBg[avatarTone(customer.name)],
              )}
              aria-hidden
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="m-0 text-[1.35rem] font-extrabold leading-tight tracking-[-0.03em] break-words">
                {customer.name}
              </h2>
              {customer.phoneNumber ? (
                <p className="mt-1.5 mb-0 inline-flex items-center gap-1.5 text-[0.9rem] text-muted-foreground [&_svg]:size-[15px]">
                  <Phone strokeWidth={2} aria-hidden />
                  {customer.phoneNumber}
                </p>
              ) : null}
              <p className="mt-1.5 mb-0 inline-flex items-center gap-1.5 text-[0.9rem] text-muted-foreground [&_svg]:size-[15px]">
                <Receipt strokeWidth={2} aria-hidden />
                {txCount} transaksi
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <IconButton
                onClick={openEdit}
                aria-label="Ubah nama"
                title="Ubah nama"
              >
                <Pencil strokeWidth={2} />
              </IconButton>
              <IconButton
                danger
                onClick={openDelete}
                aria-label="Hapus pelanggan"
                title="Hapus pelanggan"
              >
                <Trash2 strokeWidth={2} />
              </IconButton>
            </div>
          </section>

          <div className="mb-2 grid grid-cols-[1.4fr_1fr] gap-2.5">
            <div className="flex flex-col gap-1 rounded-[20px] bg-sage px-4 py-3.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                Total belanja
              </span>
              <span className="font-mono text-[1.15rem] font-extrabold tracking-[-0.03em] text-ink tabular-nums">
                {rupiah(customer.totalSpent ?? activeTotal)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-[20px] bg-sage px-4 py-3.5">
              <span className="text-[0.78rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                Transaksi
              </span>
              <span className="font-mono text-[1.15rem] font-extrabold tracking-[-0.03em] text-ink tabular-nums">
                {txCount}
              </span>
            </div>
          </div>
        </>
      )}

      <div className="mt-5 mb-3 flex items-center justify-between gap-3">
        <h2 className="m-0 text-base font-bold tracking-[-0.02em] text-ink">
          Riwayat transaksi
        </h2>
        {activeTransactions.length > 0 ? (
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="text-[0.82rem] font-semibold tabular-nums text-muted-foreground">
              {selectedIds.size} invoice
            </span>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-[0.82rem] font-bold text-muted-foreground underline-offset-2 hover:text-ink hover:underline"
              onClick={toggleSelectAll}
            >
              {selectedIds.size === activeTransactions.length
                ? "Hapus pilihan"
                : "Pilih semua"}
            </button>
          </div>
        ) : null}
      </div>

      {loadingTx ? (
        <SkeletonCards count={3} />
      ) : txError ? (
        <Card>
          <ErrorState message="Gagal memuat transaksi." />
        </Card>
      ) : !transactions?.length ? (
        <Card>
          <EmptyState>Belum ada transaksi untuk pelanggan ini.</EmptyState>
        </Card>
      ) : (
        <div
          className={cx(
            "flex flex-col gap-[22px]",
            selectedIds.size > 0 && "pb-20",
          )}
        >
          {dayGroups.map(({ dayKey, items, dayTotal }) => (
            <section key={dayKey} className="flex flex-col gap-2">
              <div className="mb-0.5 flex items-baseline justify-between gap-3 px-0.5">
                <h3 className="m-0 text-[0.8rem] font-bold tracking-[0.06em] text-ink uppercase">
                  {formatDayGroupLabel(dayKey)}
                </h3>
                <span className="font-mono text-[0.85rem] font-bold text-ink tabular-nums">
                  {rupiah(dayTotal)}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {items.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    busy={busy}
                    selectable
                    selected={selectedIds.has(tx.id)}
                    onSelectChange={toggleSelect}
                    onEdit={(row) => setEditingTx(row)}
                    onCancel={async (txId) => {
                      if (!confirm("Batalkan transaksi ini?")) return;
                      await updateStatus.mutateAsync({
                        id: txId,
                        status: "BATAL",
                      });
                    }}
                    onRestore={async (txId) => {
                      await updateStatus.mutateAsync({
                        id: txId,
                        status: "AKTIF",
                      });
                    }}
                    onDelete={async (txId) => {
                      if (!confirm("Hapus transaksi ini secara permanen?"))
                        return;
                      await deleteTx.mutateAsync(txId);
                    }}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedIds.size > 0 ? (
        <div className="fixed bottom-[calc(78px+env(safe-area-inset-bottom))] left-1/2 z-30 flex w-[min(calc(100%-24px),398px)] -translate-x-1/2 items-center justify-between gap-3 rounded-pill border border-[color-mix(in_srgb,var(--line)_65%,transparent)] bg-[rgba(244,249,244,0.96)] px-3.5 py-2.5 shadow-[0_8px_28px_rgba(10,46,26,0.1)] backdrop-blur-[16px] no-print">
          <div className="min-w-0">
            <p className="m-0 text-[0.78rem] font-semibold text-muted-foreground">
              {selectedIds.size} dipilih
            </p>
            <p className="m-0 font-mono text-[0.95rem] font-extrabold tabular-nums text-ink">
              {rupiah(selectedTotal)}
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              setIssuedAt(new Date());
              setInvoiceOpen(true);
            }}
          >
            <FileText strokeWidth={2.25} />
            Pratinjau
          </Button>
        </div>
      ) : null}

      <TransactionEditDialog
        tx={editingTx}
        open={editingTx !== null}
        onClose={() => setEditingTx(null)}
      />

      <Dialog
        open={invoiceOpen && selectedTransactions.length > 0 && !!customer}
        title="Pratinjau invoice"
        wide
        onClose={() => setInvoiceOpen(false)}
      >
        {customer && selectedTransactions.length > 0 ? (
          <>
            <div className="mb-4 overflow-hidden rounded-box border border-line shadow-soft">
              <InvoiceDocument
                customer={customer}
                transactions={selectedTransactions}
                issuedAt={issuedAt}
              />
            </div>
            <p className="mt-0 mb-3.5 text-[0.84rem] leading-normal text-muted-foreground">
              Periksa isi invoice di atas, lalu cetak atau simpan sebagai PDF.
            </p>
            <BtnRow>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInvoiceOpen(false)}
              >
                Tutup
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  printInvoiceDocument({
                    customerName: customer.name,
                    phoneNumber: customer.phoneNumber,
                    transactions: selectedTransactions,
                    issuedAt,
                  });
                }}
              >
                Cetak PDF
              </Button>
            </BtnRow>
          </>
        ) : null}
      </Dialog>

      <Dialog
        open={dialogMode !== null}
        title={dialogMode === "delete" ? "Hapus pelanggan" : "Ubah pelanggan"}
        onClose={closeDialog}
      >
        {dialogMode === "delete" && customer ? (
          <>
            <DialogMessage>
              Hapus pelanggan <strong>{customer.name}</strong>? Tindakan ini
              tidak bisa dibatalkan.
            </DialogMessage>
            {formError ? <FormError>{formError}</FormError> : null}
            <BtnRow>
              <Button
                type="button"
                variant="ghost"
                onClick={closeDialog}
                disabled={deleteCustomer.isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={onConfirmDelete}
                disabled={deleteCustomer.isPending}
              >
                {deleteCustomer.isPending ? "Menghapus…" : "Hapus"}
              </Button>
            </BtnRow>
          </>
        ) : (
          <form onSubmit={onSaveEdit}>
            <Field label="Nama pelanggan" htmlFor="editCustomerName">
              <TextInput
                id="editCustomerName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama pelanggan"
                autoComplete="off"
              />
            </Field>
            <Field label="Nomor telepon" htmlFor="editCustomerPhone">
              <TextInput
                id="editCustomerPhone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08…"
                autoComplete="tel"
              />
            </Field>
            {formError ? <FormError>{formError}</FormError> : null}
            <BtnRow>
              <Button
                type="button"
                variant="ghost"
                onClick={closeDialog}
                disabled={updateCustomer.isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={updateCustomer.isPending}
              >
                {updateCustomer.isPending ? "Menyimpan…" : "Simpan"}
              </Button>
            </BtnRow>
          </form>
        )}
      </Dialog>
    </AppShell>
  );
}
