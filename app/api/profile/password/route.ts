import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { error, json, requireSession } from "@/lib/api";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const { response } = await requireSession();
  if (response) return response;

  const body = (await request.json().catch(() => null)) as {
    currentPassword?: string;
    newPassword?: string;
  } | null;

  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword =
    typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword) {
    return error("Masukkan kata sandi saat ini.");
  }
  if (!newPassword || newPassword.length < 8) {
    return error("Kata sandi baru minimal 8 karakter.");
  }
  if (currentPassword === newPassword) {
    return error("Kata sandi baru harus berbeda dari kata sandi saat ini.");
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });
    return json({ ok: true });
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
        /invalid password/i.test(raw)
          ? "Kata sandi saat ini salah."
          : raw || "Gagal mengubah kata sandi.",
        typeof e.statusCode === "number" ? e.statusCode : 400,
      );
    }
    console.error(e);
    return error("Gagal mengubah kata sandi.", 500);
  }
}
