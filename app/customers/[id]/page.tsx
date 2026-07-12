"use client";

import Link from "next/link";
import { use, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Receipt, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
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
  SectionTitle,
  SkeletonCard,
  SkeletonTickets,
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
  const [formError, setFormError] = useState("");

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

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Isi nama pelanggan.");
      return;
    }
    try {
      await updateCustomer.mutateAsync({ id, name: trimmed });
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

      <SectionTitle>Riwayat transaksi</SectionTitle>

      {loadingTx ? (
        <SkeletonTickets count={3} />
      ) : txError ? (
        <Card>
          <ErrorState message="Gagal memuat transaksi." />
        </Card>
      ) : !transactions?.length ? (
        <Card>
          <EmptyState>Belum ada transaksi untuk pelanggan ini.</EmptyState>
        </Card>
      ) : (
        <div className="ticket-stagger flex flex-col gap-3">
          {transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              busy={busy}
              onCancel={async (txId) => {
                if (!confirm("Batalkan transaksi ini?")) return;
                await updateStatus.mutateAsync({ id: txId, status: "BATAL" });
              }}
              onRestore={async (txId) => {
                await updateStatus.mutateAsync({ id: txId, status: "AKTIF" });
              }}
              onDelete={async (txId) => {
                if (!confirm("Hapus transaksi ini secara permanen?")) return;
                await deleteTx.mutateAsync(txId);
              }}
            />
          ))}
        </div>
      )}

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
