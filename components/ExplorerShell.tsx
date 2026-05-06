'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { fetchAuthSession, signOut } from 'aws-amplify/auth'
import { getUserGroups } from '@/utils/roles'

interface ExplorerShellProps {
  pageTitle: string
  pageSubtitle: string
  controls?: ReactNode
  sidebar: ReactNode
  breadcrumb?: ReactNode
  children: ReactNode
}

type ThemeMode = 'light' | 'dark'

const getSystemTheme = (): ThemeMode =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'

export default function ExplorerShell({
  pageTitle,
  pageSubtitle,
  controls,
  sidebar,
  breadcrumb,
  children,
}: ExplorerShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>('light')
  const [groups, setGroups] = useState<string[]>([])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const savedTheme = window.localStorage.getItem('theme') as ThemeMode | null
    const initialTheme = savedTheme ?? getSystemTheme()
    setTheme(initialTheme)

    // Fetch user groups for RBAC
    fetchAuthSession()
      .then((session) => {
        setGroups(getUserGroups(session))
      })
      .catch(() => setGroups([]))
  }, [])

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem('theme', nextTheme)
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const menuItems = [
    {
      href: '/',
      label: 'Contact Explorer',
      roles: ['admin', 'executive', 'user'],
    },
    {
      href: '/budget-explorer',
      label: 'Budget Explorer',
      roles: ['admin', 'executive'],
    },
  ].filter((item) => {
    if (!mounted) return false
    // If no groups yet, show nothing or just the basic user features
    if (groups.length === 0) return item.roles.includes('user')
    return item.roles.some((role) => groups.includes(role))
  })

  return (
    <div className="bg-background text-foreground flex h-screen w-full overflow-hidden">
      <aside className="border-border hidden w-72 shrink-0 border-r bg-(--card)/90 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="border-border border-b px-6 py-5">
          <div className="text-muted-foreground text-[10px] tracking-[0.35em] uppercase">
            Omnicom Oceania
          </div>
          <h1 className="text-foreground mt-3 text-lg font-semibold">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1 text-sm leading-6">{pageSubtitle}</p>
        </div>

        <div className="border-border border-b px-4 py-5">
          <div className="text-muted-foreground mb-3 px-2 text-[10px] font-semibold tracking-[0.35em] uppercase">
            Menu
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive =
                item.href === '/' ? pathname === item.href : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all ${
                    isActive
                      ? 'border-input bg-muted text-foreground shadow-[0_0_24px_rgba(15,23,42,0.12)]'
                      : 'border-border bg-card text-muted-foreground hover:border-input hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-primary' : 'bg-input'}`}
                  />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border relative z-50 flex h-16 shrink-0 items-center justify-between border-b bg-(--card)/90 px-5 backdrop-blur-xl md:px-6">
          <div>
            <div className="text-muted-foreground text-[10px] tracking-[0.35em] uppercase lg:hidden">
              Omnicom Oceania
            </div>
            <div className="text-foreground text-sm font-semibold md:text-base">{pageTitle}</div>
          </div>
          <div className="relative z-50 flex items-center gap-3">
            {controls}
            <button
              type="button"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={theme === 'dark'}
              onClick={toggleTheme}
              className="border-input bg-muted text-foreground hover:border-primary hover:text-primary focus-visible:ring-ring inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 transition focus-visible:ring-2 focus-visible:outline-none"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="border-input bg-muted text-foreground hover:border-destructive hover:text-destructive focus-visible:ring-ring inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 transition focus-visible:ring-2 focus-visible:outline-none"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {breadcrumb ? (
          <div className="border-border bg-muted relative z-20 shrink-0 border-b px-5 py-3 md:px-6">
            {breadcrumb}
          </div>
        ) : null}

        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
