'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Plus, Loader2, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { IncomeFormModal } from '@/components/transactions/IncomeFormModal';
import { apiFetch } from '@/lib/api';

// Define the expected Transaction type based on our backend
interface Transaction {
  id: number;
  amount: string | number;
  description: string;
  date?: string;
  createdAt: string;
  accountId: number;
  account?: {
    name: string;
    user?: {
      name: string;
    }
  };
  category?: {
    name: string;
    icon?: string;
  };
  isMeiInvoice: boolean;
}

export default function IncomesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Transaction | null>(null);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este ingreso?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchTransactions();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el ingreso.');
      setIsLoading(false); // only toggle off if error, else fetchTransactions handles it
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const dateFrom = new Date(year, month, 1);
    const dateTo = new Date(year, month + 1, 0, 23, 59, 59, 999);

    try {
      // Fetch specifically INCOME transactions and Mei Invoices if applicable for this period
      const response = await apiFetch(`/transactions?type=INCOME&dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setTransactions(data);
    } catch (err: any) {
      console.error('Failed to fetch incomes:', err);
      setError('Failed to load incomes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentDate]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const formattedMonth = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
  const displayMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

  // Calculate totals
  const totalIncomes = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Ingresos</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">Registra y administra las entradas de dinero.</p>
        </div>

        <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ChevronLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
          <div className="px-4 text-sm font-semibold text-zinc-700 dark:text-zinc-200 w-40 text-center">
            {displayMonth}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6 overflow-hidden">
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Total Ingresos</CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 tabular-nums">
              ${totalIncomes.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors h-11 px-6 shadow-sm" onClick={() => {
          setSelectedIncome(null);
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Ingreso
        </Button>
      </div>

      <IncomeFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIncome(null);
        }} 
        onSuccess={fetchTransactions}
        initialData={selectedIncome} 
      />

      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Hoja de Ingresos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="w-[150px] text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Fecha</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Descripción</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Categoría</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Dueño (Cuenta)</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">MEI</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Monto</TableHead>
                <TableHead className="w-[100px] text-center text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      Cargando ingresos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <AlertCircle className="h-6 w-6 mb-2" />
                      {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No hay ingresos registrados para {formattedMonth}.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const txDate = tx.date || tx.createdAt;
                  
                  return (
                    <TableRow key={tx.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                      <TableCell className="text-zinc-500 dark:text-zinc-400">
                        {txDate ? new Date(txDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900 dark:text-zinc-200">{tx.description}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          {tx.category?.icon && <span>{tx.category.icon}</span>}
                          <span>{tx.category?.name || 'Varios'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50">
                          {tx.account?.name || `Cuenta #${tx.accountId}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {tx.isMeiInvoice ? (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950">
                             Auditable
                           </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-300 transition-colors">
                        +${Number(tx.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
                            onClick={() => {
                              setSelectedIncome(tx);
                              setIsModalOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500"
                            onClick={() => handleDelete(tx.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
