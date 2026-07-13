"use client";

import { useState } from "react";
import { cx } from "@/components/ui";
import { formatDateInput, rupiah } from "@/lib/format";

type DayPoint = {
  dateKey: string;
  revenue: number;
};

function weekdayShort(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", {
    weekday: "short",
  });
}

export function WeekTrendChart({ days }: { days: DayPoint[] }) {
  const maxRevenue = Math.max(1, ...days.map((d) => d.revenue));
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const activeDay = days.find((d) => d.dateKey === hoveredKey) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex min-h-[44px] items-center justify-center px-1"
        aria-live="polite"
      >
        {activeDay ? (
          <div className="rounded-lg bg-ink px-2.5 py-1.5 text-center text-[0.72rem] font-semibold leading-tight text-white">
            <span className="block whitespace-nowrap">
              {formatDateInput(activeDay.dateKey)}
            </span>
            <span className="mt-0.5 block font-mono text-[0.78rem] font-bold tabular-nums">
              {rupiah(activeDay.revenue)}
            </span>
          </div>
        ) : (
          <p className="m-0 text-center text-[0.78rem] font-medium text-muted-foreground">
            Arahkan atau ketuk batang untuk melihat nilai
          </p>
        )}
      </div>

      <div
        className="flex h-[120px] items-end justify-between gap-1.5"
        role="list"
        aria-label="Tren pendapatan 7 hari"
      >
        {days.map((day) => {
          const height =
            day.revenue <= 0
              ? 4
              : Math.max(10, Math.round((day.revenue / maxRevenue) * 100));
          const isActive = hoveredKey === day.dateKey;

          return (
            <button
              key={day.dateKey}
              type="button"
              role="listitem"
              className={cx(
                "flex h-full min-w-0 flex-1 cursor-pointer flex-col items-center gap-2 rounded-lg border-none bg-transparent p-0 outline-none",
                "focus-visible:ring-2 focus-visible:ring-ink/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cream,#f7f6f0)]",
              )}
              aria-label={`${formatDateInput(day.dateKey)}: ${rupiah(day.revenue)}`}
              onMouseEnter={() => setHoveredKey(day.dateKey)}
              onMouseLeave={() => setHoveredKey(null)}
              onFocus={() => setHoveredKey(day.dateKey)}
              onBlur={() => setHoveredKey(null)}
              onClick={() =>
                setHoveredKey((prev) =>
                  prev === day.dateKey ? null : day.dateKey,
                )
              }
            >
              <div className="flex w-full flex-1 items-end justify-center">
                <span
                  className={cx(
                    "min-h-1 w-[70%] max-w-7 rounded-t-md rounded-b-[3px] transition-[height,background-color] duration-200 ease-out",
                    day.revenue <= 0
                      ? "bg-[color-mix(in_srgb,var(--sage)_55%,#fff)]"
                      : "bg-sage",
                    isActive && "bg-lime",
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span
                className={cx(
                  "text-[0.68rem] font-semibold capitalize text-muted-foreground transition-colors duration-150",
                  isActive && "font-bold text-ink",
                )}
              >
                {weekdayShort(day.dateKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
