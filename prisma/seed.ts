import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { TransactionStatus } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

const TEST_CUSTOMER_NAMES = new Set(["A", "B", "C", "D"]);

const SUPERADMIN = {
  name: "Winsten",
  email: "winstencoellins13@gmail.com",
  password: "Complexpassword123!",
  role: "superadmin",
} as const;

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
    "templates/backup-kalkulator-durian-2026-07-13.json",
  );
  return JSON.parse(readFileSync(path, "utf8")) as BackupFile;
}

async function seedSuperAdmin() {
  const email = SUPERADMIN.email.toLowerCase();
  const passwordHash = await hashPassword(SUPERADMIN.password);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: SUPERADMIN.name,
        role: SUPERADMIN.role,
      },
    });

    const credential = await prisma.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });

    if (credential) {
      await prisma.account.update({
        where: { id: credential.id },
        data: { password: passwordHash },
      });
    } else {
      await prisma.account.create({
        data: {
          id: randomUUID(),
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: passwordHash,
        },
      });
    }

    console.log(`Updated superadmin: ${email}`);
    return;
  }

  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      name: SUPERADMIN.name,
      email,
      emailVerified: false,
      role: SUPERADMIN.role,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: passwordHash,
        },
      },
    },
  });

  console.log(`Created superadmin: ${email}`);
}

async function seedSalesData() {
  const backup = loadBackup();

  const customers = backup.customers.filter(
    (c) => !TEST_CUSTOMER_NAMES.has(c.name),
  );
  const keptCustomerIds = new Set(customers.map((c) => c.id));
  const transactions = backup.transactions.filter((t) =>
    keptCustomerIds.has(t.customerId),
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.transaction.deleteMany();
      await tx.customer.deleteMany();
      await tx.durianVariety.deleteMany();

      await tx.durianVariety.createMany({
        data: Object.entries(backup.prices).map(([name, pricePerKg]) => ({
          name,
          pricePerKg: Math.round(pricePerKg),
        })),
      });

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

      const txRows = [];
      for (const t of transactions) {
        const customerId = customerIdMap.get(t.customerId);
        if (!customerId) continue;

        const variety = varietyByName[t.jenis.toLowerCase()];
        if (!variety) {
          throw new Error(`Unknown variety in backup: ${t.jenis}`);
        }

        txRows.push({
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
        });
      }

      if (txRows.length) {
        await tx.transaction.createMany({ data: txRows });
      }
    },
    { timeout: 60_000 },
  );

  console.log(
    `Seeded ${Object.keys(backup.prices).length} varieties, ${customers.length} customers, ${transactions.length} transactions.`,
  );
}

async function main() {
  await seedSalesData();
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
