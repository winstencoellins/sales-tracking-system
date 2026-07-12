import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { error, json, requireSession } from "@/lib/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, response } = await requireSession();
  if (response) return response;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return error("Pengguna tidak ditemukan.", 404);
  }

  return json(dbUser);
}

export async function PATCH(request: Request) {
  const { session, response } = await requireSession();
  if (response) return response;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
  } | null;

  if (!body || typeof body !== "object") {
    return error("Data tidak valid.");
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : undefined;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;

  if (name !== undefined && !name) {
    return error("Nama tidak boleh kosong.");
  }

  if (email !== undefined) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return error("Email tidak valid.");
    }

    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: session.user.id },
      },
      select: { id: true },
    });
    if (existing) {
      return error("Email sudah digunakan oleh akun lain.");
    }
  }

  if (name === undefined && email === undefined) {
    return error("Tidak ada perubahan.");
  }

  const reqHeaders = await headers();

  try {
    if (name !== undefined && name !== session.user.name) {
      await auth.api.updateUser({
        body: { name },
        headers: reqHeaders,
      });
    }

    if (email !== undefined && email !== session.user.email) {
      // Allow immediate email update without a mail provider.
      await prisma.user.update({
        where: { id: session.user.id },
        data: { emailVerified: false },
      });
      await auth.api.changeEmail({
        body: { newEmail: email },
        headers: reqHeaders,
      });
    }
  } catch (e) {
    if (e instanceof APIError) {
      const raw =
        (typeof e.body === "object" &&
        e.body &&
        "message" in e.body &&
        typeof e.body.message === "string"
          ? e.body.message
          : null) ||
        e.message ||
        "";
      return error(
        /exist/i.test(raw)
          ? "Email sudah digunakan oleh akun lain."
          : raw || "Gagal menyimpan profil.",
        typeof e.statusCode === "number" ? e.statusCode : 400,
      );
    }
    console.error(e);
    return error("Gagal menyimpan profil.", 500);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
  });

  return json(user);
}
