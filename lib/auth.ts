import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";
import { ac, admin as adminRole, superadmin } from "@/lib/permissions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        superadmin,
      },
      defaultRole: "admin",
      adminRoles: ["superadmin"],
    }),
    nextCookies(),
  ],
});
