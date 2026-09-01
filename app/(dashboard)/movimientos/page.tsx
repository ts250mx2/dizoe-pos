'use client';

import { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowUpRight, ArrowDownRight, Wallet, ShoppingBag, Search, Calendar as CalendarIcon } from 'lucide-react';
import styles from '../clientes/clientes.module.css';

interface Movement {
  Id: string;
  IdApertura: number | null;
  Tipo: 'apertura' | 'venta' | 'entrada' | 'salida';
  Concepto: string;
  Monto: number;
  Fecha: string;
}

const TIPO_LABELS: Record<Movement['Tipo'], { label: string; badge: string }> = {
  apertura: { label: 'Apertura', badge: 'badge-info' },
  venta: { label: 'Venta', badge: 'badge-success' },
  entrada: { label: 'Entrada', badge: 'badge-success' },
  salida: { label: 'Salida', badge: 'badge-danger' },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchMovements(); }, []);

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/movements/history');
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setError(data?.message || 'Error al consultar el historial de movimientos');
        setMovements([]);
      } else {
        setMovements(data);
      }
    } catch {
      setError('Error de conexión al consultar el historial');
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = movements.filter(m =>
    (m.Concepto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(m.IdApertura ?? '').includes(searchTerm)
  );

  const renderTipo = (m: Movement) => {
    const tipo = TIPO_LABELS[m.Tipo] || TIPO_LABELS.entrada;
    const isNegative = m.Tipo === 'salida' || Number(m.Monto) < 0;

    return (
      <span className={tipo.badge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
        {m.Tipo === 'apertura' ? <Wallet size={12} />
          : m.Tipo === 'venta' ? <ShoppingBag size={12} />
          : isNegative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
        {tipo.label}
      </span>
    );
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando historial...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <ArrowLeftRight size={32} color="var(--gold)" />
          <div>
            <h1>Historial de Movimientos</h1>
            <p className={styles.subtitle}>Aperturas, ventas y entradas/salidas de efectivo</p>
          </div>
        </div>
      </header>

      <div className={styles.searchBar} style={{ marginBottom: '1.5rem', maxWidth: '400px', display: 'flex', alignItems: 'center', background: 'var(--surface-2)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
        <input
            type="text"
            placeholder="Buscar por concepto o folio de caja..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text)', outline: 'none', width: '100%' }}
        />
      </div>

      <div className={`${styles.tableWrapper} glass animate-fade`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Caja (Folio)</th>
              <th>Concepto</th>
              <th>Tipo</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)', fontWeight: 600 }}>{error}</td></tr>
            ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No se encontraron movimientos</td></tr>
            ) : filtered.map(m => {
              const isNegative = m.Tipo === 'salida' || Number(m.Monto) < 0;
              return (
              <tr key={m.Id}>
                <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CalendarIcon size={14} color="var(--text-muted)" />
                        {new Date(m.Fecha).toLocaleString()}
                    </div>
                </td>
                <td><span className="badge-info" style={{ fontSize: '0.7rem' }}>Caja #{m.IdApertura ?? '-'}</span></td>
                <td style={{ fontWeight: 600 }}>{m.Concepto}</td>
                <td>{renderTipo(m)}</td>
                <td style={{ textAlign: 'right', fontWeight: 800, color: isNegative ? 'var(--danger)' : '#2ecc71' }}>
                  ${Math.abs(Number(m.Monto) || 0).toFixed(2)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
