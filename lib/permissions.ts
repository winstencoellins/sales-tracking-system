import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/** Regular admin: app access only, no user management. */
export const admin = ac.newRole({
  user: [],
  session: [],
});

/** Superadmin: can manage users (create admins, list, etc.). */
export const superadmin = ac.newRole({
  ...adminAc.statements,
});

export type AppRole = "admin" | "superadmin";

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "superadmin";
}
