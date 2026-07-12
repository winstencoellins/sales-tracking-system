"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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
  SelectInput,
  SkeletonCard,
  SkeletonLine,
  TextInput,
} from "@/components/ui";
import {
  useCustomers,
  useUpdateTransaction,
  useVarieties,
} from "@/hooks/use-durian";
import { rupiah } from "@/lib/format";
import type { Transaction } from "@/lib/types";

export function TransactionEditDialog({
  tx,
  open,
  onClose,
}: {
  tx: Transaction | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: customers, isLoading: loadingCustomers, error: customersError } =
    useCustomers();
  const { data: varieties, isLoading: loadingVarieties, error: varietiesError } =
    useVarieties();
  const updateTx = useUpdateTransaction();

  const [customerId, setCustomerId] = useState("");
  const [varietyId, setVarietyId] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [quantity, setQuantity] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open || !tx) return;
    setCustomerId(tx.customerId);
    setVarietyId(tx.varietyId);
    setWeightKg(String(Number(tx.weightKg)));
    setQuantity(String(tx.quantity));
    setFormError("");
  }, [open, tx]);

  const selectedVariety = varieties?.find((v) => v.id === varietyId);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tx) return;
    setFormError("");

    if (!customerId) {
      setFormError("Pilih pelanggan terlebih dahulu.");
      return;
    }
    if (!varietyId) {
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
      await updateTx.mutateAsync({
        id: tx.id,
        customerId,
        varietyId,
        weightKg: weight,
        quantity: Number.isFinite(qty) ? Math.max(0, Math.round(qty)) : 0,
      });
      onClose();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Gagal mengubah transaksi.",
      );
    }
  }

  return (
    <Dialog open={open} title="Ubah transaksi" onClose={onClose}>
      {!tx ? null : loadingCustomers ? (
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
          <Field label="Pelanggan" htmlFor="editCustomer">
            <SelectInput
              id="editCustomer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectInput>
          </Field>

          <Field label="Jenis">
            <ChipScroll role="listbox" aria-label="Jenis durian">
              {varieties.map((v) => (
                <Chip
                  key={v.id}
                  active={varietyId === v.id}
                  onClick={() => setVarietyId(v.id)}
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
            <Field label="Berat (kg)" htmlFor="editWeight">
              <TextInput
                id="editWeight"
                type="number"
                inputMode="decimal"
                step="0.1"
                min="0"
                placeholder="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </Field>
            <Field label="Jumlah (buah)" htmlFor="editQty">
              <TextInput
                id="editQty"
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
              disabled={updateTx.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateTx.isPending || !customerId}
            >
              {updateTx.isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </BtnRow>
        </form>
      )}
    </Dialog>
  );
}
