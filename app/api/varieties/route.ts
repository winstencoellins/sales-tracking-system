import { error, json, requireSession } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { response } = await requireSession();
  if (response) return response;

  const varieties = await prisma.durianVariety.findMany({
    orderBy: { name: "asc" },
  });

  return json(varieties);
}

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const pricePerKg = Number(body?.pricePerKg);

  if (!name) return error("Nama jenis durian wajib diisi.");
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
    return error("Harga per kg tidak valid.");
  }

  const existing = await prisma.durianVariety.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return error(`Jenis "${name}" sudah ada di daftar harga.`);
  }

  const variety = await prisma.durianVariety.create({
    data: {
      name,
      pricePerKg: Math.round(pricePerKg),
    },
  });

  return json(variety, { status: 201 });
}
