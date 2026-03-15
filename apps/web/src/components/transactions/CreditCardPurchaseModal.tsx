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

interface CreditCardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
}

interface FormData {
  amount: number;
  description: string;
  date: string;
  creditCardId: string;
  categoryId: string;
  totalInstallments: number;
}

export function CreditCardPurchaseModal({ isOpen, onClose, onSuccess, initialData }: CreditCardPurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      creditCardId: '',
      categoryId: '',
      totalInstallments: 1,
    },
  });

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        try {
          const [cardRes, catRes] = await Promise.all([
            apiFetch('/credit-cards'),
            apiFetch('/categories?type=CREDIT_CARD')
          ]);
          
          if (!cardRes.ok || !catRes.ok) throw new Error('Error fetching data');
          
          const [cardData, catData] = await Promise.all([
            cardRes.json(),
            catRes.json()
          ]);
          
          setCards(cardData);
          setCategories(catData);
        } catch (err) {
          console.error(err);
          setError('No se pudieron cargar las tarjetas o categorías.');
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
        let prefillAmount = Number(initialData.amount) || 0;
        if (initialData.creditCardGroupId && initialData.totalInstallments && initialData.totalInstallments > 1) {
          prefillAmount = Math.round(prefillAmount * initialData.totalInstallments * 100) / 100;
        }

        reset({
          amount: prefillAmount,
          description: initialData.description || '',
          date: initialData.purchaseDate 
            ? new Date(initialData.purchaseDate).toISOString().split('T')[0] 
            : initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          creditCardId: initialData.creditCardId ? initialData.creditCardId.toString() : '',
          categoryId: initialData.categoryId ? initialData.categoryId.toString() : '',
          totalInstallments: initialData.totalInstallments || 1,
        });
      } else {
        reset({
          amount: 0,
          description: '',
          date: new Date().toISOString().split('T')[0],
          creditCardId: '',
          categoryId: '',
          totalInstallments: 1,
        });
      }
      setError(null);
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    if (!data.creditCardId || !data.categoryId) {
      setError('Por favor, selecciona tarjeta y categoría.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (initialData && !window.confirm('¿Confirmas que deseas guardar los cambios en esta compra?')) {
        setIsLoading(false);
        return;
      }

      // We need accountId because the backend requires it even for CC purchases (mapping it to the card's account)
      const selectedCard = cards.find(c => c.id.toString() === data.creditCardId);
      if (!selectedCard) throw new Error('Tarjeta no encontrada');

      const payload = {
        accountId: selectedCard.accountId,
        creditCardId: Number(data.creditCardId),
        categoryId: Number(data.categoryId),
        amount: Number(data.amount),
        description: data.description,
        date: new Date(data.date).toISOString(),
        totalInstallments: Number(data.totalInstallments) || 1,
      };

      let endpoint = '/transactions/expense';
      let method = 'POST';

      if (initialData) {
        if (initialData.creditCardGroupId) {
          endpoint = `/transactions/credit-card-purchase/${initialData.creditCardGroupId}`;
          method = 'PUT';
        } else {
          endpoint = `/transactions/${initialData.id}`;
          method = 'PUT';
        }
      }

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Error al guardar la compra');

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
          <DialogTitle>{initialData ? 'Editar Compra' : 'Nueva Compra con Tarjeta'}</DialogTitle>
          <DialogDescription>
            Registra un consumo realizado con tarjeta de crédito.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Fecha de Compra</Label>
            <Input id="date" type="date" {...register('date', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarjeta *</Label>
              <Select value={watch('creditCardId') || ""} onValueChange={(val) => val && setValue('creditCardId', val)}>
                <SelectTrigger disabled={isLoadingData}>
                  <SelectValue placeholder="Selecciona...">
                    {watch('creditCardId') ? cards.find((c:any) => c.id.toString() === watch('creditCardId'))?.name : "Selecciona..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card:any) => (
                    <SelectItem key={card.id} value={card.id.toString()}>{card.name}</SelectItem>
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
            <Input id="description" placeholder="Ej: Supermercado" {...register('description', { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto Total (BRL)</Label>
              <Input id="amount" type="number" step="0.01" min="0" {...register('amount', { required: true, valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">Cuotas</Label>
              <Input id="totalInstallments" type="number" min="1" {...register('totalInstallments', { required: true, valueAsNumber: true })} />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Compra'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
