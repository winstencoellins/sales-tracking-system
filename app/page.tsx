"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  Banknote,
  Filter,
  Receipt,
  Scale,
  Tag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { DatePicker } from "@/components/date-picker";
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
  IconButton,
  MetricTile,
  SectionTitle,
  SkeletonCards,
} from "@/components/ui";
import { WeekTrendChart } from "@/components/week-trend-chart";
import { useAnalytics } from "@/hooks/use-durian";
import { useDateRangeUrlState } from "@/hooks/use-url-filters";
import { formatDateInput, rupiah, toDateInputValue } from "@/lib/format";

function formatKg(n: number): string {
  return `${n.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })} kg`;
}

function changeLabel(pct: number | null): string | null {
  if (pct === null) return null;
  const abs = Math.abs(pct).toLocaleString("id-ID", {
    maximumFractionDigits: 1,
  });
  if (pct > 0) return `+${abs}% vs periode sebelumnya`;
  if (pct < 0) return `−${abs}% vs periode sebelumnya`;
  return `Sama dengan periode sebelumnya`;
}

function BerandaPageContent() {
  const today = toDateInputValue();
  const { from, to, setDateRange } = useDateRangeUrlState(today);

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [filterError, setFilterError] = useState("");

  const filters = useMemo(() => ({ from, to }), [from, to]);
  const { data, isLoading, error, isFetching } = useAnalytics(filters);

  const hasAktif = (data?.kpis.txCount ?? 0) > 0;
  const changePct = data?.kpis.revenueChangePct ?? null;
  const change = changeLabel(changePct);

  const isTodayOnly = from === today && to === today;
  const filterActive = !isTodayOnly;

  const periodLabel = (() => {
    if (isTodayOnly) return "Hari ini";
    if (from === to) return formatDateInput(from);
    return `${formatDateInput(from)} – ${formatDateInput(to)}`;
  })();

  function openFilter() {
    setDraftFrom(from);
    setDraftTo(to);
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
    setDateRange(draftFrom, draftTo);
    setFilterOpen(false);
  }

  function resetToToday() {
    setDraftFrom(today);
    setDraftTo(today);
  }

  return (
    <AppShell subtitle="Ringkasan penjualan">
      <div className="mb-3.5 mt-2 flex items-center justify-between gap-3">
        <h2 className="m-0 text-[1.55rem] font-bold leading-tight tracking-[-0.02em] text-ink">
          Ringkasan.
        </h2>
        <IconButton
          active={filterActive}
          onClick={openFilter}
          aria-label="Filter periode"
          title="Filter"
        >
          <Filter strokeWidth={2} />
        </IconButton>
      </div>

      <div
        className={cx(
          "mb-[18px] rounded-[24px] bg-[linear-gradient(145deg,var(--sage)_0%,rgba(197,255,102,0.35)_100%)] px-5 py-[18px] shadow-soft",
          isFetching && "opacity-[0.72] transition-opacity duration-150 ease-out",
        )}
      >
        <div className="mb-1 text-[0.8rem] font-bold uppercase tracking-[0.04em] text-muted-foreground">
          Periode
        </div>
        <div className="font-mono text-[1.15rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink tabular-nums">
          {periodLabel}
        </div>
      </div>

      <Dialog
        open={filterOpen}
        title="Filter periode"
        onClose={() => setFilterOpen(false)}
      >
        <form onSubmit={applyFilter}>
          <div className="grid grid-cols-1 min-[400px]:grid-cols-2 min-[400px]:gap-3">
            <Field label="Dari tanggal" htmlFor="analyticsFrom">
              <DatePicker
                id="analyticsFrom"
                value={draftFrom}
                max={draftTo || undefined}
                onChange={setDraftFrom}
                aria-label="Dari tanggal"
              />
            </Field>
            <Field label="Sampai tanggal" htmlFor="analyticsTo">
              <DatePicker
                id="analyticsTo"
                value={draftTo}
                min={draftFrom || undefined}
                onChange={setDraftTo}
                aria-label="Sampai tanggal"
              />
            </Field>
          </div>
          {filterError ? <FormError>{filterError}</FormError> : null}
          <BtnRow>
            <Button type="button" variant="ghost" onClick={resetToToday}>
              Hari ini
            </Button>
            <Button type="submit">Terapkan</Button>
          </BtnRow>
        </form>
      </Dialog>

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : error ? (
        <Card>
          <ErrorState message="Gagal memuat ringkasan penjualan." />
        </Card>
      ) : !data ? null : (
        <>
          {!hasAktif ? (
            <Card>
              <EmptyState>
                Belum ada penjualan aktif di periode ini.{" "}
                <Link
                  href="/history"
                  className="inline w-auto text-[0.95rem] font-bold text-ink underline underline-offset-[3px]"
                >
                  Catat penjualan
                </Link>
              </EmptyState>
            </Card>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5 max-[380px]:grid-cols-1">
            <MetricTile
              icon={<Banknote strokeWidth={2} aria-hidden />}
              label="Pendapatan"
              value={rupiah(data.kpis.revenue)}
            />
            <MetricTile
              icon={<Scale strokeWidth={2} aria-hidden />}
              label="Berat terjual"
              value={formatKg(data.kpis.weightKg)}
            />
            <MetricTile
              icon={<Receipt strokeWidth={2} aria-hidden />}
              label="Transaksi"
              value={String(data.kpis.txCount)}
            />
            <MetricTile
              icon={<Tag strokeWidth={2} aria-hidden />}
              label="Harga efektif"
              value={`${rupiah(data.kpis.effectivePricePerKg)}/kg`}
            />
          </div>

          {change ? (
            <p
              className={cx(
                "my-2.5 mb-1 flex items-center gap-1.5 text-[0.85rem] font-semibold text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0",
                changePct !== null &&
                  changePct > 0 &&
                  "text-ink [&_svg]:text-success",
                changePct !== null && changePct < 0 && "[&_svg]:text-danger",
              )}
            >
              {changePct !== null && changePct > 0 ? (
                <TrendingUp strokeWidth={2} aria-hidden />
              ) : changePct !== null && changePct < 0 ? (
                <TrendingDown strokeWidth={2} aria-hidden />
              ) : null}
              <span>{change}</span>
            </p>
          ) : (
            <p className="my-2.5 mb-1 flex items-center gap-1.5 text-[0.85rem] font-medium text-muted-foreground">
              Belum ada data periode sebelumnya untuk dibandingkan.
            </p>
          )}

          <SectionTitle>7 hari terakhir</SectionTitle>
          <Card className="px-3.5 pt-4 pb-3">
            <WeekTrendChart days={data.last7Days} />
          </Card>

          <SectionTitle>Bauran jenis</SectionTitle>
          <Card>
            {data.byVariety.length === 0 ? (
              <EmptyState>Belum ada penjualan per jenis.</EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {data.byVariety.map((row) => (
                  <li key={row.varietyName} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2.5">
                      <span className="text-[0.95rem] font-bold text-ink">
                        {row.varietyName}
                      </span>
                      <span className="whitespace-nowrap text-[0.88rem] font-bold text-ink tabular-nums">
                        {rupiah(row.revenue)}
                      </span>
                    </div>
                    <div className="text-[0.78rem] font-medium text-muted-foreground">
                      {formatKg(row.weightKg)} · {row.share}%
                    </div>
                    <div
                      className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--sage)_45%,#fff)]"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-[inherit] bg-lime"
                        style={{ width: `${Math.min(100, row.share)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <SectionTitle>Pelanggan teratas</SectionTitle>
          <Card>
            {data.topCustomers.length === 0 ? (
              <EmptyState>Belum ada pelanggan di periode ini.</EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {data.topCustomers.map((row) => (
                  <li key={row.customerId} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2.5">
                      <span className="text-[0.95rem] font-bold text-ink">
                        {row.name}
                      </span>
                      <span className="whitespace-nowrap text-[0.88rem] font-bold text-ink tabular-nums">
                        {rupiah(row.revenue)}
                      </span>
                    </div>
                    <div className="text-[0.78rem] font-medium text-muted-foreground">
                      {row.txCount} transaksi · {row.share}%
                    </div>
                    <div
                      className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--sage)_45%,#fff)]"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-[inherit] bg-sage"
                        style={{ width: `${Math.min(100, row.share)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <SectionTitle>Operasional</SectionTitle>
          <Card className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
            <div className="flex items-start gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-ink">
              <Ban strokeWidth={2} aria-hidden />
              <div>
                <div className="text-[0.75rem] font-semibold text-muted-foreground">
                  Dibatalkan
                </div>
                <div className="text-[0.9rem] font-bold text-ink tabular-nums">
                  {data.ops.cancelledCount} ({data.ops.cancelRate}%)
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 [&_svg]:mt-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-ink">
              <Receipt strokeWidth={2} aria-hidden />
              <div>
                <div className="text-[0.75rem] font-semibold text-muted-foreground">
                  Rata-rata nota
                </div>
                <div className="text-[0.9rem] font-bold text-ink tabular-nums">
                  {rupiah(data.ops.avgTicket)}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </AppShell>
  );
}

export default function BerandaPage() {
  return (
    <Suspense
      fallback={
        <AppShell subtitle="Ringkasan penjualan">
          <SkeletonCards count={4} />
        </AppShell>
      }
    >
      <BerandaPageContent />
    </Suspense>
  );
}
