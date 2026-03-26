import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { apiFetch } from '@/lib/api';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

interface FormData {
  amount: number;
  description: string;
  date: string;
  accountId: string;
  categoryId: string;
  isMeiInvoice: boolean;
  meiInvoiceType?: string;
}

interface Account {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
}

export function IncomeFormModal({ isOpen, onClose, onSuccess, initialData }: IncomeFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const [accRes, catRes] = await Promise.all([
            apiFetch('/accounts'),
            apiFetch('/categories?type=INCOME')
          ]);
          
          if (!accRes.ok || !catRes.ok) throw new Error('Error fetching data');
          
          const [accData, catData] = await Promise.all([
            accRes.json(),
            catRes.json()
          ]);
          
          setAccounts(accData);
          setCategories(catData);
        } catch (err) {
          console.error(err);
          setError('No se pudieron cargar las cuentas y categorías.');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      accountId: '',
      categoryId: '',
      isMeiInvoice: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          amount: Number(initialData.amount) || 0,
          description: initialData.description || '',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          accountId: initialData.accountId ? initialData.accountId.toString() : '',
          categoryId: initialData.categoryId ? initialData.categoryId.toString() : '',
          isMeiInvoice: initialData.isMeiInvoice || false,
        });
      } else {
        reset({
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
          accountId: '',
          categoryId: '',
          isMeiInvoice: false,
        });
      }
      setError(null);
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    if (!data.accountId || !data.categoryId) {
      setError('Por favor, selecciona cuenta (dueño) y categoría.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (initialData && !window.confirm('¿Confirmas que deseas guardar los cambios?')) {
        setIsLoading(false);
        return;
      }

      const payload = {
        accountId: Number(data.accountId),
        categoryId: Number(data.categoryId),
        amount: Number(data.amount),
        description: data.description,
        date: new Date(data.date).toISOString(),
        isMeiInvoice: data.isMeiInvoice,
        meiInvoiceType: data.isMeiInvoice ? (data.meiInvoiceType || 'GENUINE') : undefined,
      };

      const endpoint = initialData ? `/transactions/${initialData.id}` : '/transactions/income';
      const method = initialData ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al guardar el ingreso');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Ingreso' : 'Nuevo Ingreso'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Modifica los detalles de este ingreso.' 
              : 'Registra un nuevo ingreso de dinero. Selecciona la cuenta para determinar el dueño (Pablo o Rocío).'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                {...register('date', { required: true })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Monto ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                {...register('amount', { required: true, min: 0.01 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              placeholder="Ej: Salario mensual, Bonus, Freelance..."
              {...register('description', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label>Cuenta Destino (Dueño)</Label>
            <Select onValueChange={(val) => setValue('accountId', val as string)} value={watch('accountId') || ""}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingData ? "Cargando..." : "Seleccionar cuenta..."} />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select onValueChange={(val) => setValue('categoryId', val as string)} value={watch('categoryId') || ""}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingData ? "Cargando..." : "Seleccionar categoría..."} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="isMeiInvoice" 
              checked={watch('isMeiInvoice')}
              onCheckedChange={(checked) => setValue('isMeiInvoice', checked === true)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="isMeiInvoice"
                className="text-sm font-medium leading-none text-neutral-900 dark:text-neutral-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Auditable MEI
              </label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Marcar si este ingreso cuenta para el límite de facturación MEI de Pablo.
              </p>
            </div>
          </div>

          {watch('isMeiInvoice') && (
            <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-top-1">
              <Label>Tipo de Factura</Label>
              <Select
                onValueChange={(val) => setValue('meiInvoiceType' as any, val)}
                value={watch('meiInvoiceType' as any) || 'GENUINE'}
              >
                <SelectTrigger className="w-full bg-slate-50 dark:bg-neutral-900 border-indigo-100 dark:border-indigo-900/50">
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENUINE">Factura Genuina (Cliente)</SelectItem>
                  <SelectItem value="INTERNAL_PENDING">Consultoría Interna (Abono)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Guardar Ingreso')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
