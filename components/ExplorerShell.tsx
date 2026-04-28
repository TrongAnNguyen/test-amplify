"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

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

type ThemeMode = "light" | "dark";

const getSystemTheme = (): ThemeMode =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export default function ExplorerShell({
  pageTitle,
  pageSubtitle,
  controls,
  sidebar,
  breadcrumb,
  children,
}: ExplorerShellProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    setMounted(true);
    const savedTheme = window.localStorage.getItem("theme") as ThemeMode | null;
    const initialTheme = savedTheme ?? getSystemTheme();
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 border-r border-border bg-(--card)/90 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="border-b border-border px-6 py-5">
          <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            Omnicom Oceania
          </div>
          <h1 className="mt-3 text-lg font-semibold text-foreground">
            {pageTitle}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {pageSubtitle}
          </p>
        </div>

        <div className="border-b border-border px-4 py-5">
          <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Menu
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all ${
                    isActive
                      ? "border-input bg-muted text-foreground shadow-[0_0_24px_rgba(15,23,42,0.12)]"
                      : "border-border bg-card text-muted-foreground hover:border-input hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isActive ? "bg-primary" : "bg-input"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {sidebar}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-border bg-(--card)/90 px-5 backdrop-blur-xl md:px-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground lg:hidden">
              Omnicom Oceania
            </div>
            <div className="text-sm font-semibold text-foreground md:text-base">
              {pageTitle}
            </div>
          </div>
          <div className="relative z-50 flex items-center gap-3">
            {controls}
            <button
              type="button"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
              className="inline-flex cursor-pointer h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-input bg-muted px-3 text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {breadcrumb ? (
          <div className="relative z-20 shrink-0 border-b border-border bg-muted px-5 py-3 md:px-6">
            {breadcrumb}
          </div>
        ) : null}

        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
