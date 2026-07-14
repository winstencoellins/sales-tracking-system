"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { ChevronDown, Filter, Plus, Sprout } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerSearchSelect } from "@/components/customer-search-select";
import { DatePicker } from "@/components/date-picker";
import { SalesEntry } from "@/components/sales-entry";
import { TransactionEditDialog } from "@/components/transaction-edit-dialog";
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
  SkeletonCards,
} from "@/components/ui";
import {
  useCustomers,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransactionStatus,
} from "@/hooks/use-durian";
import { useHistoryFilterUrlState } from "@/hooks/use-url-filters";
import {
  dateInputToEndIso,
  dateInputToStartIso,
  eachDateKeyInRange,
  formatDateInput,
  formatDayGroupLabel,
  localDateKey,
  rupiah,
  toDateInputValue,
} from "@/lib/format";
import type { Transaction, TransactionFilters } from "@/lib/types";

const AVATAR_TONES = ["lime", "sage", "yellow"] as const;

const toneBg = {
  lime: "bg-lime",
  sage: "bg-sage",
  yellow: "bg-yellow",
} as const;

/** Show empty day sections only for reasonably short ranges */
const MAX_EMPTY_DAY_SPAN = 31;

function avatarTone(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash += seed.charCodeAt(i) * (i + 1);
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

type ConfirmAction =
  | { type: "cancel"; tx: Transaction }
  | { type: "delete"; tx: Transaction }
  | null;

export default function RiwayatPage() {
  return (
    <Suspense
      fallback={
        <AppShell subtitle="Catat & lihat riwayat">
          <SkeletonCards count={3} />
        </AppShell>
      }
    >
      <RiwayatPageContent />
    </Suspense>
  );
}

function RiwayatPageContent() {
  const today = toDateInputValue();
  const { data: customers } = useCustomers();

  const { from, to, customerId, setFilters } = useHistoryFilterUrlState(today);

  const [filterOpen, setFilterOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [draftCustomerId, setDraftCustomerId] = useState(customerId);
  const [filterError, setFilterError] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [actionError, setActionError] = useState("");
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const filters: TransactionFilters = useMemo(
    () => ({
      from: from ? dateInputToStartIso(from) : undefined,
      to: to ? dateInputToEndIso(to) : undefined,
      customerId: customerId || undefined,
      sort: "tanggal-desc",
    }),
    [from, to, customerId],
  );

  const { data: transactions, isLoading, error, isFetching } =
    useTransactions(filters);
  const updateStatus = useUpdateTransactionStatus();
  const deleteTx = useDeleteTransaction();

  const isTodayOnly = from === today && to === today && !customerId;
  const useRelativeLabels = isTodayOnly;

  const groups = useMemo(() => {
    const byDay = new Map<string, Transaction[]>();
    for (const tx of transactions ?? []) {
      const key = localDateKey(tx.soldAt);
      const list = byDay.get(key) ?? [];
      list.push(tx);
      byDay.set(key, list);
    }

    const rangeKeys =
      from && to ? eachDateKeyInRange(from, to) : [];
    const spanDays = rangeKeys.length;

    // For a selected date range, walk every day so 11 Jun / 12 Jun / … show up.
    // Skip empty days only when the span is very long.
    if (spanDays > 0 && spanDays <= MAX_EMPTY_DAY_SPAN) {
      return rangeKeys.map((key) => ({
        dayKey: key,
        items: byDay.get(key) ?? [],
        dayTotal: (byDay.get(key) ?? [])
          .filter((t) => t.status === "AKTIF")
          .reduce((sum, t) => sum + t.subtotal, 0),
      }));
    }

    // Long ranges (or missing bounds): only days that have transactions
    const keys =
      spanDays > MAX_EMPTY_DAY_SPAN
        ? rangeKeys.filter((key) => (byDay.get(key)?.length ?? 0) > 0)
        : Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a));

    return keys.map((key) => ({
      dayKey: key,
      items: byDay.get(key) ?? [],
      dayTotal: (byDay.get(key) ?? [])
        .filter((t) => t.status === "AKTIF")
        .reduce((sum, t) => sum + t.subtotal, 0),
    }));
  }, [transactions, from, to]);

  const periodTotal =
    transactions
      ?.filter((t) => t.status === "AKTIF")
      .reduce((sum, t) => sum + t.subtotal, 0) ?? 0;

  const selectedCustomer = customers?.find((c) => c.id === customerId);

  const periodLabel = (() => {
    if (isTodayOnly) return "Pendapatan hari ini";
    if (from && to && from === to) {
      return `Pendapatan ${formatDateInput(from)}`;
    }
    if (from && to) {
      return `${formatDateInput(from)} – ${formatDateInput(to)}`;
    }
    return "Pendapatan periode";
  })();

  const filterActive = Boolean(
    customerId || from !== today || to !== today,
  );

  const hasAnyInRange = (transactions?.length ?? 0) > 0;

  function openFilter() {
    setDraftFrom(from);
    setDraftTo(to);
    setDraftCustomerId(customerId);
    setFilterError("");
    setFilterOpen(true);
  }

  function applyFilter(e: FormEvent) {
    e.preventDefault();
    setFilterError("");
    if (draftFrom && draftTo && draftFrom > draftTo) {
      setFilterError("Tanggal mulai tidak boleh setelah tanggal akhir.");
      return;
    }
    setFilters({
      from: draftFrom,
      to: draftTo,
      customerId: draftCustomerId,
    });
    setExpandedId(null);
    setFilterOpen(false);
  }

  function resetToToday() {
    setDraftFrom(today);
    setDraftTo(today);
    setDraftCustomerId("");
  }

  const busy = updateStatus.isPending || deleteTx.isPending;

  async function runConfirm() {
    if (!confirm) return;
    setActionError("");
    try {
      if (confirm.type === "cancel") {
        await updateStatus.mutateAsync({
          id: confirm.tx.id,
          status: "BATAL",
        });
      } else {
        await deleteTx.mutateAsync(confirm.tx.id);
      }
      setConfirm(null);
      setExpandedId(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Gagal memproses transaksi.",
      );
    }
  }

  return (
    <AppShell subtitle="Catat & lihat riwayat">
      <div className="mb-3.5 mt-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.55rem] font-bold leading-tight tracking-[-0.02em] text-ink">
          Transaksi.
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSalesOpen(true)}
          >
            <Plus strokeWidth={2.25} />
            Catat
          </Button>
          <IconButton
            active={filterActive}
            onClick={openFilter}
            aria-label="Filter transaksi"
            title="Filter"
          >
            <Filter strokeWidth={2} />
          </IconButton>
        </div>
      </div>

      <SalesEntry open={salesOpen} onClose={() => setSalesOpen(false)} />

      <TransactionEditDialog
        tx={editingTx}
        open={editingTx !== null}
        onClose={() => setEditingTx(null)}
      />

      <div
        className={cx(
          "mb-[18px] rounded-[24px] bg-[linear-gradient(145deg,var(--sage)_0%,rgba(197,255,102,0.35)_100%)] px-5 py-[18px] shadow-soft",
          isFetching && "opacity-[0.72] transition-opacity duration-150 ease-out",
        )}
      >
        <div className="mb-1 text-[0.8rem] font-bold tracking-[0.04em] text-muted-foreground uppercase">
          {periodLabel}
        </div>
        <div className="font-mono text-[1.75rem] leading-[1.15] font-extrabold tracking-[-0.04em] text-ink tabular-nums">
          {rupiah(periodTotal)}
        </div>
        <div className="mt-1.5 text-[0.88rem] font-medium text-muted-foreground">
          {transactions?.length ?? 0} transaksi
          {selectedCustomer ? ` · ${selectedCustomer.name}` : ""}
        </div>
      </div>

      {isLoading ? (
        <SkeletonCards count={3} />
      ) : error ? (
        <Card>
          <ErrorState message="Gagal memuat transaksi." />
        </Card>
      ) : !hasAnyInRange ? (
        <Card>
          <EmptyState>
            {isTodayOnly
              ? "Belum ada transaksi hari ini."
              : "Tidak ada transaksi untuk filter ini."}
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-[22px]">
          {groups.map(({ dayKey, items, dayTotal }) => (
            <section key={dayKey} className="flex flex-col gap-2">
              <div className="mb-0.5 flex items-baseline justify-between gap-3 px-0.5">
                <h3 className="m-0 text-[0.8rem] font-bold tracking-[0.06em] text-ink uppercase">
                  {formatDayGroupLabel(dayKey, {
                    relative: useRelativeLabels,
                  })}
                </h3>
                {items.length > 0 ? (
                  <span className="font-mono text-[0.85rem] font-bold text-ink tabular-nums">
                    {rupiah(dayTotal)}
                  </span>
                ) : null}
              </div>
              {items.length === 0 ? (
                <p className="m-0 rounded-box border border-dashed border-line bg-card px-4 py-3.5 text-[0.9rem] text-muted-foreground">
                  Tidak ada transaksi
                </p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {items.map((tx) => {
                    const isBatal = tx.status === "BATAL";
                    const customerName = tx.customer?.name ?? "Pelanggan";
                    const weight = Number(tx.weightKg);
                    const expanded = expandedId === tx.id;
                    const time = new Date(tx.soldAt).toLocaleTimeString(
                      "id-ID",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    );

                    return (
                      <div
                        key={tx.id}
                        className={cx(
                          "rounded-box border border-solid border-line bg-card shadow-soft transition-[border-color,box-shadow] duration-150 ease-out",
                          expanded &&
                            "border-[color-mix(in_srgb,var(--ink)_18%,var(--line))] shadow-card",
                          isBatal && "border-[#efd5cf] bg-[#f8ece9]",
                        )}
                      >
                        <button
                          type="button"
                          className={cx(
                            "group flex w-full cursor-pointer items-center gap-3 rounded-[inherit] border-none bg-transparent px-3 py-3.5 text-left text-inherit",
                            !expanded &&
                              "hover:bg-[color-mix(in_srgb,var(--sage)_35%,transparent)]",
                          )}
                          onClick={() =>
                            setExpandedId((id) =>
                              id === tx.id ? null : tx.id,
                            )
                          }
                          aria-expanded={expanded}
                          aria-label={
                            expanded
                              ? `Tutup aksi transaksi ${customerName}`
                              : `Buka aksi transaksi ${customerName}`
                          }
                        >
                          <div
                            className={cx(
                              "grid size-[46px] shrink-0 place-items-center rounded-full text-ink [&_svg]:size-5",
                              toneBg[avatarTone(tx.varietyName)],
                            )}
                            aria-hidden
                          >
                            <Sprout strokeWidth={2.25} />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                            <div
                              className={cx(
                                "text-[1.05rem] leading-[1.25] font-bold tracking-[-0.02em] break-words",
                                isBatal ? "text-muted-foreground" : "text-ink",
                              )}
                            >
                              {customerName}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.88rem] leading-[1.35] font-medium text-muted-foreground">
                              <span>{tx.varietyName}</span>
                              <span aria-hidden>·</span>
                              <span>{weight} kg</span>
                              <span aria-hidden>·</span>
                              <span>{time}</span>
                            </div>
                            {isBatal ? (
                              <span className="mt-0.5 inline-flex self-start text-[0.68rem] font-bold tracking-[0.03em] text-[#9a2f1f] uppercase">
                                Dibatalkan
                              </span>
                            ) : null}
                          </div>
                          <div
                            className={cx(
                              "shrink-0 font-mono text-base leading-[1.2] font-bold tracking-[-0.02em] tabular-nums",
                              isBatal
                                ? "text-muted-foreground line-through"
                                : "text-success",
                            )}
                          >
                            {isBatal ? "−" : "+"}
                            {rupiah(tx.subtotal).replace(/^Rp\s?/, "")}
                          </div>
                          <ChevronDown
                            className={cx(
                              "size-[18px] shrink-0 transition-[transform,color] duration-200 ease-out",
                              expanded
                                ? "rotate-180 text-ink"
                                : "text-muted-foreground group-hover:text-ink",
                            )}
                            strokeWidth={2.25}
                            aria-hidden
                          />
                        </button>

                        {expanded ? (
                          <div className="flex flex-wrap gap-2 px-3 pb-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="min-w-0 flex-[1_1_calc(50%-4px)]"
                              disabled={busy}
                              onClick={() => {
                                setEditingTx(tx);
                                setExpandedId(null);
                              }}
                            >
                              Ubah
                            </Button>
                            {isBatal ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="min-w-0 flex-[1_1_calc(50%-4px)]"
                                disabled={busy}
                                onClick={async () => {
                                  await updateStatus.mutateAsync({
                                    id: tx.id,
                                    status: "AKTIF",
                                  });
                                  setExpandedId(null);
                                }}
                              >
                                Aktifkan lagi
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="min-w-0 flex-[1_1_calc(50%-4px)]"
                                disabled={busy}
                                onClick={() =>
                                  setConfirm({ type: "cancel", tx })
                                }
                              >
                                Batalkan
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              className="min-w-0 flex-[1_1_calc(50%-4px)]"
                              disabled={busy}
                              onClick={() =>
                                setConfirm({ type: "delete", tx })
                              }
                            >
                              Hapus
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={filterOpen}
        title="Filter transaksi"
        onClose={() => setFilterOpen(false)}
      >
        <form onSubmit={applyFilter}>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 min-[400px]:gap-3">
            <Field label="Dari tanggal" htmlFor="filterFrom">
              <DatePicker
                id="filterFrom"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={setDraftFrom}
                aria-label="Dari tanggal"
              />
            </Field>
            <Field label="Sampai tanggal" htmlFor="filterTo">
              <DatePicker
                id="filterTo"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={setDraftTo}
                aria-label="Sampai tanggal"
              />
            </Field>
          </div>
          <Field label="Pelanggan" htmlFor="filterCustomer">
            <CustomerSearchSelect
              id="filterCustomer"
              customers={customers ?? []}
              value={draftCustomerId}
              onChange={setDraftCustomerId}
              allowEmpty
              emptyLabel="Semua pelanggan"
              placeholder="Cari nama atau nomor…"
            />
          </Field>
          {filterError ? <FormError>{filterError}</FormError> : null}
          <BtnRow>
            <Button type="button" variant="ghost" onClick={resetToToday}>
              Hari ini
            </Button>
            <Button type="submit" variant="primary">
              Terapkan
            </Button>
          </BtnRow>
        </form>
      </Dialog>

      <Dialog
        open={confirm !== null}
        title={
          confirm?.type === "delete" ? "Hapus transaksi" : "Batalkan transaksi"
        }
        onClose={() => {
          setConfirm(null);
          setActionError("");
        }}
      >
        {confirm ? (
          <>
            <DialogMessage>
              {confirm.type === "delete" ? (
                <>
                  Hapus transaksi{" "}
                  <strong>{confirm.tx.varietyName}</strong> dari{" "}
                  <strong>{confirm.tx.customer?.name ?? "pelanggan"}</strong>{" "}
                  secara permanen?
                </>
              ) : (
                <>
                  Batalkan transaksi{" "}
                  <strong>{confirm.tx.varietyName}</strong> (
                  {rupiah(confirm.tx.subtotal)})?
                </>
              )}
            </DialogMessage>
            {actionError ? <FormError>{actionError}</FormError> : null}
            <BtnRow>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirm(null);
                  setActionError("");
                }}
                disabled={busy}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant={confirm.type === "delete" ? "danger" : "primary"}
                onClick={runConfirm}
                disabled={busy}
              >
                {busy
                  ? "Memproses…"
                  : confirm.type === "delete"
                    ? "Hapus"
                    : "Batalkan"}
              </Button>
            </BtnRow>
          </>
        ) : null}
      </Dialog>
    </AppShell>
  );
}
