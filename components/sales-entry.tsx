"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CustomerSearchSelect } from "@/components/customer-search-select";
import {
  BtnRow,
  Button,
  Chip,
  ChipScroll,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  FieldRow,
  FormError,
  SkeletonCard,
  SkeletonLine,
  TextInput,
} from "@/components/ui";
import {
  useCreateTransaction,
  useCustomers,
  useVarieties,
} from "@/hooks/use-durian";
import { rupiah } from "@/lib/format";

const SELECTED_CUSTOMER_KEY = "durian-selected-customer";
const SELECTED_CUSTOMER_EVENT = "durian-selected-customer";

function subscribeSelectedCustomer(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SELECTED_CUSTOMER_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SELECTED_CUSTOMER_EVENT, onStoreChange);
  };
}

function getSelectedCustomerSnapshot() {
  return localStorage.getItem(SELECTED_CUSTOMER_KEY) ?? "";
}

function getSelectedCustomerServerSnapshot() {
  return "";
}

function writeSelectedCustomer(id: string) {
  localStorage.setItem(SELECTED_CUSTOMER_KEY, id);
  window.dispatchEvent(new Event(SELECTED_CUSTOMER_EVENT));
}

export function SalesEntry({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: customers, isLoading: loadingCustomers, error: customersError } =
    useCustomers();
  const { data: varieties, isLoading: loadingVarieties, error: varietiesError } =
    useVarieties();
  const createTx = useCreateTransaction();

  const savedCustomerId = useSyncExternalStore(
    subscribeSelectedCustomer,
    getSelectedCustomerSnapshot,
    getSelectedCustomerServerSnapshot,
  );

  const [customerId, setCustomerIdState] = useState<string | null>(null);
  const [varietyId, setVarietyIdState] = useState<string | null>(null);
  const [weightKg, setWeightKg] = useState("");
  const [quantity, setQuantity] = useState("");
  const [formError, setFormError] = useState("");
  const [wasOpen, setWasOpen] = useState(false);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFormError("");
      setWeightKg("");
      setQuantity("");
    }
  }

  const preferredCustomerId = customerId ?? savedCustomerId;
  const resolvedCustomerId =
    preferredCustomerId &&
    customers?.some((c) => c.id === preferredCustomerId)
      ? preferredCustomerId
      : (customers?.[0]?.id ?? "");

  const resolvedVarietyId =
    varietyId && varieties?.some((v) => v.id === varietyId)
      ? varietyId
      : (varieties?.[0]?.id ?? "");

  const selectedVariety = varieties?.find((v) => v.id === resolvedVarietyId);

  function setCustomerId(id: string) {
    setCustomerIdState(id);
    writeSelectedCustomer(id);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!resolvedCustomerId) {
      setFormError("Pilih atau tambah pelanggan terlebih dahulu.");
      return;
    }
    if (!resolvedVarietyId) {
      setFormError("Pilih jenis durian terlebih dahulu.");
      return;
    }

    const weight = Number(weightKg);
    const qty = Number(quantity || 0);

    if (!Number.isFinite(weight) || weight <= 0) {
      setFormError("Isi berat (kg) lebih dari 0.");
      return;
    }

    try {
      await createTx.mutateAsync({
        customerId: resolvedCustomerId,
        varietyId: resolvedVarietyId,
        weightKg: weight,
        quantity: Number.isFinite(qty) ? Math.max(0, Math.round(qty)) : 0,
      });
      setWeightKg("");
      setQuantity("");
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal menambah transaksi.",
      );
    }
  }

  return (
    <Dialog open={open} title="Catat penjualan" onClose={onClose}>
      {loadingCustomers ? (
        <SkeletonLine className="w-3/5" />
      ) : customersError ? (
        <ErrorState message="Gagal memuat pelanggan." />
      ) : !customers?.length ? (
        <EmptyState>
          Belum ada pelanggan.{" "}
          <Link
            href="/customers"
            className="inline w-auto cursor-pointer border-none bg-transparent p-0 text-[0.95rem] font-bold text-ink underline underline-offset-[3px]"
          >
            Tambah pelanggan dulu
          </Link>
        </EmptyState>
      ) : loadingVarieties ? (
        <SkeletonCard />
      ) : varietiesError ? (
        <ErrorState message="Gagal memuat jenis durian." />
      ) : !varieties?.length ? (
        <EmptyState>
          Belum ada jenis durian.{" "}
          <Link
            href="/varieties"
            className="inline w-auto cursor-pointer border-none bg-transparent p-0 text-[0.95rem] font-bold text-ink underline underline-offset-[3px]"
          >
            Atur harga dulu
          </Link>
        </EmptyState>
      ) : (
        <form onSubmit={onSubmit}>
          <Field label="Pelanggan" htmlFor="salesCustomer">
            <CustomerSearchSelect
              id="salesCustomer"
              customers={customers}
              value={resolvedCustomerId}
              onChange={setCustomerId}
              placeholder="Cari nama atau nomor…"
            />
          </Field>

          <Field label="Jenis">
            <ChipScroll role="listbox" aria-label="Jenis durian">
              {varieties.map((v) => (
                <Chip
                  key={v.id}
                  active={resolvedVarietyId === v.id}
                  onClick={() => setVarietyIdState(v.id)}
                >
                  {v.name}
                </Chip>
              ))}
            </ChipScroll>
            {selectedVariety ? (
              <p className="mt-1.5 mb-0 font-mono text-[0.9rem] font-semibold tabular-nums text-muted-foreground">
                {rupiah(selectedVariety.pricePerKg)}/kg
              </p>
            ) : null}
          </Field>

          <FieldRow>
            <Field label="Berat (kg)" htmlFor="salesWeight">
              <TextInput
                id="salesWeight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </Field>
            <Field label="Jumlah (buah)" htmlFor="salesQty">
              <TextInput
                id="salesQty"
                type="number"
                inputMode="numeric"
                step="1"
                min="0"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </Field>
          </FieldRow>

          {formError ? <FormError>{formError}</FormError> : null}

          <BtnRow>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={createTx.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createTx.isPending || !resolvedCustomerId}
            >
              {createTx.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </BtnRow>
        </form>
      )}
    </Dialog>
  );
}
