'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, ArrowRightLeft, ShieldCheck, Clock, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Transaction } from '@finanzas/shared-types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { IncomeFormModal } from '@/components/transactions/IncomeFormModal';
import { InternalTransferModal } from '@/components/mei/InternalTransferModal';

interface MeiAuditReport {
  year: number;
  totalFacturado: number;
  limite: number;
  disponible: number;
  porcentajeUsado: string;
  genuineInvoices: Transaction[];
  internalAccumulated: Transaction[];
}

export default function MeiPage() {
  const [report, setReport] = useState<MeiAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Default hardcoded to user 1 (Pablo PJ) and year 2026
  const userId = 1;
  const currentYear = 2026;

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/transactions/reports/mei-audit/${userId}/${currentYear}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        console.error('Failed to fetch MEI report:', await res.text());
      }
    } catch (err) {
      console.error('Error connecting to API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [userId, currentYear]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-slate-500">Cargando datos de auditoría...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-red-500">Error al cargar el panel MEI.</p>
      </div>
    );
  }

  const { totalFacturado, porcentajeUsado, genuineInvoices, internalAccumulated } = report;
  const limite = report.limite || 81000;
  const percentageFloat = parseFloat(porcentajeUsado);

  const totalGenuino = genuineInvoices.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const totalInterno = internalAccumulated.reduce((acc, tx) => acc + Number(tx.amount), 0);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Panel MEI (Auditoría) {currentYear}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Control de facturado acumulado y conciliación fiscal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            className="border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Consultoría Interna
          </Button>
          <Button 
            className="bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
            onClick={() => setIsIncomeModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Emitir Factura Genuina
          </Button>
        </div>
      </div>

      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6 overflow-hidden">
        <CardHeader className="p-0 pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-zinc-900 dark:text-zinc-50 text-lg">Límite Anual de Facturación</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                Consumo total del cupo fiscal (R$ {limite.toLocaleString()})
              </CardDescription>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">R$ {totalFacturado.toLocaleString()}</span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Acumulado Total</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 p-0">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-1">Facturación Genuina</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">R$ {totalGenuino.toLocaleString()}</p>
             </div>
             <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mb-1">Consultoría Interna</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">R$ {totalInterno.toLocaleString()}</p>
             </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Estado del cupo</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-50">{porcentajeUsado}</span>
            </div>
            <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
               <div 
                 className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-1000 ease-out" 
                 style={{ width: `${Math.min(percentageFloat, 100)}%` }}
               />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest font-bold pt-1">
               <span>Inyectado</span>
               <span>Disponible: R$ {(limite - totalFacturado).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* TABLA GENUINA */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-2">
               <ShieldCheck className="h-5 w-5 text-emerald-500" />
               <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Facturas Emitidas</CardTitle>
            </div>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">Cobros a clientes externos</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="space-y-1">
              {genuineInvoices.length === 0 ? (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-10 text-sm italic">No hay facturas genuinas.</p>
              ) : (
                genuineInvoices.map((tx) => (
                  <InvoiceRow key={tx.id} tx={tx} type="genuine" />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* TABLA INTERNA */}
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center gap-2">
               <Clock className="h-5 w-5 text-amber-500" />
               <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50">Consultoría Interna</CardTitle>
            </div>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">Transferencias PF → PJ</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <div className="space-y-1">
              {internalAccumulated.length === 0 ? (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-10 text-sm italic">No hay transferencias.</p>
              ) : (
                internalAccumulated.map((tx) => (
                  <InvoiceRow key={tx.id} tx={tx} type="internal" />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <IncomeFormModal 
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={() => fetchReport()}
        initialData={{ isMeiInvoice: true, meiInvoiceType: 'GENUINE', accountId: 1 }} // Pre-configurado para Pablo PJ
      />

      <InternalTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => fetchReport()}
      />
    </div>
  );
}

function InvoiceRow({ tx, type }: { tx: any, type: 'genuine'|'internal' }) {
  const iconColor = type === 'genuine' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500';
  
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50 py-3 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 px-3 -mx-3 rounded-md transition-colors">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full ${iconColor} flex items-center justify-center`}>
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">R$ {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {format(new Date(tx.date), 'dd MMM yyyy', { locale: es })}
            {tx.description ? ` • ${tx.description}` : ''}
          </p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
