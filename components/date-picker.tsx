"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/components/ui";
import { formatDateInput, toDateInputValue } from "@/lib/format";

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

function parseKey(key: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function keyFromParts(y: number, m: number, d: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${y}-${pad(m)}-${pad(d)}`;
}

function monthLabel(y: number, m: number): string {
  return `${MONTHS[m - 1]} ${y}`;
}

/** Monday-first weekday index for a YYYY-MM-DD key. */
function mondayIndex(y: number, m: number, d: number): number {
  const day = new Date(y, m - 1, d).getDay(); // 0 Sun
  return day === 0 ? 6 : day - 1;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = "Pilih tanggal",
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
}) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = parseKey(value);
  const todayKey = toDateInputValue();

  const initialMonth = selected
    ? { y: selected.y, m: selected.m }
    : (() => {
        const t = parseKey(todayKey)!;
        return { y: t.y, m: t.m };
      })();

  const [view, setView] = useState(initialMonth);

  useEffect(() => {
    if (!open) return;
    if (selected) {
      setView({ y: selected.y, m: selected.m });
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  const days = useMemo(() => {
    const { y, m } = view;
    const firstDow = mondayIndex(y, m, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells: Array<{
      key: string;
      day: number;
      inMonth: boolean;
      disabled: boolean;
    }> = [];

    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;
    const prevDays = new Date(prevYear, prevMonth, 0).getDate();
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = prevDays - i;
      const key = keyFromParts(prevYear, prevMonth, d);
      cells.push({
        key,
        day: d,
        inMonth: false,
        disabled: isOutOfRange(key, min, max),
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = keyFromParts(y, m, d);
      cells.push({
        key,
        day: d,
        inMonth: true,
        disabled: isOutOfRange(key, min, max),
      });
    }

    let nextDay = 1;
    const nextMonth = m === 12 ? 1 : m + 1;
    const nextYear = m === 12 ? y + 1 : y;
    while (cells.length % 7 !== 0) {
      const key = keyFromParts(nextYear, nextMonth, nextDay);
      cells.push({
        key,
        day: nextDay,
        inMonth: false,
        disabled: isOutOfRange(key, min, max),
      });
      nextDay += 1;
    }

    return cells;
  }, [view, min, max]);

  function shiftMonth(delta: number) {
    setView((v) => {
      const dt = new Date(v.y, v.m - 1 + delta, 1);
      return { y: dt.getFullYear(), m: dt.getMonth() + 1 };
    });
  }

  function selectDay(key: string, isDisabled: boolean) {
    if (isDisabled) return;
    onChange(key);
    setOpen(false);
  }

  const display = selected ? formatDateInput(value) : placeholder;
  const todayDisabled = isOutOfRange(todayKey, min, max);

  return (
    <div
      ref={rootRef}
      className={cx(
        "relative w-full",
        disabled && "pointer-events-none opacity-55",
      )}
    >
      <button
        type="button"
        id={triggerId}
        className={cx(
          "flex w-full min-h-[52px] cursor-pointer items-center gap-2.5 rounded-box border-[1.5px] border-solid border-line bg-card px-3.5 py-3 text-left text-base font-semibold text-ink transition-[border-color,box-shadow,background] duration-150 ease-out hover:border-[color-mix(in_srgb,var(--ink)_22%,var(--line))] focus-visible:border-ink focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(197,214,58,0.35)] [&_svg]:size-[18px] [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
          open &&
            "border-ink shadow-[0_0_0_3px_rgba(197,214,58,0.35)] outline-none",
        )}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel ?? "Pilih tanggal"}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarDays strokeWidth={2} aria-hidden />
        <span
          className={cx(
            "min-w-0 flex-1",
            !selected && "font-medium text-muted-foreground",
          )}
        >
          {display}
        </span>
      </button>

      {open ? (
        <div
          className="relative z-2 mt-2 animate-date-picker-in rounded-[20px] border border-line bg-card p-3.5 shadow-card"
          role="dialog"
          aria-modal="false"
          aria-label="Kalender"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid size-9 cursor-pointer place-items-center rounded-xl border-none bg-sage text-ink transition-colors duration-150 ease-out hover:bg-sage-deep [&_svg]:size-[18px]"
              onClick={() => shiftMonth(-1)}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft strokeWidth={2.25} />
            </button>
            <div className="text-[0.95rem] font-bold tracking-[-0.02em] text-ink">
              {monthLabel(view.y, view.m)}
            </div>
            <button
              type="button"
              className="grid size-9 cursor-pointer place-items-center rounded-xl border-none bg-sage text-ink transition-colors duration-150 ease-out hover:bg-sage-deep [&_svg]:size-[18px]"
              onClick={() => shiftMonth(1)}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight strokeWidth={2.25} />
            </button>
          </div>

          <div className="mb-1.5 grid grid-cols-7 gap-0.5" aria-hidden>
            {WEEKDAYS.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className="px-0 py-1 text-center text-[0.68rem] font-bold uppercase tracking-[0.04em] text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((cell) => {
              const isSelected = cell.key === value;
              const isToday = cell.key === todayKey;
              return (
                <button
                  key={cell.key}
                  type="button"
                  className={cx(
                    "aspect-square cursor-pointer rounded-xl border-none bg-transparent text-[0.9rem] font-semibold tabular-nums text-ink transition-[background,color] duration-100 ease-out hover:enabled:not-aria-pressed:bg-sage disabled:cursor-not-allowed disabled:opacity-28",
                    !cell.inMonth && "font-medium text-[#b0b0b0]",
                    isToday && !isSelected && "bg-yellow",
                    isSelected &&
                      "bg-lime font-bold text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_12%,transparent)]",
                  )}
                  aria-pressed={isSelected}
                  disabled={cell.disabled}
                  onClick={() => selectDay(cell.key, cell.disabled)}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 flex justify-center border-t border-line pt-2">
            <button
              type="button"
              className="cursor-pointer rounded-pill border-none bg-transparent px-3.5 py-2 text-[0.85rem] font-bold text-ink hover:enabled:bg-sage disabled:cursor-not-allowed disabled:opacity-40"
              disabled={todayDisabled}
              onClick={() => selectDay(todayKey, todayDisabled)}
            >
              Hari ini
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isOutOfRange(key: string, min?: string, max?: string): boolean {
  if (min && key < min) return true;
  if (max && key > max) return true;
  return false;
}
