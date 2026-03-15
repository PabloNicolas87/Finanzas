'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Plus, Loader2, AlertCircle, Pencil, Trash2, Lock } from 'lucide-react';
import { ExpenseFormModal } from '@/components/transactions/ExpenseFormModal';
import { apiFetch } from '@/lib/api';

// Define the expected Transaction type based on our backend
interface Transaction {
  id: string;
  amount: number;
  description: string;
  date?: string;       // ISO date string of the purchase (present on virtual rows)
  createdAt: string;  // ISO date string
  dueDate: string | null;
  status: 'PENDING' | 'PAID';
  installmentNumber: number | null;
  totalInstallments: number | null;
  creditCardId: number | null;
  statementId?: number; // Added for CreditCardStatement relation
}

export default function TransactionsPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // Marzo 2026 default
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await apiFetch(`/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      fetchTransactions();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el gasto.');
      setIsLoading(false);
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
      const response = await apiFetch(`/transactions?dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`);
      const data = await response.json();
      setTransactions(data);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentDate]);

  const toggleTransactionStatus = async (id: string, currentStatus: 'PENDING' | 'PAID', statementId?: number) => {
    const newStatus = currentStatus === 'PENDING' ? 'PAID' : 'PENDING';
    
    // Optimistic UI Update
    setTransactions((prev) => 
      prev.map((tx) => tx.id === id ? { ...tx, status: newStatus } : tx)
    );

    try {
      const isVirtualCard = id.toString().startsWith('virtual-card-');
      
      if (isVirtualCard) {
        // Defensive check for statements
        if (!statementId) {
          console.error("Falta el statementId en la transacción", id);
          throw new Error("No se encontró el ID del resumen para esta tarjeta.");
        }

        // Domain-Driven Design: update the persistent statement directly
        const url = `/credit-cards/statements/${statementId}/status`;
        const payload = { status: newStatus };

        console.log('🛠️ ENVIANDO PUT (Statement):', url, payload);

        await apiFetch(url, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // Regular transaction update
        const url = `/transactions/${id}/status`;
        const payload = { status: newStatus };

        console.log('🛠️ ENVIANDO PATCH (Transacción):', url, payload);

        await apiFetch(url, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      }

    } catch (err: any) {
      console.error('Failed to update transaction status:', err);
      // Revert on error (Optimistic UI Rollback)
      setTransactions((prev) => 
        prev.map((tx) => tx.id === id ? { ...tx, status: currentStatus } : tx)
      );
      alert(`No se pudo actualizar el estado: ${err.message || 'Error desconocido'}`);
    }
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
  const year = currentDate.getFullYear();
  const formattedMonth = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gastos Mensuales</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Flujo Zero-Based Budgeting.</p>
        </div>
        
        {/* Month Selector Component */}
        <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-1">
          <Button variant="ghost" size="icon" onClick={prevMonth} disabled={isLoading} className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ChevronLeft className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
          <div className="text-sm font-semibold min-w-[120px] text-center text-zinc-700 dark:text-zinc-200">
            {formattedMonth}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} disabled={isLoading} className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ChevronRight className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          </Button>
        </div>

        <Button className="bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors h-11 px-6 shadow-sm" onClick={() => {
          setSelectedExpense(null);
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <ExpenseFormModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExpense(null);
        }} 
        onSuccess={fetchTransactions}
        initialData={selectedExpense} 
      />

      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-zinc-100 dark:border-zinc-800/50">
          <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Hoja de Gastos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
              <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[150px] text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Monto</TableHead>
                <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Descripción</TableHead>
                <TableHead className="text-right text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Vencimiento</TableHead>
                <TableHead className="w-[100px] text-center text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mb-2" />
                      Cargando transacciones...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <AlertCircle className="h-6 w-6 mb-2" />
                      {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No hay transacciones registradas para {formattedMonth}.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const txDate = new Date(tx.createdAt);
                  const txMonth = txDate.toLocaleString('es-ES', { month: 'long' });
                  const formattedTxMonth = txMonth.charAt(0).toUpperCase() + txMonth.slice(1);
                  const isPaid = tx.status === 'PAID';
                  
                  // Check if overdue
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isOverdue = !isPaid && tx.dueDate && new Date(tx.dueDate) < today;

                  const rowStyles = isPaid ? 'opacity-40 grayscale-[0.5] text-zinc-500' : 'text-zinc-900 dark:text-zinc-100';
                  const overdueStyles = isOverdue ? 'text-red-600 dark:text-red-500 font-bold' : '';
                  
                  return (
                    <TableRow key={tx.id} className={`border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group ${rowStyles}`}>
                      <TableCell>
                        <Checkbox 
                          checked={isPaid}
                          onCheckedChange={() => toggleTransactionStatus(tx.id.toString(), tx.status, tx.statementId)}
                        />
                      </TableCell>
                      <TableCell className={`font-bold tabular-nums ${isPaid ? '' : 'text-zinc-900 dark:text-zinc-100'} ${overdueStyles}`}>
                        ${Number(tx.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-zinc-500 dark:text-zinc-400 font-medium">{tx.description}</TableCell>
                      <TableCell className={`text-right text-xs font-medium ${isPaid ? '' : 'text-zinc-500 dark:text-zinc-500'} ${overdueStyles}`}>
                        {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {tx.statementId || tx.id.toString().startsWith('virtual-card-') ? (
                            <span title="Resumen de tarjeta (Solo lectura)">
                              <Lock className="h-4 w-4 text-zinc-400 dark:text-zinc-600" />
                            </span>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
                                onClick={() => {
                                  setSelectedExpense(tx);
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
                            </>
                          )}
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
