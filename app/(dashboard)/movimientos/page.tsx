'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowLeftRight, ArrowUpRight, Calendar as CalendarIcon, Download, Search, ShoppingBag, Wallet } from 'lucide-react';
import styles from './movimientos.module.css';

interface Movement {
  Id: string;
  IdApertura: number | null;
  Tipo: 'apertura' | 'venta' | 'entrada' | 'salida';
  Concepto: string;
  Monto: number;
  Fecha: string;
}

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = { day: 'Día', week: 'Semana', month: 'Mes' };
const TIPO_LABELS: Record<Movement['Tipo'], { label: string; badge: string }> = {
  apertura: { label: 'Apertura', badge: 'badge-info' },
  venta: { label: 'Venta', badge: 'badge-success' },
  entrada: { label: 'Entrada', badge: 'badge-success' },
  salida: { label: 'Salida', badge: 'badge-danger' },
};

function getPeriodRange(period: Period, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'week') start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  else if (period === 'month') start.setDate(1);

  const end = new Date(start);
  if (period === 'day') end.setDate(end.getDate() + 1);
  if (period === 'week') end.setDate(end.getDate() + 7);
  if (period === 'month') end.setMonth(end.getMonth() + 1);
  return { start, end };
}

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState<Period>('day');

  useEffect(() => { void fetchMovements(); }, []);

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/movements/history');
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        setError(data?.message || 'Error al consultar el historial de movimientos');
        setMovements([]);
      } else setMovements(data);
    } catch {
      setError('Error de conexión al consultar el historial');
      setMovements([]);
    } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const { start, end } = getPeriodRange(period);
    return movements.filter((movement) => {
      const date = new Date(movement.Fecha);
      const matchesPeriod = date >= start && date < end;
      const matchesSearch = !normalizedSearch
        || (movement.Concepto || '').toLowerCase().includes(normalizedSearch)
        || String(movement.IdApertura ?? '').includes(normalizedSearch);
      return matchesPeriod && matchesSearch;
    });
  }, [movements, period, searchTerm]);

  const balance = filtered.reduce((total, movement) => total + Number(movement.Monto || 0), 0);

  const exportToExcel = () => {
    const rows = filtered.map((movement) => {
      const date = new Date(movement.Fecha);
      return [
        date.toLocaleDateString('es-MX'),
        date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        movement.IdApertura ?? '', movement.Concepto,
        TIPO_LABELS[movement.Tipo]?.label || movement.Tipo,
        Number(movement.Monto || 0).toFixed(2),
      ];
    });
    const csv = [['Fecha', 'Hora', 'Folio de caja', 'Concepto', 'Tipo', 'Monto'], ...rows]
      .map((row) => row.map(escapeCsv).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `movimientos-${period}-${new Date().toLocaleDateString('sv-SE')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const renderTipo = (movement: Movement) => {
    const tipo = TIPO_LABELS[movement.Tipo] || TIPO_LABELS.entrada;
    const isNegative = movement.Tipo === 'salida' || Number(movement.Monto) < 0;
    return (
      <span className={tipo.badge}>
        {movement.Tipo === 'apertura' ? <Wallet size={12} />
          : movement.Tipo === 'venta' ? <ShoppingBag size={12} />
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
          <div><h1>Historial de Movimientos</h1><p>Aperturas, ventas y entradas/salidas de efectivo</p></div>
        </div>
      </header>

      <section className={styles.toolbar} aria-label="Filtros de movimientos">
        <div className={styles.periodSelector}>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((option) => (
            <button type="button" key={option} className={period === option ? styles.periodActive : ''} onClick={() => setPeriod(option)} aria-pressed={period === option}>
              {PERIOD_LABELS[option]}
            </button>
          ))}
        </div>
        <label className={styles.searchBox}>
          <Search size={18} />
          <input type="search" placeholder="Buscar concepto o folio..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
        </label>
        <div className={styles.resultMeta} aria-live="polite">
          <span>{filtered.length} movimientos</span>
          <strong className={balance < 0 ? styles.negative : ''}>{balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong>
        </div>
        <button type="button" className={styles.exportBtn} onClick={exportToExcel} disabled={filtered.length === 0}>
          <Download size={18} /> Exportar a Excel
        </button>
      </section>

      <div className={`${styles.tableWrapper} glass animate-fade`}>
        <table className={styles.table}>
          <thead><tr><th>Fecha y Hora</th><th>Caja (Folio)</th><th>Concepto</th><th>Tipo</th><th className={styles.amount}>Monto</th></tr></thead>
          <tbody>
            {error ? <tr><td colSpan={5} className={styles.error}>{error}</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={5} className={styles.empty}>No hay movimientos en este periodo</td></tr>
                : filtered.map((movement) => {
                  const isNegative = movement.Tipo === 'salida' || Number(movement.Monto) < 0;
                  return (
                    <tr key={movement.Id}>
                      <td><div className={styles.dateCell}><CalendarIcon size={14} />{new Date(movement.Fecha).toLocaleString('es-MX')}</div></td>
                      <td><span className="badge-info">Caja #{movement.IdApertura ?? '-'}</span></td>
                      <td className={styles.concept}>{movement.Concepto}</td>
                      <td>{renderTipo(movement)}</td>
                      <td className={`${styles.amount} ${isNegative ? styles.negative : styles.positive}`}>${Math.abs(Number(movement.Monto) || 0).toFixed(2)}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
