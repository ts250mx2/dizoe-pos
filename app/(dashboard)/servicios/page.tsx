'use client';

import { useEffect, useMemo, useState } from 'react';
import { Edit2, Image as ImageIcon, PackagePlus, Plus, Save, Trash2, X } from 'lucide-react';
import { CATEGORY_TYPE_LABELS, CategoryType } from '@/lib/catalog';
import styles from '../clientes/clientes.module.css';

interface Product {
  IdProducto: number;
  Producto: string;
  Precio1: number;
  Precio2: number;
  Precio3: number;
  IdCategoria: number;
  Categoria?: string;
  TipoCategoria?: CategoryType;
  Status: number;
  Multiple: number;
  ArchivoImagen: string | null;
  StockActual: number;
  StockMinimo: number;
  UnidadMedida: string;
  DuracionMinutos: number;
}

interface Category {
  IdCategoria: number;
  Categoria: string;
  TipoCategoria: CategoryType;
}

interface ProductForm {
  Producto: string;
  Precio1: string | number;
  Precio2: string | number;
  Precio3: string | number;
  IdCategoria: string | number;
  Status: number;
  Multiple: number;
  ArchivoImagen: string;
  StockMinimo: string | number;
  UnidadMedida: string;
  DuracionMinutos: string | number;
}

const emptyForm = (categoryId: number | string = ''): ProductForm => ({
  Producto: '', Precio1: '', Precio2: '', Precio3: '', IdCategoria: categoryId,
  Status: 1, Multiple: 0, ArchivoImagen: '', StockMinimo: 0, UnidadMedida: 'pieza', DuracionMinutos: 60,
});

export default function ServicesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [formData, setFormData] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const selectedCategory = useMemo(
    () => categories.find((category) => Number(category.IdCategoria) === Number(formData.IdCategoria)),
    [categories, formData.IdCategoria]
  );

  const load = async () => {
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/products/manage'),
        fetch('/api/categories'),
      ]);
      const [productsData, categoriesData] = await Promise.all([
        productsResponse.json(), categoriesResponse.json(),
      ]);
      setProducts(productsResponse.ok && Array.isArray(productsData) ? productsData : []);
      setCategories(categoriesResponse.ok && Array.isArray(categoriesData) ? categoriesData : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const response = await fetch(
      modal.product ? `/api/products/manage/${modal.product.IdProducto}` : '/api/products/manage',
      {
        method: modal.product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          Precio1: Number(formData.Precio1) || 0,
          Precio2: Number(formData.Precio2) || 0,
          Precio3: Number(formData.Precio3) || 0,
          IdCategoria: Number(formData.IdCategoria),
          StockMinimo: Math.round(Number(formData.StockMinimo)) || 0,
          DuracionMinutos: Number(formData.DuracionMinutos) || 60,
        }),
      }
    );
    if (response.ok) {
      setModal({ open: false, product: null });
      await load();
    } else {
      const data = await response.json();
      alert(data.message || 'No se pudo guardar el artículo');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    const response = await fetch(`/api/products/manage/${id}`, { method: 'DELETE' });
    if (response.ok) await load();
  };

  const openEdit = (product: Product) => {
    setFormData({
      Producto: product.Producto,
      Precio1: product.Precio1,
      Precio2: product.Precio2,
      Precio3: product.Precio3,
      IdCategoria: product.IdCategoria,
      Status: product.Status,
      Multiple: product.Multiple,
      ArchivoImagen: product.ArchivoImagen || '',
      StockMinimo: product.StockMinimo || 0,
      UnidadMedida: product.UnidadMedida || 'pieza',
      DuracionMinutos: product.DuracionMinutos || 60,
    });
    setModal({ open: true, product });
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando…</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <PackagePlus size={32} color="var(--gold)" />
          <div>
            <h1>Catálogo</h1>
            <p className={styles.subtitle}>Administra servicios, productos de venta y extras.</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => {
          setFormData(emptyForm(categories[0]?.IdCategoria || ''));
          setModal({ open: true, product: null });
        }}>
          <Plus size={20} /> Nuevo artículo
        </button>
      </header>

      <div className={`${styles.tableWrapper} glass animate-fade`}>
        <table className={styles.table}>
          <thead><tr>
            <th>Artículo</th><th>Categoría</th><th>Tipo</th><th>Precio</th><th>Inventario</th><th style={{ textAlign: 'right' }}>Acciones</th>
          </tr></thead>
          <tbody>
            {products.filter((product) => product.Status === 1).map((product) => (
              <tr key={product.IdProducto}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 650 }}>
                    {product.ArchivoImagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.ArchivoImagen} alt="" style={{ width: 34, height: 34, borderRadius: 6, objectFit: 'cover' }} />
                    ) : <span className={styles.avatar}><PackagePlus size={15} /></span>}
                    {product.Producto}
                  </div>
                </td>
                <td><span className="badge-info" style={{ fontSize: '0.7rem' }}>{product.Categoria}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 650 }}>
                  {CATEGORY_TYPE_LABELS[product.TipoCategoria || 'SERVICIO']}
                </td>
                <td style={{ fontWeight: 750 }}>${Number(product.Precio1).toFixed(2)}</td>
                <td>
                  {product.TipoCategoria === 'PRODUCTO' ? (
                    <span style={{ color: Number(product.StockActual) <= Number(product.StockMinimo) ? 'var(--danger)' : 'var(--text)', fontWeight: 750 }}>
                      {Number(product.StockActual)} {product.UnidadMedida || 'pieza'}
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>No aplica</span>}
                </td>
                <td><div className={styles.actions}>
                  <button onClick={() => openEdit(product)} className={styles.editBtn} aria-label={`Editar ${product.Producto}`}><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(product.IdProducto)} className={styles.deleteBtn} aria-label={`Eliminar ${product.Producto}`}><Trash2 size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSave} className={`${styles.modal} glass animate-scale`}>
            <div className={styles.modalHeader}>
              <h3>{modal.product ? 'Editar artículo' : 'Nuevo artículo'}</h3>
              <button type="button" onClick={() => setModal({ open: false, product: null })} aria-label="Cerrar"><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Nombre del artículo</label>
                <input value={formData.Producto} onChange={(event) => setFormData({ ...formData, Producto: event.target.value })} required autoFocus />
              </div>
              <div className="grid-responsive" style={{ gap: 15 }}>
                <div className={styles.inputGroup}>
                  <label>Categoría</label>
                  <select value={formData.IdCategoria} onChange={(event) => setFormData({ ...formData, IdCategoria: event.target.value })} required>
                    {categories.map((category) => <option key={category.IdCategoria} value={category.IdCategoria}>{category.Categoria} · {CATEGORY_TYPE_LABELS[category.TipoCategoria]}</option>)}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Precio principal ($)</label>
                  <input type="number" min="0" step="0.01" value={formData.Precio1} onChange={(event) => setFormData({ ...formData, Precio1: event.target.value })} required />
                </div>
              </div>
              <div className="grid-responsive" style={{ gap: 15 }}>
                <div className={styles.inputGroup}><label>Precio opcional 2 ($)</label><input type="number" min="0" step="0.01" value={formData.Precio2} onChange={(event) => setFormData({ ...formData, Precio2: event.target.value })} /></div>
                <div className={styles.inputGroup}><label>Precio opcional 3 ($)</label><input type="number" min="0" step="0.01" value={formData.Precio3} onChange={(event) => setFormData({ ...formData, Precio3: event.target.value })} /></div>
              </div>
              {selectedCategory?.TipoCategoria === 'PRODUCTO' && (
                <div className="grid-responsive" style={{ gap: 15 }}>
                  <div className={styles.inputGroup}>
                    <label>Existencia mínima</label>
                    <input type="number" min="0" step="1" inputMode="numeric" value={formData.StockMinimo} onChange={(event) => setFormData({ ...formData, StockMinimo: event.target.value })} />
                  </div>
                  <div className={styles.inputGroup}>
                    <label>Unidad de medida</label>
                    <select value={formData.UnidadMedida} onChange={(event) => setFormData({ ...formData, UnidadMedida: event.target.value })}>
                      <option value="pieza">Pieza</option><option value="ml">Mililitro</option><option value="g">Gramo</option><option value="caja">Caja</option><option value="paquete">Paquete</option>
                    </select>
                  </div>
                </div>
              )}
              {selectedCategory?.TipoCategoria === 'SERVICIO' && (
                <div className={styles.inputGroup}>
                  <label>Duración para agenda pública (minutos)</label>
                  <select value={formData.DuracionMinutos} onChange={(event) => setFormData({ ...formData, DuracionMinutos: Number(event.target.value) })}>
                    <option value={15}>15 minutos</option><option value={30}>30 minutos</option><option value={45}>45 minutos</option><option value={60}>60 minutos</option><option value={90}>90 minutos</option><option value={120}>120 minutos</option><option value={180}>180 minutos</option>
                  </select>
                </div>
              )}
              <div className={styles.inputGroup}>
                <label>URL de imagen (opcional)</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={formData.ArchivoImagen} onChange={(event) => setFormData({ ...formData, ArchivoImagen: event.target.value })} placeholder="https://…" />
                  <span className={styles.avatar}>{formData.ArchivoImagen ? <ImageIcon size={18} /> : <ImageIcon size={18} color="var(--text-muted)" />}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="submit" className={styles.saveBtn} disabled={saving}><Save size={18} /> {saving ? 'Guardando…' : 'Guardar artículo'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
