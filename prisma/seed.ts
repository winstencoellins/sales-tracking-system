import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TransactionStatus } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const TEST_CUSTOMER_NAMES = new Set(["A", "B", "C", "D"]);

type BackupCustomer = { id: string; name: string };
type BackupTransaction = {
  id: string;
  customerId: string;
  jenis: string;
  berat: number;
  jumlah: number;
  subtotal: number;
  status: string;
  tanggal: string;
};
type BackupFile = {
  prices: Record<string, number>;
  customers: BackupCustomer[];
  transactions: BackupTransaction[];
};

function loadBackup(): BackupFile {
  const path = join(
    process.cwd(),
    "templates/backup-kalkulator-durian-2026-07-11.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as BackupFile;
}

async function main() {
  const backup = loadBackup();

  const customers = backup.customers.filter(
    (c) => !TEST_CUSTOMER_NAMES.has(c.name),
  );
  const keptCustomerIds = new Set(customers.map((c) => c.id));
  const transactions = backup.transactions.filter((t) =>
    keptCustomerIds.has(t.customerId),
  );

  await prisma.$transaction(async (tx) => {
    await tx.transaction.deleteMany();
    await tx.customer.deleteMany();
    await tx.durianVariety.deleteMany();

    for (const [name, pricePerKg] of Object.entries(backup.prices)) {
      await tx.durianVariety.create({
        data: { name, pricePerKg: Math.round(pricePerKg) },
      });
    }

    const varietyByName = Object.fromEntries(
      (
        await tx.durianVariety.findMany({
          select: { id: true, name: true, pricePerKg: true },
        })
      ).map((v) => [v.name.toLowerCase(), v]),
    );

    // Old backup customer id → Prisma-generated id
    const customerIdMap = new Map<string, string>();

    for (const customer of customers) {
      const created = await tx.customer.create({
        data: { name: customer.name },
      });
      customerIdMap.set(customer.id, created.id);
    }

    for (const t of transactions) {
      const customerId = customerIdMap.get(t.customerId);
      if (!customerId) continue;

      const variety = varietyByName[t.jenis.toLowerCase()];
      if (!variety) {
        throw new Error(`Unknown variety in backup: ${t.jenis}`);
      }

      await tx.transaction.create({
        data: {
          customerId,
          varietyId: variety.id,
          varietyName: variety.name,
          weightKg: Number(t.berat) || 0,
          quantity: Math.round(Number(t.jumlah) || 0),
          pricePerKg: variety.pricePerKg,
          subtotal: Math.round(Number(t.subtotal) || 0),
          status:
            t.status.toLowerCase() === "batal"
              ? TransactionStatus.BATAL
              : TransactionStatus.AKTIF,
          soldAt: new Date(t.tanggal),
        },
      });
    }
  });

  console.log(
    `Seeded ${Object.keys(backup.prices).length} varieties, ${customers.length} customers, ${transactions.length} transactions.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
