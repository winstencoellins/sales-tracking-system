import { Prisma, TransactionStatus } from "@/generated/prisma/client";
import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const spendInclude = {
  _count: { select: { transactions: true } },
  transactions: {
    where: { status: TransactionStatus.AKTIF },
    select: { subtotal: true },
  },
} as const;

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

function parsePhoneNumber(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function GET(_request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: spendInclude,
  });

  if (!customer) return error("Pelanggan tidak ditemukan.", 404);
  return json(withSpendStats(customer));
}

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phoneNumber = parsePhoneNumber(body?.phoneNumber);

  if (!name) return error("Nama pelanggan wajib diisi.");

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phoneNumber },
      include: spendInclude,
    });
    return json(withSpendStats(customer));
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return error(
        "Pelanggan dengan nama dan nomor telepon yang sama sudah ada.",
      );
    }
    return error("Pelanggan tidak ditemukan.", 404);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;

  const used = await prisma.transaction.count({ where: { customerId: id } });
  if (used > 0) {
    return error(
      `Pelanggan ini tidak bisa dihapus karena masih punya ${used} transaksi.`,
    );
  }

  try {
    await prisma.customer.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return error("Pelanggan tidak ditemukan.", 404);
  }
}
