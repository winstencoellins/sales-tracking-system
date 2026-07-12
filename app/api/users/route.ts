import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { error, json, requireSuperAdmin } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function GET() {
  const { response } = await requireSuperAdmin();
  if (response) return response;

  try {
    const result = await auth.api.listUsers({
      query: {
        limit: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      },
      headers: await headers(),
    });

    const users = (result.users ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? "admin",
      banned: user.banned ?? false,
      createdAt: user.createdAt,
    }));

    return json(users);
  } catch (e) {
    console.error(e);
    return error("Gagal memuat daftar pengguna.", 500);
  }
}

export async function POST(request: Request) {
  const { response } = await requireSuperAdmin();
  if (response) return response;

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    password?: string;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!name) return error("Isi nama pengguna.");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("Email tidak valid.");
  }
  if (!password || password.length < 8) {
    return error("Kata sandi minimal 8 karakter.");
  }

  try {
    const created = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: "admin",
      },
      headers: await headers(),
    });

    return json(
      {
        id: created.user.id,
        name: created.user.name,
        email: created.user.email,
        role: created.user.role ?? "admin",
        createdAt: created.user.createdAt,
      },
      { status: 201 },
    );
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
      const message = /exist/i.test(raw)
        ? "Email sudah terdaftar."
        : raw || "Gagal menambah pengguna.";
      return error(
        message,
        typeof e.statusCode === "number" ? e.statusCode : 400,
      );
    }
    console.error(e);
    return error("Gagal menambah pengguna.", 500);
  }
}
