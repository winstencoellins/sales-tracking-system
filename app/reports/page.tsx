"use client";

import { Suspense, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DatePicker } from "@/components/date-picker";
import {
  BtnRow,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  FormError,
  LoadingState,
  Muted,
  SectionTitle,
} from "@/components/ui";
import { useTransactions } from "@/hooks/use-durian";
import { useDateRangeUrlState } from "@/hooks/use-url-filters";
import { todayKeyJakarta } from "@/lib/analytics-period";
import {
  dateInputToEndIso,
  dateInputToStartIso,
  formatDateInput,
  formatTanggal,
  rupiah,
} from "@/lib/format";
import type { Transaction } from "@/lib/types";

type CustomerGroup = {
  customerId: string;
  customerName: string;
  transactions: Transaction[];
  total: number;
};

function groupByCustomer(transactions: Transaction[]): CustomerGroup[] {
  const map = new Map<string, CustomerGroup>();

  for (const t of transactions) {
    if (t.status !== "AKTIF") continue;

    const key = t.customerId;
    const existing = map.get(key);
    if (existing) {
      existing.transactions.push(t);
      existing.total += t.subtotal;
    } else {
      map.set(key, {
        customerId: key,
        customerName: t.customer?.name ?? "Tanpa nama",
        transactions: [t],
        total: t.subtotal,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.customerName.localeCompare(b.customerName, "id"),
  );
}

export default function LaporanPage() {
  return (
    <Suspense
      fallback={
        <AppShell subtitle="Generate laporan Excel berdasarkan tanggal">
          <LoadingState />
        </AppShell>
      }
    >
      <LaporanPageContent />
    </Suspense>
  );
}

function LaporanPageContent() {
  const today = todayKeyJakarta();
  const { from, to, setDateRange } = useDateRangeUrlState(today);
  const [exportError, setExportError] = useState("");

  const filters = useMemo(
    () => ({
      from: dateInputToStartIso(from || today),
      to: dateInputToEndIso(to || today),
      sort: "tanggal-asc" as const,
    }),
    [from, to, today],
  );

  const { data: transactions, isLoading, error, isFetching } =
    useTransactions(filters);

  const groups = useMemo(
    () => groupByCustomer(transactions ?? []),
    [transactions],
  );
  const grandTotal = useMemo(
    () => groups.reduce((sum, g) => sum + g.total, 0),
    [groups],
  );

  const rangeLabel = useMemo(() => {
    const fromLabel = formatDateInput(from || today);
    const toLabel = formatDateInput(to || today);
    return `${fromLabel} s/d ${toLabel}`;
  }, [from, to, today]);

  function exportExcel() {
    setExportError("");

    if (groups.length === 0) {
      setExportError("Tidak ada transaksi aktif pada rentang tanggal ini.");
      return;
    }

    try {
      const rows: (string | number)[][] = [
        ["Laporan Penjualan"],
        [`Rentang: ${rangeLabel}`],
        [`Dibuat: ${formatTanggal(new Date().toISOString())}`],
        [],
      ];

      for (const group of groups) {
        rows.push([`Pelanggan: ${group.customerName}`]);
        rows.push([
          "No",
          "Tanggal",
          "Jenis",
          "Berat (kg)",
          "Jumlah",
          "Harga per kg",
          "Subtotal",
        ]);

        group.transactions.forEach((t, i) => {
          rows.push([
            i + 1,
            formatTanggal(t.soldAt),
            t.varietyName,
            Number(t.weightKg),
            t.quantity,
            t.pricePerKg,
            t.subtotal,
          ]);
        });

        rows.push(["", "", "", "", "", "Total pelanggan", group.total]);
        rows.push([]);
      }

      rows.push(["", "", "", "", "", "TOTAL KESELURUHAN", grandTotal]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [
        { wch: 6 },
        { wch: 20 },
        { wch: 16 },
        { wch: 12 },
        { wch: 8 },
        { wch: 16 },
        { wch: 14 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

      const fromSlug = from || today;
      const toSlug = to || today;
      XLSX.writeFile(
        wb,
        `laporan-penjualan-${fromSlug}_${toSlug}.xlsx`,
      );
    } catch (e) {
      console.error(e);
      setExportError(
        e instanceof Error ? e.message : "Export gagal. Silakan coba lagi.",
      );
    }
  }

  return (
    <AppShell subtitle="Generate laporan Excel berdasarkan tanggal">
      <SectionTitle>Filter tanggal</SectionTitle>
      <Card>
        <Muted className="mb-3.5 block leading-normal">
          Pilih rentang tanggal untuk melihat pratinjau laporan. Transaksi
          dikelompokkan per pelanggan beserta total biaya pada periode tersebut.
        </Muted>

        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 min-[400px]:gap-3">
          <Field label="Dari tanggal" htmlFor="dateFrom">
            <DatePicker
              id="dateFrom"
              value={from}
              max={to || undefined}
              onChange={(value) => {
                setDateRange(value, to);
                setExportError("");
              }}
              aria-label="Dari tanggal"
            />
          </Field>
          <Field label="Sampai tanggal" htmlFor="dateTo">
            <DatePicker
              id="dateTo"
              value={to}
              min={from || undefined}
              onChange={(value) => {
                setDateRange(from, value);
                setExportError("");
              }}
              aria-label="Sampai tanggal"
            />
          </Field>
        </div>

        <BtnRow inline className="mt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={exportExcel}
            disabled={isLoading || isFetching || groups.length === 0}
          >
            <Download strokeWidth={2.25} />
            Unduh Excel
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateRange(today, today);
              setExportError("");
            }}
          >
            Reset
          </Button>
        </BtnRow>

        {exportError ? (
          <div className="mt-3.5 [&_p]:mb-0">
            <FormError>{exportError}</FormError>
          </div>
        ) : null}
      </Card>

      <SectionTitle>Pratinjau laporan</SectionTitle>
      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-line py-3 text-[0.95rem]">
          <span>Periode</span>
          <span className="font-mono font-bold text-ink tabular-nums">
            {rangeLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-line py-3 text-[0.95rem]">
          <span>Jumlah pelanggan</span>
          <span className="font-mono font-bold text-ink tabular-nums">
            {groups.length}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-b-0 pt-3.5 text-[1.05rem] font-bold">
          <span>TOTAL KESELURUHAN</span>
          <span className="font-mono font-bold text-ink tabular-nums">
            {rupiah(grandTotal)}
          </span>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message="Gagal memuat pratinjau laporan." />
        ) : groups.length === 0 ? (
          <EmptyState>
            Tidak ada transaksi aktif pada rentang tanggal ini.
          </EmptyState>
        ) : (
          <div className="mt-[18px] flex flex-col gap-[22px]">
            {groups.map((group) => (
              <section key={group.customerId} className="min-w-0">
                <h3 className="m-0 mb-2 text-[1.05rem] font-bold text-ink">
                  {group.customerName}
                </h3>
                <div className="overflow-x-auto rounded-box border border-line">
                  <table className="w-full min-w-[720px] border-collapse text-[0.88rem] print:min-w-0">
                    <thead>
                      <tr>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          No
                        </th>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          Tanggal
                        </th>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          Jenis
                        </th>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          Berat (kg)
                        </th>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          Jumlah
                        </th>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          Harga/kg
                        </th>
                        <th className="bg-forest px-2.5 py-3 text-left font-semibold whitespace-nowrap text-white first:rounded-tl-box last:rounded-tr-box">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.transactions.map((t, i) => (
                        <tr
                          key={t.id}
                          className="even:bg-[rgba(228,237,223,0.35)]"
                        >
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {i + 1}
                          </td>
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {formatTanggal(t.soldAt)}
                          </td>
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {t.varietyName}
                          </td>
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {Number(t.weightKg)}
                          </td>
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {t.quantity}
                          </td>
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {rupiah(t.pricePerKg)}
                          </td>
                          <td className="border-b border-line p-2.5 whitespace-nowrap">
                            {rupiah(t.subtotal)}
                          </td>
                        </tr>
                      ))}
                      <tr className="[&>td]:border-b-0 [&>td]:bg-[rgba(228,237,223,0.7)] [&>td]:p-2.5 [&>td]:font-bold [&>td]:whitespace-nowrap [&>td]:text-ink">
                        <td colSpan={6}>Total pelanggan</td>
                        <td>{rupiah(group.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}
