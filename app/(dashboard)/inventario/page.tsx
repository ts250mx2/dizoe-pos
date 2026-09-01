'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, History, Search, SlidersHorizontal, X } from 'lucide-react';
import styles from './inventario.module.css';

interface InventoryProduct {
  IdProducto: number;
  Producto: string;
  Precio1: number;
  StockActual: number;
  StockMinimo: number;
  UnidadMedida: string;
  Categoria: string;
  ArchivoImagen: string | null;
}

interface Movement {
  IdMovimientoInventario: number;
  IdProducto: number;
  Producto: string;
  TipoMovimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  Cantidad: number;
  StockAnterior: number;
  StockNuevo: number;
  Motivo: string;
  IdVenta: number | null;
  FechaMovimiento: string;
  UnidadMedida: string;
}

interface InventoryData {
  products: InventoryProduct[];
  movements: Movement[];
  summary: { products: number; lowStock: number; outOfStock: number };
}

type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export default function InventoryPage() {
  const [data, setData] = useState<InventoryData>({ products: [], movements: [], summary: { products: 0, lowStock: 0, outOfStock: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const [selected, setSelected] = useState<InventoryProduct | null>(null);
  const [type, setType] = useState<MovementType>('ENTRADA');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const response = await fetch('/api/inventory');
      const result = await response.json();
      if (response.ok) setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => data.products.filter((product) => {
    const matches = `${product.Producto} ${product.Categoria}`.toLowerCase().includes(search.toLowerCase());
    const low = Number(product.StockActual) <= Number(product.StockMinimo);
    return matches && (!onlyLow || low);
  }), [data.products, onlyLow, search]);

  const openMovement = (product: InventoryProduct, movementType: MovementType) => {
    setSelected(product);
    setType(movementType);
    setAmount(movementType === 'AJUSTE' ? String(Number(product.StockActual)) : '');
    setReason('');
    setError('');
  };

  const saveMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idProducto: selected.IdProducto, tipo: type, cantidad: Number(amount), motivo: reason }),
    });
    const result = await response.json();
    if (response.ok) {
      setSelected(null);
      await load();
    } else setError(result.message || 'No se pudo guardar el movimiento');
    setSaving(false);
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando inventario…</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Control de existencias</span>
          <h1>Inventario</h1>
          <p>Productos físicos disponibles para venta en DIZOE.</p>
        </div>
        <Boxes size={42} color="var(--gold)" />
      </header>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}><span>Productos inventariables</span><strong>{data.summary.products}</strong><Boxes size={20} /></article>
        <article className={`${styles.summaryCard} ${styles.warningCard}`}><span>En mínimo</span><strong>{data.summary.lowStock}</strong><AlertTriangle size={20} /></article>
        <article className={`${styles.summaryCard} ${styles.dangerCard}`}><span>Agotados</span><strong>{data.summary.outOfStock}</strong><X size={20} /></article>
      </section>

      <section className={styles.inventoryPanel}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar producto o categoría" /></div>
          <button className={`${styles.filterBtn} ${onlyLow ? styles.filterActive : ''}`} onClick={() => setOnlyLow((value) => !value)}><SlidersHorizontal size={17} /> Existencia baja</button>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.empty}><Boxes size={34} /><strong>No hay productos para mostrar</strong><span>Crea artículos dentro de una categoría tipo Producto.</span></div>
        ) : (
          <div className={styles.productGrid}>
            {filtered.map((product) => {
              const stock = Number(product.StockActual);
              const minimum = Number(product.StockMinimo);
              const isLow = stock <= minimum;
              return (
                <article className={`${styles.productCard} ${isLow ? styles.lowProduct : ''}`} key={product.IdProducto}>
                  <div className={styles.productTop}>
                    <span className={styles.category}>{product.Categoria}</span>
                    {isLow && <span className={styles.lowBadge}>{stock <= 0 ? 'Agotado' : 'Existencia baja'}</span>}
                  </div>
                  <h2>{product.Producto}</h2>
                  <div className={styles.stockLine}><strong>{stock.toLocaleString('es-MX')}</strong><span>{product.UnidadMedida || 'pieza'}</span></div>
                  <div className={styles.minimum}>Mínimo: {minimum.toLocaleString('es-MX')} {product.UnidadMedida || 'pieza'}</div>
                  <div className={styles.actions}>
                    <button onClick={() => openMovement(product, 'ENTRADA')}><ArrowDownToLine size={16} /> Entrada</button>
                    <button onClick={() => openMovement(product, 'SALIDA')}><ArrowUpFromLine size={16} /> Salida</button>
                    <button onClick={() => openMovement(product, 'AJUSTE')} aria-label={`Ajustar ${product.Producto}`}><SlidersHorizontal size={16} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.historyPanel}>
        <div className={styles.sectionTitle}><div><History size={21} /><h2>Movimientos recientes</h2></div><span>Últimos 100 registros</span></div>
        <div className={styles.tableScroll}>
          <table><thead><tr><th>Fecha</th><th>Producto</th><th>Movimiento</th><th>Cantidad</th><th>Existencia</th><th>Motivo</th></tr></thead>
            <tbody>{data.movements.map((movement) => (
              <tr key={movement.IdMovimientoInventario}>
                <td>{new Date(movement.FechaMovimiento).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td><strong>{movement.Producto}</strong></td>
                <td><span className={`${styles.movementBadge} ${styles[movement.TipoMovimiento.toLowerCase()]}`}>{movement.TipoMovimiento}</span></td>
                <td className={Number(movement.Cantidad) >= 0 ? styles.positive : styles.negative}>{Number(movement.Cantidad) > 0 ? '+' : ''}{Number(movement.Cantidad)} {movement.UnidadMedida}</td>
                <td>{Number(movement.StockAnterior)} → <strong>{Number(movement.StockNuevo)}</strong></td>
                <td>{movement.Motivo}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={saveMovement}>
            <div className={styles.modalHeader}><div><span>{selected.Categoria}</span><h2>{selected.Producto}</h2></div><button type="button" onClick={() => setSelected(null)}><X size={20} /></button></div>
            <div className={styles.currentStock}>Existencia actual <strong>{Number(selected.StockActual)} {selected.UnidadMedida}</strong></div>
            <div className={styles.typeSelector}>
              {(['ENTRADA', 'SALIDA', 'AJUSTE'] as MovementType[]).map((option) => <button type="button" key={option} className={type === option ? styles.selectedType : ''} onClick={() => { setType(option); setAmount(option === 'AJUSTE' ? String(Number(selected.StockActual)) : ''); }}>{option === 'ENTRADA' ? 'Entrada' : option === 'SALIDA' ? 'Salida' : 'Ajuste'}</button>)}
            </div>
            <label>{type === 'AJUSTE' ? 'Nueva existencia' : 'Cantidad'}<input type="number" min="0" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} required autoFocus /></label>
            <label>Motivo<input value={reason} onChange={(event) => setReason(event.target.value)} placeholder={type === 'ENTRADA' ? 'Ej. Compra a proveedor' : type === 'SALIDA' ? 'Ej. Producto dañado' : 'Ej. Conteo físico'} required /></label>
            {error && <div className={styles.error} role="alert">{error}</div>}
            <button className={styles.saveBtn} disabled={saving}>{saving ? 'Guardando…' : 'Registrar movimiento'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
