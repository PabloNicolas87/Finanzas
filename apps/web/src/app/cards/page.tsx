'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Transaction } from '@finanzas/shared-types';
import { apiFetch } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCardFormModal } from '@/components/cards/CreditCardFormModal';
import { CreditCardPurchaseModal } from '@/components/transactions/CreditCardPurchaseModal';
import { Pencil, Trash2 } from 'lucide-react';

export default function CardsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  
  // Month selector state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [statement, setStatement] = useState<{ transactions: Transaction[], totalAmount: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Transaction | null>(null);

  const handleDelete = async (tx: Transaction) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta compra? Si tiene múltiples cuotas, se eliminarán todas.')) {
      return;
    }
    try {
      const endpoint = tx.creditCardGroupId 
        ? `/transactions/credit-card-purchase/${tx.creditCardGroupId}`
        : `/transactions/${tx.id}`;
        
      const res = await apiFetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        fetchStatement();
      } else {
        alert('Error al eliminar la compra');
      }
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al eliminar la compra.');
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (selectedCardId) {
      fetchStatement();
    }
  }, [selectedCardId, selectedMonth, selectedYear]);

  const fetchCards = async () => {
    try {
      const res = await apiFetch('/credit-cards');
      if (res.ok) {
        const data = await res.json();
        setCards(data);
        if (data.length > 0) {
          setSelectedCardId(data[0].id.toString());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatement = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/credit-cards/${selectedCardId}/statement?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setStatement(data);
      } else {
        setStatement(null);
      }
    } catch (e) {
      console.error(e);
      setStatement(null);
    } finally {
      setIsLoading(false);
    }
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const monthName = format(new Date(selectedYear, selectedMonth), 'MMMM yyyy', { locale: es });
  const selectedThemeCard = cards.find(c => c.id.toString() === selectedCardId);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Mis Tarjetas</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Administra tus consumos y cuotas por plástico.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors" onClick={() => setIsExpenseModalOpen(true)}>+ Nuevo Consumo</Button>
          <Button className="bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm" onClick={() => setIsModalOpen(true)}>+ Nueva Tarjeta</Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto ml-1">
          <Select value={selectedCardId} onValueChange={(val) => val && setSelectedCardId(val)}>
            <SelectTrigger className="w-[220px] border-none shadow-none focus:ring-0 bg-transparent text-zinc-900 dark:text-white font-semibold">
              <SelectValue placeholder="Selecciona una Tarjeta">
                {selectedCardId ? cards.find(c => c.id.toString() === selectedCardId)?.name : "Selecciona una Tarjeta"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
              {cards.map(card => (
                <SelectItem key={card.id} value={card.id.toString()}>{card.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto justify-end pr-1">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-500 text-lg font-bold">‹</span>
          </Button>
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest min-w-[140px] text-center">
            {monthName}
          </span>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <span className="text-zinc-500 dark:text-zinc-500 text-lg font-bold">›</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-500">Cargando transacciones...</div>
      ) : statement ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="md:col-span-1 space-y-4">
            <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
              <CardHeader className="p-0 pb-4">
                <CardDescription className="text-zinc-500 dark:text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Total del Resumen</CardDescription>
                <CardTitle className="text-3xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 tabular-nums">R$ {statement.totalAmount.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium space-y-1">
                  <p>Cierre: Día {selectedThemeCard?.closingDay}</p>
                  <p>Vencimiento: Día {selectedThemeCard?.dueDay}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-3">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900">
                  <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Monto (BRL)</TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Descripción</TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Fecha Compra</TableHead>
                    <TableHead className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Cuota</TableHead>
                    <TableHead className="text-center text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                        No hay consumos registrados para este resumen.
                      </TableCell>
                    </TableRow>
                  ) : (
                    statement.transactions.map((tx) => {
                      const displayDate = tx.purchaseDate || tx.createdAt || tx.date;
                      
                      return (
                        <TableRow key={tx.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                          <TableCell className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                            R$ {Number(tx.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 font-medium">
                            {tx.description}
                          </TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs">
                            {format(new Date(displayDate as string | Date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50">
                              {tx.installmentNumber && tx.totalInstallments && tx.totalInstallments > 1
                                ? `${tx.installmentNumber}/${tx.totalInstallments}`
                                : '1/1'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50"
                                onClick={() => {
                                  setSelectedExpense(tx);
                                  setIsExpenseModalOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500"
                                onClick={() => handleDelete(tx)}
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
            </div>
          </div>
        </div>
      ) : (
         <div className="py-20 text-center text-slate-500">Selecciona una tarjeta para ver el resumen asociado.</div>
      )}

      <CreditCardFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchCards();
          // Also fetch statement for the newly created or currently selected card 
          // (fetchCards will re-run but we can force it if selectedCardId stays same)
          if (selectedCardId) fetchStatement();
        }}
      />

      <CreditCardPurchaseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        onSuccess={fetchStatement}
        initialData={selectedExpense}
      />
    </div>
  );
}
