import { TransactionStatus } from "@/generated/prisma/client";
import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { BackupPayload } from "@/lib/types";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const [varieties, customers, transactions] = await Promise.all([
    prisma.durianVariety.findMany({ orderBy: { name: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.transaction.findMany({ orderBy: { soldAt: "asc" } }),
  ]);

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    varieties: varieties.map((v) => ({
      name: v.name,
      pricePerKg: v.pricePerKg,
    })),
    customers: customers.map((c) => ({ id: c.id, name: c.name })),
    transactions: transactions.map((t) => ({
      id: t.id,
      customerId: t.customerId,
      varietyName: t.varietyName,
      weightKg: Number(t.weightKg),
      quantity: t.quantity,
      pricePerKg: t.pricePerKg,
      subtotal: t.subtotal,
      status: t.status,
      soldAt: t.soldAt.toISOString(),
    })),
  };

  return json(payload);
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const body = (await request.json().catch(() => null)) as BackupPayload | null;

  if (
    !body ||
    typeof body !== "object" ||
    !Array.isArray(body.customers) ||
    !Array.isArray(body.transactions) ||
    !Array.isArray(body.varieties)
  ) {
    return error("File backup tidak valid atau rusak.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany();
      await tx.customer.deleteMany();
      await tx.durianVariety.deleteMany();

      for (const variety of body.varieties) {
        await tx.durianVariety.create({
          data: {
            name: variety.name,
            pricePerKg: Math.round(Number(variety.pricePerKg) || 0),
          },
        });
      }

      const varietyByName = Object.fromEntries(
        (
          await tx.durianVariety.findMany({
            select: { id: true, name: true },
          })
        ).map((v) => [v.name.toLowerCase(), v]),
      );

      const customerIdMap = new Map<string, string>();

      for (const customer of body.customers) {
        const created = await tx.customer.create({
          data: { name: customer.name },
        });
        customerIdMap.set(customer.id, created.id);
      }

      for (const t of body.transactions) {
        const newCustomerId = customerIdMap.get(t.customerId);
        if (!newCustomerId) continue;

        const variety = varietyByName[t.varietyName.toLowerCase()];
        if (!variety) continue;

        await tx.transaction.create({
          data: {
            customerId: newCustomerId,
            varietyId: variety.id,
            varietyName: t.varietyName,
            weightKg: Number(t.weightKg) || 0,
            quantity: Math.round(Number(t.quantity) || 0),
            pricePerKg: Math.round(Number(t.pricePerKg) || 0),
            subtotal: Math.round(Number(t.subtotal) || 0),
            status:
              t.status === "BATAL"
                ? TransactionStatus.BATAL
                : TransactionStatus.AKTIF,
            soldAt: new Date(t.soldAt),
          },
        });
      }
    });

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return error("Gagal memulihkan data backup.", 500);
  }
}
