import React, { useState } from 'react';
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
import { apiFetch } from '@/lib/api';

interface InternalTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  amount: number;
  date: string;
  description: string;
}

export function InternalTransferModal({ isOpen, onClose, onSuccess }: InternalTransferModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: 'Transferencia Consultoría MEI',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/mei/internal-transfer', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(data.amount),
          date: data.date,
          description: data.description,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al realizar la transferencia');
      }

      reset();
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Transferencia Interna (Rocío → Pablo)</DialogTitle>
          <DialogDescription>
            Mueve dinero de la cuenta PF a la cuenta PJ y reserva cupo MEI.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto (BRL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register('amount', { required: true, min: 0.01 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Input
              id="description"
              placeholder="Ej: Transferencia semana 2"
              {...register('description')}
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Impacto:</strong> Esta operación descontará el saldo de Rocío, aumentará el de Pablo y quedará registrada como "Consultoría Interna" para la auditoría MEI.
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? 'Procesando...' : 'Realizar Transferencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
