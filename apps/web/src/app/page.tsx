'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Wallet, 
  CreditCard as CardIcon, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ExpenseFormModal } from '@/components/transactions/ExpenseFormModal';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardSummary {
  cashFlow: { income: number; expense: number; available: number };
  accounts: { name: string; bankName: string; balance: number }[];
  creditCards: { name: string; total: number; status: 'PENDING' | 'PAID'; dueDate: string }[];
  meiStatus: { total: number; limit: number; percentage: number };
  categories: { name: string; total: number }[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const now = new Date();
  const monthName = format(now, 'MMMM yyyy', { locale: es });

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/dashboard/summary?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando tu panel de control...</p>
      </div>
    );
  }

  if (!data) return null;

  const { cashFlow, accounts, creditCards, meiStatus, categories } = data;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Hola, Pablo y Rocío</h2>
          <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Resumen de {monthName}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-white text-zinc-950 hover:bg-zinc-200 transition-colors h-11 px-6 shadow-sm">
          <Plus className="mr-2 h-5 w-5" />
          Nuevo Gasto
        </Button>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-max">
        
        {/* WIDGET 1: HERO - Cash Flow (Zero-Based Budgeting) */}
        <Card className="md:col-span-8 overflow-hidden bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <CardHeader className="pb-2 p-0">
            <div className="flex items-center gap-2 opacity-80">
              <TrendingUp className="h-4 w-4" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Flujo de Caja Mensual</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
              <div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium mb-1">Disponible para Asignar</p>
                <h1 className="text-6xl font-extrabold tracking-tighter tabular-nums text-zinc-900 dark:text-zinc-50">
                  ${cashFlow.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h1>
                <div className="flex gap-4 mt-6">
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700/50">
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase mb-1">Ingresos</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">+${cashFlow.income.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700/50">
                    <p className="text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase mb-1">Gastos</p>
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">-${cashFlow.expense.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block h-32 opacity-20 pointer-events-none transform translate-y-4">
                 <div className="w-full h-full border-b border-r border-current rounded-br-3xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WIDGET 4: MEI THERMOMETER */}
        <Card className="md:col-span-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col justify-between">
          <CardHeader className="pb-3 p-0">
            <CardTitle className="text-lg flex items-center justify-between text-zinc-900 dark:text-zinc-50">
              Termómetro MEI
              <span className="text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-full">{now.getFullYear()}</span>
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">Facturado acumulado (Límite R$ 81k)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-0 p-0">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">R$ {meiStatus.total.toLocaleString()}</span>
              <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400">{meiStatus.percentage}%</span>
            </div>
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
               <div 
                 className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-1000 ease-out"
                 style={{ width: `${Math.min(meiStatus.percentage, 100)}%` }}
               />
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase text-center tracking-widest">
              Cupo Disponible: R$ {(meiStatus.limit - meiStatus.total).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* WIDGET 2: ACCOUNTS LIST */}
        <Card className="md:col-span-12 lg:col-span-5 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <CardHeader className="pb-4 p-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Tus Cuentas</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors p-0 h-auto">
                Ver todas <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {accounts.map((acc, i) => (
                <div key={i} className="flex items-center justify-between py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <div>
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{acc.name}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{acc.bankName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-zinc-900 dark:text-zinc-50 tabular-nums">
                      ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* WIDGET 3: CREDIT CARD ALERTS */}
        <Card className="md:col-span-6 lg:col-span-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <CardHeader className="pb-2 p-0">
            <div className="flex items-center gap-2">
              <CardIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Tarjetas de Crédito</CardTitle>
            </div>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">{monthName}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            <div className="space-y-4">
              {creditCards.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 italic text-center py-4">No hay tarjetas registradas.</p>
              ) : (
                creditCards.map((card, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        card.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {card.status === 'PAID' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className={cn("text-xs font-bold", card.status === 'PAID' ? "text-zinc-500 dark:text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-200")}>
                          {card.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">Vence: {format(new Date(card.dueDate), 'dd MMM', { locale: es })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-black italic", card.status === 'PAID' ? "text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-white")}>
                        ${card.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* WIDGET 5: CATEGORY DOUGHNUT */}
        <Card className="md:col-span-6 lg:col-span-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <CardHeader className="pb-0 p-0">
            <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Gastos por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="h-[200px] w-full relative mt-4">
               {categories.length > 0 ? (
                 <>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={categories}
                         cx="50%"
                         cy="50%"
                         innerRadius={55}
                         outerRadius={80}
                         paddingAngle={4}
                         dataKey="total"
                       >
                         {categories.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                         ))}
                       </Pie>
                       <RechartsTooltip 
                         contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', borderRadius: '8px' }}
                         itemStyle={{ color: 'var(--tooltip-text)' }}
                         formatter={(value: any) => [`$${value.toLocaleString()}`, 'Total']}
                       />
                     </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-center">Asignado</p>
                   </div>
                 </>
               ) : (
                 <div className="h-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 italic text-sm">
                   Sin datos este mes.
                 </div>
               )}
             </div>
             {/* Simple Legend */}
             <div className="mt-4 grid grid-cols-2 gap-2">
                {categories.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-1.5 overflow-hidden">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{c.name}</span>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>

      </div>

      <ExpenseFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchSummary()}
      />
    </div>
  );
}
