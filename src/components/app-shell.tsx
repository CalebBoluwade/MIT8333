"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenText,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Users,
  Wrench,
  Hammer,
  X,
} from "lucide-react";
import { NotificationBell } from "@/components/notification-bell";
import { post } from "@/lib/client";
import type { SessionUser } from "@/lib/jwt";
import { cn } from "@/lib/utils";

const studentStaffNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/requests/new", label: "New request", icon: PlusCircle },
  { href: "/requests", label: "My requests", icon: ClipboardList },
];

const NAV: Record<SessionUser["role"], typeof studentStaffNav> = {
  student: studentStaffNav,
  staff: studentStaffNav,
  officer: [
    { href: "/officer", label: "My jobs", icon: Hammer },
    { href: "/api-docs", label: "API docs", icon: BookOpenText },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/requests", label: "Requests", icon: ClipboardList },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/audit", label: "Activity log", icon: History },
    { href: "/api-docs", label: "API docs", icon: BookOpenText },
  ],
};

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  student: "Student",
  staff: "Staff",
  officer: "Maintenance Officer",
  admin: "Administrator",
};

function Initials({ name }: Readonly<{ name: string }>) {
  const letters = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span
      style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-indigo-500/20"
    >
      {letters}
    </span>
  );
}

function NavItems({
  items,
  isActive,
  onClick,
}: Readonly<{
  items: typeof studentStaffNav;
  isActive: (href: string) => boolean;
  onClick?: () => void;
}>) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onClick}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-indigo-500/15 text-white"
                  : "text-white/45 hover:bg-white/5 hover:text-white/80",
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  active
                    ? "text-indigo-400"
                    : "text-white/30 group-hover:text-white/50",
                )}
                aria-hidden
              />
              {label}
              {active && (
                <span
                  className="ml-auto size-1.5 rounded-full bg-indigo-400"
                  aria-hidden
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({
  user,
  children,
}: Readonly<{ user: SessionUser; children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user.role;
  const items = NAV[role];
  const rootHrefs = ["/dashboard", "/officer", "/admin"];

  async function signOut() {
    await post("/api/auth/logout");
    router.replace("/login");
    router.refresh();
  }

  const isActive = (href: string) =>
    rootHrefs.includes(href)
      ? pathname === href
      : pathname === href ||
        (pathname.startsWith(href + "/") &&
          !items.some(
            (i: { href: string }) =>
              i.href !== href &&
              i.href.startsWith(href + "/") &&
              pathname.startsWith(i.href),
          ));

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setMobileOpen(false)}
        >
          <span
            style={{
              background: "#4f46e5",
              boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
            }}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          >
            <Wrench className="size-4 text-white" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-white">UniFix</span>
        </Link>
      </div>

      <p
        className="px-5 pb-2 text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        Menu
      </p>

      <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
        <NavItems
          items={items}
          isActive={isActive}
          onClick={() => setMobileOpen(false)}
        />
      </nav>
    </>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* ── Desktop Sidebar ── */}
      <aside
        style={{ backgroundColor: "#0f1117" }}
        className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-white/5"
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ── Mobile drawer ── */}
      <aside
        style={{ backgroundColor: "#0f1117" }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-250 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-4 rounded-md p-1.5 text-white/40 hover:text-white/70"
        >
          <X className="size-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* ── Main ── */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          {/* Mobile brand */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span
              style={{ background: "#4f46e5" }}
              className="flex size-7 items-center justify-center rounded-md"
            >
              <Wrench className="size-3.5 text-white" aria-hidden />
            </span>
            <span className="text-sm font-semibold">UniFix</span>
          </Link>
          <div className="flex items-center gap-2 lg:ml-auto">
            <NotificationBell />

            {/* User footer */}
            <div>
              <div className="flex items-center gap-3">
                <Initials name={user.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="text-xs">{ROLE_LABEL[role]}</p>
                </div>
                <button
                  onClick={signOut}
                  aria-label="Sign out"
                  className="rounded-md p-1.5 transition-colors"
                >
                  <LogOut className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-7 lg:p-8 page-enter">{children}</main>
      </div>
    </div>
  );
}
