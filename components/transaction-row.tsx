"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { formatTanggal, rupiah } from "@/lib/format";
import { cx } from "@/components/ui";

export function TransactionRow({
  tx,
  onCancel,
  onRestore,
  onDelete,
  onEdit,
  busy,
  selectable,
  selected,
  onSelectChange,
}: {
  tx: Transaction;
  onCancel?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
  busy?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (id: string, selected: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const isBatal = tx.status === "BATAL";
  const weight = Number(tx.weightKg);
  const canSelect = Boolean(selectable && !isBatal && onSelectChange);
  const showActions = Boolean(onCancel || onRestore || onDelete || onEdit);

  return (
    <div
      className={cx(
        "animate-fade-slide-in rounded-[20px] border-[1.5px] border-solid bg-card transition-[border-color,box-shadow,background] duration-150 ease-out",
        selected
          ? "border-sage-deep bg-[color-mix(in_srgb,var(--sage)_28%,#fff)] shadow-soft"
          : "border-line shadow-soft",
        isBatal && "opacity-70",
      )}
    >
      <div className="flex items-start gap-3 px-3.5 py-3.5">
        {canSelect ? (
          <label className="mt-0.5 flex size-9 shrink-0 cursor-pointer items-center justify-center">
            <input
              type="checkbox"
              className="size-[18px] accent-[var(--forest)]"
              checked={Boolean(selected)}
              onChange={(e) => onSelectChange?.(tx.id, e.target.checked)}
              aria-label={`Pilih transaksi ${tx.varietyName} untuk invoice`}
            />
          </label>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span
                  className={cx(
                    "truncate text-[1.05rem] font-bold tracking-[-0.02em] text-ink",
                    isBatal && "text-muted-foreground",
                  )}
                >
                  {tx.varietyName}
                </span>
                {isBatal ? (
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-danger">
                    Batal
                  </span>
                ) : null}
              </div>
              <p className="mt-1 mb-0 text-[0.84rem] leading-snug text-muted-foreground">
                {weight} kg
                {tx.quantity > 0 ? ` · ${tx.quantity} buah` : ""}
                {" · "}
                {formatTanggal(tx.soldAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-start gap-1">
              <span
                className={cx(
                  "pt-0.5 font-mono text-[1.02rem] font-extrabold tracking-[-0.02em] tabular-nums",
                  isBatal
                    ? "text-muted-foreground line-through"
                    : "text-ink",
                )}
              >
                {rupiah(tx.subtotal)}
              </span>
              {showActions ? (
                <button
                  type="button"
                  className={cx(
                    "grid size-9 place-items-center rounded-full border-none bg-transparent text-muted-foreground transition-colors duration-100 ease-out hover:bg-sage hover:text-ink",
                    open && "bg-sage text-ink",
                  )}
                  aria-expanded={open}
                  aria-label={open ? "Tutup aksi" : "Buka aksi"}
                  onClick={() => setOpen((v) => !v)}
                >
                  <MoreHorizontal strokeWidth={2.25} className="size-[18px]" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showActions && open ? (
        <div className="flex flex-wrap gap-2 border-t border-line px-3.5 py-2.5">
          {onEdit ? (
            <button
              type="button"
              className="min-h-9 min-w-0 flex-[1_1_auto] cursor-pointer rounded-pill border-none bg-sage px-3 py-2 text-[0.8rem] font-bold text-ink transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={busy}
              onClick={() => onEdit(tx)}
            >
              Ubah
            </button>
          ) : null}
          {isBatal
            ? onRestore && (
                <button
                  type="button"
                  className="min-h-9 min-w-0 flex-[1_1_auto] cursor-pointer rounded-pill border-none bg-sage px-3 py-2 text-[0.8rem] font-bold text-ink transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={busy}
                  onClick={() => onRestore(tx.id)}
                >
                  Aktifkan
                </button>
              )
            : onCancel && (
                <button
                  type="button"
                  className="min-h-9 min-w-0 flex-[1_1_auto] cursor-pointer rounded-pill border-[1.5px] border-solid border-[color-mix(in_srgb,var(--danger)_35%,var(--line))] bg-transparent px-3 py-2 text-[0.8rem] font-bold text-danger transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={busy}
                  onClick={() => onCancel(tx.id)}
                >
                  Batalkan
                </button>
              )}
          {onDelete ? (
            <button
              type="button"
              className="min-h-9 min-w-0 flex-[1_1_auto] cursor-pointer rounded-pill border-none bg-danger-bg px-3 py-2 text-[0.8rem] font-bold text-danger transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={busy}
              onClick={() => onDelete(tx.id)}
            >
              Hapus
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
