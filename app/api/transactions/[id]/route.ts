import { TransactionStatus } from "@/generated/prisma/client";
import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const hasEditFields =
    typeof body?.customerId === "string" ||
    typeof body?.varietyId === "string" ||
    body?.weightKg != null ||
    body?.quantity != null;

  if (hasEditFields) {
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
    if (
      !Number.isFinite(quantity) ||
      quantity < 0 ||
      !Number.isInteger(quantity)
    ) {
      return error("Jumlah buah tidak valid.");
    }

    const [customer, variety] = await Promise.all([
      prisma.customer.findUnique({ where: { id: customerId } }),
      prisma.durianVariety.findUnique({ where: { id: varietyId } }),
    ]);

    if (!customer) return error("Pelanggan tidak ditemukan.", 404);
    if (!variety) return error("Jenis durian tidak ditemukan.", 404);

    const subtotal = Math.round(weightKg * variety.pricePerKg);

    try {
      const transaction = await prisma.transaction.update({
        where: { id },
        data: {
          customerId,
          varietyId,
          varietyName: variety.name,
          weightKg,
          quantity,
          pricePerKg: variety.pricePerKg,
          subtotal,
        },
        include: {
          customer: { select: { id: true, name: true } },
          variety: { select: { id: true, name: true, pricePerKg: true } },
        },
      });
      return json(transaction);
    } catch {
      return error("Transaksi tidak ditemukan.", 404);
    }
  }

  const status = body?.status;
  if (status !== "AKTIF" && status !== "BATAL") {
    return error("Status harus AKTIF atau BATAL.");
  }

  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status: status as TransactionStatus },
      include: {
        customer: { select: { id: true, name: true } },
        variety: { select: { id: true, name: true, pricePerKg: true } },
      },
    });
    return json(transaction);
  } catch {
    return error("Transaksi tidak ditemukan.", 404);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.transaction.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return error("Transaksi tidak ditemukan.", 404);
  }
}
