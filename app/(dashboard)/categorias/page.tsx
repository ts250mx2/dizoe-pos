'use client';

import { useEffect, useState } from 'react';
import { Boxes, Edit2, Package, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import { CATEGORY_TYPE_LABELS, CategoryType } from '@/lib/catalog';
import styles from '../clientes/clientes.module.css';

interface Category {
  IdCategoria: number;
  Categoria: string;
  EsExtra: number;
  TipoCategoria: CategoryType;
}

const TYPE_STYLES: Record<CategoryType, { color: string; background: string }> = {
  SERVICIO: { color: '#397a67', background: 'rgba(72, 160, 132, 0.13)' },
  PRODUCTO: { color: 'var(--gold-deep)', background: 'var(--gold-glow)' },
  EXTRA: { color: '#9a5f35', background: 'rgba(205, 126, 67, 0.14)' },
};

const EMPTY_FORM: { Categoria: string; TipoCategoria: CategoryType } = {
  Categoria: '',
  TipoCategoria: 'SERVICIO',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(response.ok && Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchCategories(); }, []);

  const openNew = () => {
    setFormData(EMPTY_FORM);
    setModal({ open: true, category: null });
  };

  const openEdit = (category: Category) => {
    setFormData({ Categoria: category.Categoria, TipoCategoria: category.TipoCategoria || (category.EsExtra ? 'EXTRA' : 'SERVICIO') });
    setModal({ open: true, category });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(
      modal.category ? `/api/categories/${modal.category.IdCategoria}` : '/api/categories',
      {
        method: modal.category ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }
    );

    if (response.ok) {
      setModal({ open: false, category: null });
      await fetchCategories();
    } else {
      const data = await response.json();
      alert(data.message || 'No se pudo guardar la categoría');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta categoría?')) return;
    const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (response.ok) await fetchCategories();
    else {
      const data = await response.json();
      alert(data.message || 'No se pudo eliminar la categoría');
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando…</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Boxes size={32} color="var(--gold)" />
          <div>
            <h1>Categorías</h1>
            <p className={styles.subtitle}>Define qué se vende, qué se inventaría y qué funciona como adicional.</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={openNew}>
          <Plus size={20} /> Nueva categoría
        </button>
      </header>

      <div className={`${styles.tableWrapper} glass animate-fade`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Comportamiento</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const type = category.TipoCategoria || (category.EsExtra ? 'EXTRA' : 'SERVICIO');
              return (
                <tr key={category.IdCategoria}>
                  <td style={{ fontWeight: 650 }}>{category.Categoria}</td>
                  <td>
                    <span style={{ ...TYPE_STYLES[type], display: 'inline-flex', padding: '0.3rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 750 }}>
                      {CATEGORY_TYPE_LABELS[type]}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {type === 'PRODUCTO' ? 'Controla existencias y descuenta al vender' : type === 'EXTRA' ? 'Se agrega como complemento' : 'No controla existencias'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button onClick={() => openEdit(category)} className={styles.editBtn} aria-label={`Editar ${category.Categoria}`}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(category.IdCategoria)} className={styles.deleteBtn} aria-label={`Eliminar ${category.Categoria}`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSave} className={`${styles.modal} glass animate-scale`}>
            <div className={styles.modalHeader}>
              <h3>{modal.category ? 'Editar categoría' : 'Nueva categoría'}</h3>
              <button type="button" onClick={() => setModal({ open: false, category: null })} aria-label="Cerrar"><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Nombre</label>
                <input value={formData.Categoria} onChange={(event) => setFormData({ ...formData, Categoria: event.target.value })} required autoFocus />
              </div>
              <div className={styles.inputGroup}>
                <label>Tipo de categoría</label>
                <select value={formData.TipoCategoria} onChange={(event) => setFormData({ ...formData, TipoCategoria: event.target.value as CategoryType })}>
                  <option value="SERVICIO">Servicio — sin inventario</option>
                  <option value="PRODUCTO">Producto — inventariable</option>
                  <option value="EXTRA">Extra / Adicional</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', padding: '0.9rem', borderRadius: 'var(--r)', background: 'var(--surface-2)', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                {formData.TipoCategoria === 'PRODUCTO' ? <Package size={18} color="var(--gold)" /> : <Sparkles size={18} color="var(--gold)" />}
                <span>{formData.TipoCategoria === 'PRODUCTO' ? 'Todos los artículos de esta categoría aparecerán en Inventario y su existencia se descontará al vender.' : 'Este tipo no modifica existencias al vender.'}</span>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                <Save size={18} /> {saving ? 'Guardando…' : 'Guardar categoría'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
