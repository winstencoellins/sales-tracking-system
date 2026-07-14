"use client";

import { useRef } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/lib/types";

export type CustomerOption = Pick<Customer, "id" | "name" | "phoneNumber">;

function customerMatches(customer: CustomerOption, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    customer.name.toLowerCase().includes(q) ||
    (customer.phoneNumber?.toLowerCase().includes(q) ?? false)
  );
}

export function CustomerSearchSelect({
  id,
  customers,
  value,
  onChange,
  allowEmpty = false,
  emptyLabel = "Semua pelanggan",
  placeholder = "Cari pelanggan…",
  disabled,
  className,
}: {
  id?: string;
  customers: CustomerOption[];
  value: string;
  onChange: (customerId: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const selected = customers.find((c) => c.id === value) ?? null;
  const selectAllOnFocusRef = useRef(false);

  return (
    <Combobox.Root
      items={customers}
      value={selected}
      onValueChange={(next) => onChange(next?.id ?? "")}
      itemToStringLabel={(c) => c.name}
      isItemEqualToValue={(a, b) => a.id === b.id}
      filter={customerMatches}
      disabled={disabled}
      autoHighlight
    >
      <div className={cn("relative w-full", className)}>
        <Combobox.InputGroup
          className={cn(
            "relative flex min-h-[52px] w-full items-center gap-2 rounded-box border-[1.5px] border-line bg-card px-3.5 transition-[border-color,box-shadow] duration-150 ease-out",
            "focus-within:border-ink focus-within:shadow-[0_0_0_3px_rgba(197,255,102,0.35)]",
            // Kill global :focus-visible outlines on children — they stack on top of the group ring.
            "[&_input]:outline-none! [&_input]:focus:outline-none! [&_input]:focus-visible:outline-none!",
            "[&_button]:outline-none! [&_button]:focus:outline-none! [&_button]:focus-visible:outline-none!",
            disabled && "pointer-events-none opacity-55",
          )}
        >
          <Search
            className="size-[18px] shrink-0 text-muted-foreground"
            strokeWidth={2}
            aria-hidden
          />
          <Combobox.Input
            id={id}
            placeholder={
              allowEmpty && !selected ? emptyLabel : placeholder
            }
            disabled={disabled}
            className="min-w-0 flex-1 border-none bg-transparent py-3.5 text-base text-ink shadow-none ring-0 placeholder:text-muted-foreground disabled:cursor-not-allowed"
            onFocus={(e) => {
              selectAllOnFocusRef.current = true;
              const input = e.currentTarget;
              requestAnimationFrame(() => input.select());
            }}
            onMouseUp={(e) => {
              if (!selectAllOnFocusRef.current) return;
              // Click-to-focus would otherwise collapse the select-all immediately.
              e.preventDefault();
              selectAllOnFocusRef.current = false;
            }}
            onBlur={() => {
              selectAllOnFocusRef.current = false;
            }}
          />
          <div className="flex shrink-0 items-center gap-0.5">
            {allowEmpty ? (
              <Combobox.Clear
                className="grid size-8 place-items-center rounded-full border-none bg-transparent text-muted-foreground shadow-none ring-0 transition-colors hover:bg-sage hover:text-ink disabled:hidden"
                aria-label="Hapus pilihan"
              >
                <X strokeWidth={2.25} className="size-4" />
              </Combobox.Clear>
            ) : null}
            <Combobox.Trigger
              className="grid size-8 place-items-center rounded-full border-none bg-transparent text-muted-foreground shadow-none ring-0 transition-colors hover:bg-sage hover:text-ink"
              aria-label="Buka daftar pelanggan"
            >
              <ChevronDown strokeWidth={2.25} className="size-[18px]" />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner
            className="z-[120] outline-none!"
            sideOffset={6}
            align="start"
          >
            <Combobox.Popup className="max-h-[min(280px,var(--available-height))] w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden rounded-[20px] border-[1.5px] border-line bg-card shadow-[0_16px_40px_rgba(26,26,26,0.14)] outline-none! transition-[transform,opacity] duration-100 data-starting-style:scale-[0.98] data-starting-style:opacity-0 data-ending-style:scale-[0.98] data-ending-style:opacity-0">
              <Combobox.Empty className="px-4 py-5 text-center text-[0.9rem] text-muted-foreground">
                Tidak ada pelanggan yang cocok.
              </Combobox.Empty>
              <Combobox.List className="max-h-[min(280px,var(--available-height))] overflow-y-auto overscroll-contain p-1.5 outline-none! focus:outline-none! focus-visible:outline-none!">
                {(customer: CustomerOption) => (
                  <Combobox.Item
                    key={customer.id}
                    value={customer}
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-[14px] px-3 py-2.5 text-ink outline-none! select-none focus:outline-none! focus-visible:outline-none!",
                      "data-highlighted:bg-sage",
                      "data-selected:font-semibold",
                    )}
                  >
                    <Combobox.ItemIndicator className="mt-0.5 grid size-4 shrink-0 place-items-center text-forest">
                      <Check strokeWidth={2.5} className="size-3.5" />
                    </Combobox.ItemIndicator>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.95rem] leading-snug">
                        {customer.name}
                      </span>
                      {customer.phoneNumber ? (
                        <span className="mt-0.5 block truncate font-mono text-[0.78rem] font-medium tabular-nums text-muted-foreground">
                          {customer.phoneNumber}
                        </span>
                      ) : null}
                    </span>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </div>
    </Combobox.Root>
  );
}
