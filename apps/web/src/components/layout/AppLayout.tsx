'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { Home, FileText, List, Settings, CreditCard, Wallet, Sun, Moon } from 'lucide-react';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

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
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>
          <Link
            href="/mei"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Panel MEI</span>
          </Link>
          <Link
            href="/incomes"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Ingresos</span>
          </Link>
          <Link
            href="/transactions"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Gastos Mensuales</span>
          </Link>
          <Link
            href="/cards"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Mis Tarjetas</span>
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Configuración</span>
          </Link>
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
