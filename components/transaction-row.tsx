"use client";

import type { Transaction } from "@/lib/types";
import { formatTanggal, rupiah } from "@/lib/format";
import { cx } from "@/components/ui";

export function TransactionRow({
  tx,
  onCancel,
  onRestore,
  onDelete,
  busy,
}: {
  tx: Transaction;
  onCancel?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
  busy?: boolean;
}) {
  const isBatal = tx.status === "BATAL";
  const weight = Number(tx.weightKg);

  return (
    <div
      className={cx(
        "flex animate-fade-slide-in flex-col overflow-hidden rounded-card bg-card shadow-soft",
        isBatal && "opacity-85",
      )}
    >
      <div className="flex min-h-24">
        <div
          className={cx(
            "flex w-11 shrink-0 items-center justify-center py-2.5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-ink [writing-mode:vertical-rl] rotate-180",
            isBatal ? "bg-danger-bg text-danger" : "bg-lime",
          )}
          aria-hidden
        >
          {tx.varietyName}
        </div>
        <div className="flex min-w-0 flex-1 justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[1.05rem] font-bold">
              {tx.varietyName}
              {isBatal ? (
                <span className="rounded-pill bg-danger px-2 py-0.5 text-[0.7rem] font-bold tracking-[0.02em] text-white">
                  Dibatalkan
                </span>
              ) : null}
            </div>
            <div className="mt-1 text-[0.88rem] text-muted-foreground">
              {weight} kg · {tx.quantity} buah · {rupiah(tx.pricePerKg)}/kg
            </div>
          </div>
          <div
            className={cx(
              "whitespace-nowrap text-right font-mono text-[1.05rem] font-bold tabular-nums",
              isBatal && "text-muted-foreground line-through",
            )}
          >
            {rupiah(tx.subtotal)}
          </div>
        </div>
      </div>
      <div
        className={cx(
          "flex items-center justify-between gap-2.5 px-4 py-2.5 text-[0.8rem] font-semibold text-muted-foreground",
          isBatal ? "bg-danger-bg" : "bg-yellow",
        )}
      >
        <span>{formatTanggal(tx.soldAt)}</span>
        <span
          className={cx(
            "rounded-pill px-2 py-0.5 text-[0.7rem] font-bold text-white",
            isBatal ? "bg-danger tracking-[0.02em]" : "bg-ink",
          )}
        >
          {isBatal ? "Batal" : "Aktif"}
        </span>
      </div>
      {(onCancel || onRestore || onDelete) && (
        <div className="flex gap-2 border-t border-line px-3.5 py-3">
          {isBatal
            ? onRestore && (
                <button
                  type="button"
                  className="min-h-11 flex-1 cursor-pointer rounded-pill border-none bg-sage px-2 py-2.5 text-[0.85rem] font-bold text-ink transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={busy}
                  onClick={() => onRestore(tx.id)}
                >
                  Aktifkan lagi
                </button>
              )
            : onCancel && (
                <button
                  type="button"
                  className="min-h-11 flex-1 cursor-pointer rounded-pill border-[1.5px] border-solid border-danger bg-transparent px-2 py-2.5 text-[0.85rem] font-bold text-danger transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={busy}
                  onClick={() => onCancel(tx.id)}
                >
                  Batalkan
                </button>
              )}
          {onDelete && (
            <button
              type="button"
              className="min-h-11 flex-1 cursor-pointer rounded-pill border-none bg-danger px-2 py-2.5 text-[0.85rem] font-bold text-white transition-transform duration-100 ease-out active:enabled:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={busy}
              onClick={() => onDelete(tx.id)}
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );
}
