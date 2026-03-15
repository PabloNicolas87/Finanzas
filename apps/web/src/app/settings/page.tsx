'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit2, Trash2, Wallet, Receipt, CreditCard } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';

type CategoryType = 'INCOME' | 'EXPENSE' | 'CREDIT_CARD';

interface Category {
  id: number;
  name: string;
  icon?: string;
  type: CategoryType;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>('EXPENSE');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/categories?type=${activeTab}`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeTab]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;
    
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const openNewModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const getTabStyles = (type: CategoryType) => {
    if (activeTab !== type) return 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200';
    return 'border-b-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white font-bold';
  };

  const getCardHeaderColor = () => {
    switch (activeTab) {
      case 'INCOME': return 'border-l-4 border-l-zinc-900 dark:border-l-zinc-50';
      case 'EXPENSE': return 'border-l-4 border-l-zinc-900 dark:border-l-zinc-50';
      case 'CREDIT_CARD': return 'border-l-4 border-l-zinc-900 dark:border-l-zinc-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Configuración</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Administración de sistema y catálogos.</p>
        </div>
      </div>

      {/* TABS MANUALES */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-8 px-2">
        <button 
          onClick={() => setActiveTab('EXPENSE')}
          className={`pb-3 px-1 transition-all flex items-center gap-2 text-sm ${getTabStyles('EXPENSE')}`}
        >
          <Receipt className="h-4 w-4" />
          Gastos Mensuales
        </button>
        <button 
          onClick={() => setActiveTab('CREDIT_CARD')}
          className={`pb-3 px-1 transition-all flex items-center gap-2 text-sm ${getTabStyles('CREDIT_CARD')}`}
        >
          <CreditCard className="h-4 w-4" />
          Tarjetas de Crédito
        </button>
        <button 
          onClick={() => setActiveTab('INCOME')}
          className={`pb-3 px-1 transition-all flex items-center gap-2 text-sm ${getTabStyles('INCOME')}`}
        >
          <Wallet className="h-4 w-4" />
          Ingresos
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm p-6 md:col-span-2 lg:col-span-1">
          <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-800/50">
            <div>
              <CardTitle className="text-zinc-900 dark:text-zinc-50 text-lg">
                {activeTab === 'INCOME' && 'Categorías de Ingresos'}
                {activeTab === 'EXPENSE' && 'Categorías de Gastos'}
                {activeTab === 'CREDIT_CARD' && 'Categorías de Tarjeta'}
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
                Gestiona las categorías de {activeTab === 'INCOME' ? 'tus ingresos' : activeTab === 'EXPENSE' ? 'tus gastos fijos y variables' : 'tus compras con tarjeta'}.
              </CardDescription>
            </div>
            <Button size="sm" className="bg-zinc-950 dark:bg-white text-zinc-50 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm" onClick={openNewModal}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva
            </Button>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-center py-8 text-zinc-500 dark:text-zinc-400">Cargando categorías...</p>
              ) : categories.length === 0 ? (
                <p className="text-sm text-center py-8 text-zinc-500 dark:text-zinc-400 italic">No hay categorías en este dominio.</p>
              ) : categories.map((cat) => (
                <div key={cat.id} className="group flex items-center justify-between p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon || '📁'}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-200">{cat.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50" onClick={() => openEditModal(cat)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-500"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-50 dark:bg-zinc-900 border-dashed border-zinc-200 dark:border-zinc-800 shadow-none p-6 md:col-span-2 lg:col-span-1">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Settings className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
              Reglas de División
            </CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">Configuración de porcentajes de división.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center justify-center pt-8 text-center text-zinc-500 dark:text-zinc-400">
            <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
              <Settings className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
            </div>
            <p className="text-sm max-w-[240px]">
              Módulo de reglas de división en construcción. Estará disponible en la próxima versión.
            </p>
          </CardContent>
        </Card>
      </div>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCategories}
        category={editingCategory}
        defaultType={activeTab}
      />
    </div>
  );
}
