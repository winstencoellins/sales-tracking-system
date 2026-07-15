"use client";

import type { Customer, Transaction } from "@/lib/types";
import { formatDateInput, toDateInputValue, rupiah } from "@/lib/format";
import { buildInvoiceNumber } from "@/lib/invoice-print";

export function InvoiceDocument({
  customer,
  transactions,
  issuedAt = new Date(),
}: {
  customer: Pick<Customer, "name" | "phoneNumber">;
  transactions: Transaction[];
  issuedAt?: Date;
}) {
  const total = transactions.reduce((sum, t) => sum + t.subtotal, 0);
  const dateKey = toDateInputValue(issuedAt);
  const invoiceNo = buildInvoiceNumber(
    issuedAt,
    customer.name,
    transactions.map((t) => t.id).join(","),
  );

  return (
    <div className="overflow-hidden rounded-[4px] bg-white text-ink">
      <div className="bg-forest px-5 py-6 text-white sm:px-7 sm:py-7">
        <h1 className="m-0 text-[1.75rem] font-extrabold tracking-[-0.03em] sm:text-[2rem]">
          Invoice
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <p className="m-0 text-[0.72rem] font-medium text-white/55">
              Invoice Number:
            </p>
            <p className="m-0 mt-1 font-mono text-[0.95rem] font-semibold tabular-nums text-white/90">
              {invoiceNo}
            </p>
          </div>
          <div>
            <p className="m-0 text-[0.72rem] font-medium text-white/55">Date:</p>
            <p className="m-0 mt-1 text-[0.95rem] font-semibold text-white/90">
              {formatDateInput(dateKey)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-7">
        <div className="mb-7">
          <p className="m-0 text-[0.95rem] font-bold tracking-[-0.01em] text-ink">
            Bill To
          </p>
          <p className="m-0 mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground">
            {customer.name}
            {customer.phoneNumber ? (
              <>
                <br />
                {customer.phoneNumber}
              </>
            ) : null}
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.55fr_0.9fr_0.95fr] gap-2 bg-muted px-3 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.06em] text-ink">
          <span>Jenis</span>
          <span className="text-right">Berat</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Harga</span>
          <span className="text-right">Subtotal</span>
        </div>

        <div className="divide-y divide-line/70">
          {transactions.map((t) => (
            <div
              key={t.id}
              className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.55fr_0.9fr_0.95fr] gap-2 px-3 py-3.5 text-[0.88rem]"
            >
              <span className="min-w-0 truncate font-medium text-ink">
                {t.varietyName}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {Number(t.weightKg)} kg
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {t.quantity}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {rupiah(t.pricePerKg)}
              </span>
              <span className="text-right font-semibold tabular-nums text-ink">
                {rupiah(t.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-2 border-t border-ink/80 pt-4">
          <div className="flex items-center justify-between gap-3 px-1 py-1.5">
            <span className="text-[0.9rem] font-semibold text-ink">
              Invoice Total
            </span>
            <span className="font-mono text-[0.95rem] font-bold tabular-nums text-ink">
              {rupiah(total)}
            </span>
          </div>
        </div>

        <div className="mt-3 border-t border-ink/80 pt-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-[1rem] font-extrabold tracking-[-0.02em] text-forest">
              Amount Due
            </span>
            <span className="font-mono text-[1.15rem] font-extrabold tracking-[-0.03em] tabular-nums text-forest">
              {rupiah(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
