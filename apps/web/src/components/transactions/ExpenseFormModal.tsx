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
import { apiFetch } from '@/lib/api';

interface ExpenseFormModalProps {
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
}

export function ExpenseFormModal({ isOpen, onClose, onSuccess, initialData }: ExpenseFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

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
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const [accRes, catRes] = await Promise.all([
            apiFetch('/accounts'),
            apiFetch('/categories?type=EXPENSE')
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
          setError('No se pudieron cargar las cuentas o categorías.');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          amount: Number(initialData.amount) || 0,
          description: initialData.description || '',
          date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          accountId: initialData.accountId ? initialData.accountId.toString() : '',
          categoryId: initialData.categoryId ? initialData.categoryId.toString() : '',
        });
      } else {
        reset({
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
          accountId: '',
          categoryId: '',
        });
      }
      setError(null);
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    if (!data.accountId || !data.categoryId) {
      setError('Por favor, selecciona cuenta y categoría.');
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
      };

      const endpoint = initialData ? `/transactions/${initialData.id}` : '/transactions/expense';
      const method = initialData ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save transaction');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
          <DialogDescription>
            Registra un gasto simple (PIX, Efectivo, Transferencia).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input id="date" type="date" {...register('date', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cuenta *</Label>
              <Select value={watch('accountId') || ""} onValueChange={(val) => val && setValue('accountId', val)}>
                <SelectTrigger disabled={isLoadingData}>
                  <SelectValue placeholder="Selecciona...">
                    {watch('accountId') ? accounts.find((a:any) => a.id.toString() === watch('accountId'))?.name : "Selecciona..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((acc:any) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoría *</Label>
              <Select value={watch('categoryId') || ""} onValueChange={(val) => val && setValue('categoryId', val)}>
                <SelectTrigger disabled={isLoadingData}>
                  <SelectValue placeholder="Selecciona...">
                     {watch('categoryId') ? categories.find((c:any) => c.id.toString() === watch('categoryId'))?.name : "Selecciona..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat:any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input id="description" placeholder="Ej: Café" {...register('description', { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto (BRL)</Label>
            <Input id="amount" type="number" step="0.01" min="0" {...register('amount', { required: true, valueAsNumber: true })} />
          </div>

          {error && <p className="text-sm font-medium text-red-500 dark:text-red-400">{error}</p>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
