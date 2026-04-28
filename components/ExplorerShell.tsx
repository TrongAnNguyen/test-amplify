"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ExplorerShellProps {
  pageTitle: string;
  pageSubtitle: string;
  controls?: ReactNode;
  sidebar: ReactNode;
  breadcrumb?: ReactNode;
  children: ReactNode;
}

const menuItems = [
  { href: "/", label: "Contact Explorer" },
  { href: "/budget-explorer", label: "Budget Explorer" },
];

export default function ExplorerShell({
  pageTitle,
  pageSubtitle,
  controls,
  sidebar,
  breadcrumb,
  children,
}: ExplorerShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-300 selection:bg-blue-500/20">
      <aside className="hidden w-72 shrink-0 border-r border-white/5 bg-slate-950/85 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="border-b border-white/5 px-6 py-5">
          <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500">
            Omnicom Oceania
          </div>
          <h1 className="mt-3 text-lg font-semibold text-white">{pageTitle}</h1>
          <p className="mt-1 text-sm leading-6 text-slate-400">{pageSubtitle}</p>
        </div>

        <div className="border-b border-white/5 px-4 py-5">
          <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500">
            Menu
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all ${
                    isActive
                      ? "border-white/10 bg-white/[0.06] text-white shadow-[0_0_24px_rgba(15,23,42,0.24)]"
                      : "border-white/5 bg-white/[0.03] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-slate-200"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-white" : "bg-slate-700"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-slate-950/80 px-5 backdrop-blur-xl md:px-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-slate-500 lg:hidden">
              Omnicom Oceania
            </div>
            <div className="text-sm font-semibold text-white md:text-base">{pageTitle}</div>
          </div>
          <div className="relative z-50 flex items-center gap-3">{controls}</div>
        </header>

        {breadcrumb ? (
          <div className="relative z-20 shrink-0 border-b border-white/5 bg-slate-900/70 px-5 py-3 md:px-6">
            {breadcrumb}
          </div>
        ) : null}

        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
