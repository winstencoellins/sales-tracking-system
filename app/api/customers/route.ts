import { Prisma, TransactionStatus } from "@/generated/prisma/client";
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

function parsePhoneNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phoneNumber: { contains: q, mode: "insensitive" } },
          ],
        }
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
  const phoneNumber = parsePhoneNumber(body?.phoneNumber);

  if (!name) return error("Nama pelanggan wajib diisi.");

  try {
    const customer = await prisma.customer.create({
      data: { name, phoneNumber },
      include: spendInclude,
    });
    return json(withSpendStats(customer), { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error(
        "Pelanggan dengan nama dan nomor telepon yang sama sudah ada.",
      );
    }
    throw err;
  }
}
