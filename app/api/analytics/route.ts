import { TransactionStatus } from "@/generated/prisma/client";
import {
  endOfDayJakarta,
  isDateKey,
  lastNDateKeys,
  resolveDateRangeWindow,
  startOfDayJakarta,
  todayKeyJakarta,
} from "@/lib/analytics-period";
import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { AnalyticsResponse } from "@/lib/types";

function weightOf(value: { toString(): string } | number | string): number {
  return Number(value);
}

function pctChange(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 1000) / 10;
}

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const today = todayKeyJakarta();
  const fromParam = searchParams.get("from") || today;
  const toParam = searchParams.get("to") || today;

  if (!isDateKey(fromParam) || !isDateKey(toParam)) {
    return error("Tanggal tidak valid. Gunakan format YYYY-MM-DD.");
  }
  if (fromParam > toParam) {
    return error("Tanggal mulai tidak boleh setelah tanggal akhir.");
  }

  const { from, to, priorFrom, priorTo } = resolveDateRangeWindow(
    fromParam,
    toParam,
  );
  const last7Keys = lastNDateKeys(today, 7);

  // Fetch through the later of selected `to` and today (for 7-day trend)
  const fetchEndKey = to > today ? to : today;
  const fetchEnd = endOfDayJakarta(fetchEndKey);
  const fetchStart = startOfDayJakarta(
    priorFrom < last7Keys[0]! ? priorFrom : last7Keys[0]!,
  );

  const rows = await prisma.transaction.findMany({
    where: {
      soldAt: { gte: fetchStart, lte: fetchEnd },
    },
    select: {
      customerId: true,
      varietyName: true,
      weightKg: true,
      subtotal: true,
      status: true,
      soldAt: true,
      customer: { select: { id: true, name: true } },
    },
  });

  const inWindow = (soldAt: Date, startKey: string, endKey: string) => {
    const t = soldAt.getTime();
    return (
      t >= startOfDayJakarta(startKey).getTime() &&
      t <= endOfDayJakarta(endKey).getTime()
    );
  };

  const periodRows = rows.filter((r) => inWindow(r.soldAt, from, to));
  const priorRows = rows.filter((r) => inWindow(r.soldAt, priorFrom, priorTo));
  const aktif = periodRows.filter((r) => r.status === TransactionStatus.AKTIF);
  const priorAktif = priorRows.filter(
    (r) => r.status === TransactionStatus.AKTIF,
  );
  const cancelled = periodRows.filter(
    (r) => r.status === TransactionStatus.BATAL,
  );

  const revenue = aktif.reduce((sum, r) => sum + r.subtotal, 0);
  const weightKg =
    Math.round(aktif.reduce((sum, r) => sum + weightOf(r.weightKg), 0) * 100) /
    100;
  const txCount = aktif.length;
  const priorRevenue = priorAktif.reduce((sum, r) => sum + r.subtotal, 0);
  const effectivePricePerKg =
    weightKg > 0 ? Math.round(revenue / weightKg) : 0;

  const varietyMap = new Map<
    string,
    { revenue: number; weightKg: number }
  >();
  for (const r of aktif) {
    const cur = varietyMap.get(r.varietyName) ?? {
      revenue: 0,
      weightKg: 0,
    };
    cur.revenue += r.subtotal;
    cur.weightKg += weightOf(r.weightKg);
    varietyMap.set(r.varietyName, cur);
  }
  const byVariety = Array.from(varietyMap.entries())
    .map(([varietyName, v]) => ({
      varietyName,
      revenue: v.revenue,
      weightKg: Math.round(v.weightKg * 100) / 100,
      share: revenue > 0 ? Math.round((v.revenue / revenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const customerMap = new Map<
    string,
    { name: string; revenue: number; txCount: number }
  >();
  for (const r of aktif) {
    const cur = customerMap.get(r.customerId) ?? {
      name: r.customer.name,
      revenue: 0,
      txCount: 0,
    };
    cur.revenue += r.subtotal;
    cur.txCount += 1;
    customerMap.set(r.customerId, cur);
  }
  const topCustomers = Array.from(customerMap.entries())
    .map(([customerId, c]) => ({
      customerId,
      name: c.name,
      revenue: c.revenue,
      txCount: c.txCount,
      share: revenue > 0 ? Math.round((c.revenue / revenue) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const dayRevenue = new Map<string, number>();
  for (const key of last7Keys) dayRevenue.set(key, 0);
  for (const r of rows) {
    if (r.status !== TransactionStatus.AKTIF) continue;
    if (!inWindow(r.soldAt, last7Keys[0]!, last7Keys[last7Keys.length - 1]!)) {
      continue;
    }
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(r.soldAt);
    if (dayRevenue.has(key)) {
      dayRevenue.set(key, (dayRevenue.get(key) ?? 0) + r.subtotal);
    }
  }
  const last7Days = last7Keys.map((dateKey) => ({
    dateKey,
    revenue: dayRevenue.get(dateKey) ?? 0,
  }));

  const totalInPeriod = periodRows.length;
  const payload: AnalyticsResponse = {
    from,
    to,
    kpis: {
      revenue,
      weightKg,
      txCount,
      effectivePricePerKg,
      revenueChangePct: pctChange(revenue, priorRevenue),
    },
    byVariety,
    topCustomers,
    last7Days,
    ops: {
      cancelledCount: cancelled.length,
      cancelRate:
        totalInPeriod > 0
          ? Math.round((cancelled.length / totalInPeriod) * 1000) / 10
          : 0,
      avgTicket: txCount > 0 ? Math.round(revenue / txCount) : 0,
    },
  };

  return json(payload);
}
