'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  icon?: string;
  type: 'INCOME' | 'EXPENSE' | 'CREDIT_CARD';
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
  defaultType?: 'INCOME' | 'EXPENSE' | 'CREDIT_CARD';
}

export function CategoryFormModal({ isOpen, onClose, onSuccess, category, defaultType = 'EXPENSE' }: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'CREDIT_CARD'>(defaultType);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || '');
      setType(category.type);
    } else {
      setName('');
      setIcon('');
      setType(defaultType);
    }
  }, [category, defaultType, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { name, icon, type };
      const method = category ? 'PUT' : 'POST';
      const endpoint = category ? `/categories/${category.id}` : '/categories';

      await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Alimentación, Salario..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon">Ícono (Emoji)</Label>
            <Input
              id="icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Ej: 🛒, 🏠, 💰"
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo de Dominio</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={type === 'INCOME' ? 'default' : 'outline'}
                className={type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                onClick={() => setType('INCOME')}
              >
                Ingreso
              </Button>
              <Button
                type="button"
                variant={type === 'EXPENSE' ? 'default' : 'outline'}
                className={type === 'EXPENSE' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                onClick={() => setType('EXPENSE')}
              >
                Gasto
              </Button>
              <Button
                type="button"
                variant={type === 'CREDIT_CARD' ? 'default' : 'outline'}
                className={type === 'CREDIT_CARD' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                onClick={() => setType('CREDIT_CARD')}
              >
                Tarjeta
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
