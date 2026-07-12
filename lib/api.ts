import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { session: null, response: error("Anda harus masuk terlebih dahulu.", 401) };
  }

  return { session, response: null };
}

export async function requireSuperAdmin() {
  const result = await requireSession();
  if (result.response) return result;

  const role =
    "role" in result.session.user
      ? (result.session.user.role as string | null | undefined)
      : undefined;

  if (!isSuperAdmin(role)) {
    return {
      session: result.session,
      response: error("Akses ditolak. Hanya superadmin yang dapat melakukan ini.", 403),
    };
  }

  return result;
}
