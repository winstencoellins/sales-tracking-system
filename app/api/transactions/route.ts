import type { Prisma } from "@/generated/prisma/client";
import { TransactionStatus } from "@/generated/prisma/client";
import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId") || undefined;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const minSubtotal = searchParams.get("minSubtotal");
  const maxSubtotal = searchParams.get("maxSubtotal");
  const sort = searchParams.get("sort") || "tanggal-desc";

  const where: Prisma.TransactionWhereInput = {};

  if (customerId) where.customerId = customerId;

  if (status === "AKTIF" || status === "BATAL") {
    where.status = status;
  }

  if (from || to) {
    where.soldAt = {};
    if (from) where.soldAt.gte = new Date(from);
    if (to) where.soldAt.lte = new Date(to);
  }

  if (minSubtotal || maxSubtotal) {
    where.subtotal = {};
    if (minSubtotal && !Number.isNaN(Number(minSubtotal))) {
      where.subtotal.gte = Math.round(Number(minSubtotal));
    }
    if (maxSubtotal && !Number.isNaN(Number(maxSubtotal))) {
      where.subtotal.lte = Math.round(Number(maxSubtotal));
    }
  }

  let orderBy: Prisma.TransactionOrderByWithRelationInput = {
    soldAt: "desc",
  };
  if (sort === "tanggal-asc") orderBy = { soldAt: "asc" };
  if (sort === "tanggal-desc") orderBy = { soldAt: "desc" };
  if (sort === "subtotal-asc") orderBy = { subtotal: "asc" };
  if (sort === "subtotal-desc") orderBy = { subtotal: "desc" };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy,
    include: {
      customer: { select: { id: true, name: true } },
      variety: { select: { id: true, name: true, pricePerKg: true } },
    },
  });

  return json(transactions);
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const customerId =
    typeof body?.customerId === "string" ? body.customerId : "";
  const varietyId = typeof body?.varietyId === "string" ? body.varietyId : "";
  const weightKg = Number(body?.weightKg);
  const quantity = Number(body?.quantity);

  if (!customerId) return error("Pilih pelanggan terlebih dahulu.");
  if (!varietyId) return error("Pilih jenis durian terlebih dahulu.");
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    return error("Berat harus lebih dari 0 kg.");
  }
  if (!Number.isFinite(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    return error("Jumlah buah tidak valid.");
  }

  const [customer, variety] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.durianVariety.findUnique({ where: { id: varietyId } }),
  ]);

  if (!customer) return error("Pelanggan tidak ditemukan.", 404);
  if (!variety) return error("Jenis durian tidak ditemukan.", 404);

  const subtotal = Math.round(weightKg * variety.pricePerKg);

  const transaction = await prisma.transaction.create({
    data: {
      customerId,
      varietyId,
      varietyName: variety.name,
      weightKg,
      quantity,
      pricePerKg: variety.pricePerKg,
      subtotal,
      status: TransactionStatus.AKTIF,
      soldAt: new Date(),
    },
    include: {
      customer: { select: { id: true, name: true } },
      variety: { select: { id: true, name: true, pricePerKg: true } },
    },
  });

  return json(transaction, { status: 201 });
}
