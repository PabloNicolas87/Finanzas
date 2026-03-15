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

interface CreditCardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  closingDay: number;
  dueDay: number;
  accountId: string;
}

interface Account {
  id: number;
  name: string;
}

export function CreditCardFormModal({ isOpen, onClose, onSuccess }: CreditCardFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchAccounts = async () => {
        setIsLoadingData(true);
        try {
          const res = await apiFetch('/accounts');
          if (!res.ok) throw new Error('Error fetching accounts');
          const data = await res.json();
          setAccounts(data);
        } catch (err) {
          console.error(err);
          setError('No se pudieron cargar las cuentas.');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchAccounts();
    }
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      closingDay: 1,
      dueDay: 10,
      accountId: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!data.accountId) {
      setError('Por favor, selecciona una cuenta asociada.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        name: data.name,
        closingDay: Number(data.closingDay),
        dueDay: Number(data.dueDay),
        accountId: parseInt(data.accountId, 10),
      };

      const response = await apiFetch('/credit-cards', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create credit card');
      }

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al crear la tarjeta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarjeta</DialogTitle>
          <DialogDescription>
            Registra una nueva tarjeta de crédito y la cuenta desde donde la pagarás.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Tarjeta</Label>
            <Input
              id="name"
              placeholder="Ej: Itaú PF, Nubank PJ"
              {...register('name', { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">Día de Cierre</Label>
              <Input
                id="closingDay"
                type="number"
                min="1"
                max="31"
                {...register('closingDay', { required: true, valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDay">Día de Vencimiento</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                {...register('dueDay', { required: true, valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId">Cuenta Asociada (Débito) <span className="text-red-500">*</span></Label>
            <Select 
              value={watch('accountId') || ""} 
              onValueChange={(val) => val && setValue('accountId', val)}
              disabled={isLoadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
