'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, List, Settings, CreditCard, Wallet, Sun, Moon } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const navigation = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/mei', label: 'Panel MEI', icon: FileText },
    { href: '/incomes', label: 'Ingresos', icon: Wallet },
    { href: '/transactions', label: 'Gastos Mensuales', icon: List },
    { href: '/cards', label: 'Mis Tarjetas', icon: CreditCard },
    { href: '/settings', label: 'Configuración', icon: Settings },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        {/* Sidebar Placeholder to avoid layout shift */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col" />
        <main className="flex-1 flex flex-col overflow-hidden h-full">
          <div className="flex-1 overflow-y-auto p-8">{children}</div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Finanzas
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                  ${isActive
                    ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white font-medium'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" />
                <span className="font-medium">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span className="font-medium">Modo Oscuro</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </>
  );
}
