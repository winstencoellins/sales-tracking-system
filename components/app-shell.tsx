"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileBarChart,
  History,
  Home,
  LogOut,
  Sprout,
  UserCog,
  Users,
} from "lucide-react";
import { IconButton, cx } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { firstName, timeOfDayGreeting } from "@/lib/format";
import { isSuperAdmin } from "@/lib/permissions";

const BASE_NAV = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/varieties", label: "Jenis", icon: Sprout },
  { href: "/customers", label: "Pelanggan", icon: Users },
  { href: "/history", label: "Riwayat", icon: History },
  { href: "/reports", label: "Laporan", icon: FileBarChart },
] as const;

const SUPERADMIN_NAV = {
  href: "/users",
  label: "Pengguna",
  icon: UserCog,
} as const;

export function AppShell({
  children,
}: {
  children: React.ReactNode;
  /** @deprecated Header is now a shared greeting; kept for call-site compatibility. */
  title?: string;
  /** @deprecated Header is now a shared greeting; kept for call-site compatibility. */
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const role =
    session?.user && "role" in session.user
      ? (session.user.role as string | undefined)
      : undefined;
  const showUsersNav = isSuperAdmin(role);
  const name = firstName(session?.user?.name);
  const greeting = timeOfDayGreeting();
  const initial = name.charAt(0).toUpperCase();

  const nav = showUsersNav ? [...BASE_NAV, SUPERADMIN_NAV] : [...BASE_NAV];
  const colCount = nav.length;

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[430px] pb-[calc(88px+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-transparent bg-[rgba(247,246,240,0.88)] px-4 py-3 pt-[calc(12px+env(safe-area-inset-top))] backdrop-blur-[16px] max-[380px]:px-3.5">
        <Link
          href="/profile"
          className="flex min-w-0 items-center gap-3 rounded-pill focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          aria-label="Buka profil"
        >
          <div
            className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-lime text-[1.05rem] font-extrabold tracking-[-0.03em] text-ink shadow-soft"
            aria-hidden
          >
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0">
            <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[1.05rem] font-bold leading-tight tracking-[-0.02em] text-ink">
              Hey {name},
            </p>
            <p className="m-0 mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[0.92rem] leading-tight text-muted-foreground">
              {greeting}
            </p>
          </div>
        </Link>

        <IconButton
          onClick={handleSignOut}
          aria-label="Keluar"
          title="Keluar"
          className="size-11 shrink-0 rounded-full border border-[rgba(232,230,222,0.9)] bg-[rgba(255,255,255,0.72)] shadow-soft"
        >
          <LogOut strokeWidth={2} />
        </IconButton>
      </header>
      <main className="box-border w-full px-4 pb-7 pt-1 max-[380px]:px-3.5">
        {children}
      </main>
      <nav
        className={cx(
          "fixed bottom-[calc(10px+env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[min(calc(100%-24px),398px)] -translate-x-1/2 rounded-pill border border-[rgba(232,230,222,0.8)] bg-[rgba(255,255,255,0.94)] p-1 shadow-[0_12px_40px_rgba(26,26,26,0.1)] backdrop-blur-[20px] max-[380px]:w-[calc(100%-16px)]",
          colCount === 6 ? "grid-cols-6" : "grid-cols-5",
        )}
        aria-label="Navigasi utama"
      >
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "flex min-h-[54px] flex-col items-center justify-center gap-0.5 rounded-pill px-0.5 py-1.5 text-center text-[0.72rem] font-semibold leading-[1.15] tracking-[0.01em] transition-[background,color] duration-[180ms] ease-out focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 max-[380px]:text-[0.68rem] [&_svg]:size-[22px] max-[380px]:[&_svg]:size-5",
                colCount === 6 && "text-[0.62rem] max-[380px]:text-[0.58rem]",
                active ? "bg-lime text-ink" : "text-muted-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon strokeWidth={active ? 2.5 : 2} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
