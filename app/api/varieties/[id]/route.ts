import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const data: { name?: string; pricePerKg?: number } = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim();
    if (!name) return error("Nama jenis durian wajib diisi.");
    const existing = await prisma.durianVariety.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        NOT: { id },
      },
    });
    if (existing) return error(`Jenis "${name}" sudah ada.`);
    data.name = name;
  }

  if (body?.pricePerKg !== undefined) {
    const pricePerKg = Number(body.pricePerKg);
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      return error("Harga per kg tidak valid.");
    }
    data.pricePerKg = Math.round(pricePerKg);
  }

  if (Object.keys(data).length === 0) {
    return error("Tidak ada data yang diubah.");
  }

  try {
    const variety = await prisma.durianVariety.update({
      where: { id },
      data,
    });
    return json(variety);
  } catch {
    return error("Jenis durian tidak ditemukan.", 404);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response } = await requireSession();
  if (response) return response;

  const { id } = await params;

  const used = await prisma.transaction.count({ where: { varietyId: id } });
  if (used > 0) {
    return error(
      `Jenis ini tidak bisa dihapus karena masih dipakai di ${used} transaksi.`,
    );
  }

  try {
    await prisma.durianVariety.delete({ where: { id } });
    return json({ ok: true });
  } catch {
    return error("Jenis durian tidak ditemukan.", 404);
  }
}
