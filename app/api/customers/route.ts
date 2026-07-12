import { TransactionStatus } from "@/generated/prisma/client";
import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

function withSpendStats<
  T extends {
    transactions: { subtotal: number }[];
  },
>(customer: T) {
  const { transactions, ...rest } = customer;
  return {
    ...rest,
    totalSpent: transactions.reduce((sum, t) => sum + t.subtotal, 0),
  };
}

const spendInclude = {
  _count: { select: { transactions: true } },
  transactions: {
    where: { status: TransactionStatus.AKTIF },
    select: { subtotal: true },
  },
} as const;

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    orderBy: { name: "asc" },
    include: spendInclude,
  });

  return json(customers.map(withSpendStats));
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) return error("Nama pelanggan wajib diisi.");

  const customer = await prisma.customer.create({
    data: { name },
    include: spendInclude,
  });

  return json(withSpendStats(customer), { status: 201 });
}
