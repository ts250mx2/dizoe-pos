'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, ShoppingBag, ReceiptText, Banknote, 
  CreditCard, Smartphone, XCircle, BarChart2, 
  Calendar, Layers, Package, Clock, ChevronRight,
  ArrowUpRight, ArrowDownRight, Scissors
} from 'lucide-react';
import styles from './dashboard.module.css';

// ─── Types ───────────────────────────────────────────────────────────────────
type Period   = 'today' | 'yesterday' | 'week' | 'month';
type GroupBy  = 'categoria' | 'producto';

interface KPI {
  totalVentas: number;
  numTransacciones: number;
  ticketPromedio: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  canceladas: number;
}

interface TrendPoint { fecha: string; total: number; transacciones: number; }
interface BreakItem  { nombre: string; total: number; cantidad: number; }
interface HeatCell   { diaSemana: number; hora: number; total: number; transacciones: number; }

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n || 0);

const fmtShort = (n: number) => {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
};

const DAYS_ES  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const HOURS    = Array.from({ length: 24 }, (_, i) => i);

// ─── Mini SVG Line Chart ──────────────────────────────────────────────────────
function LineChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) return <div className={styles.chartEmpty}>Sin datos para el período</div>;

  const W = 780, H = 200, PAD = { t: 16, r: 20, b: 40, l: 60 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const maxVal = Math.max(...data.map(d => d.total), 1);
  const toX    = (i: number) => PAD.l + (i / Math.max(data.length - 1, 1)) * innerW;
  const toY    = (v: number) => PAD.t + innerH - (v / maxVal) * innerH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.total)}`).join(' ');
  const areaPoints = [
    `${PAD.l},${PAD.t + innerH}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.total)}`),
    `${toX(data.length - 1)},${PAD.t + innerH}`,
  ].join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ v: maxVal * r, y: toY(maxVal * r) }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--gold)"     stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--gold)"     stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y-grid */}
      {yTicks.map(({ v, y }) => (
        <g key={v}>
          <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="var(--border)" strokeWidth="1" />
          <text x={PAD.l - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">{fmtShort(v)}</text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#lineGrad)" />

      {/* Line */}
      <polyline points={points} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots + labels */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(d.total)} r="4" fill="var(--gold)" stroke="var(--surface)" strokeWidth="2" />
          <text
            x={toX(i)} y={PAD.t + innerH + 18}
            textAnchor="middle" fontSize="10" fill="var(--text-muted)"
          >
            {new Date(d.fecha + 'T12:00:00').toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── Mini Horizontal Bar Chart ───────────────────────────────────────────────
function BarChart({ data }: { data: BreakItem[] }) {
  if (data.length === 0) return <div className={styles.chartEmpty}>Sin datos para el período</div>;
  const max = Math.max(...data.map(d => d.total), 1);
  const COLORS = ['var(--gold)', '#d4af37', '#e2c272', '#b8860b', '#ffd700',
                  '#a78bfa', '#34d399', '#fb923c', '#60a5fa', '#f472b6'];
  return (
    <div className={styles.barList}>
      {data.map((item, i) => (
        <div key={i} className={styles.barRow}>
          <div className={styles.barLabel} title={item.nombre}>{item.nombre}</div>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${(item.total / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
          <div className={styles.barValue}>{fmt(item.total)}</div>
          <div className={styles.barCount}>{item.cantidad} serv</div>
        </div>
      ))}
    </div>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────
function Heatmap({ data }: { data: HeatCell[] }) {
  const map: Record<string, number> = {};
  let maxVal = 0;
  data.forEach(c => {
    const key = `${c.diaSemana}-${c.hora}`;
    map[key] = c.total;
    if (c.total > maxVal) maxVal = c.total;
  });

  if (maxVal === 0) return <div className={styles.chartEmpty}>Sin datos para el período</div>;

  return (
    <div className={styles.heatmapWrap}>
      <div className={styles.heatmapGrid}>
        <div className={styles.heatCorner} />
        {HOURS.map(h => (
          <div key={h} className={styles.heatHour}>{h}h</div>
        ))}

        {DAYS_ES.map((day, d) => (
          <>
            <div key={`day-${d}`} className={styles.heatDay}>{day}</div>
            {HOURS.map(h => {
              const val = map[`${d}-${h}`] || 0;
              const intensity = maxVal > 0 ? val / maxVal : 0;
              return (
                <div
                  key={`${d}-${h}`}
                  className={styles.heatCell}
                  title={`${day} ${h}:00 — ${fmt(val)}`}
                  style={{
                    background: intensity === 0
                      ? 'var(--surface-2)'
                      : `rgba(201,168,76,${0.12 + intensity * 0.88})`,
                  }}
                />
              );
            })}
          </>
        ))}
      </div>
      <div className={styles.heatLegend}>
        <span>Menos ventas</span>
        <div className={styles.heatLegendBar} />
        <span>Más ventas</span>
      </div>
    </div>
  );
}

// ─── Helpers: compute date strings for each preset ────────────────────────
function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}
function datesForPeriod(p: Period): [string, string] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  switch (p) {
    case 'today':     return [toISO(today), toISO(today)];
    case 'yesterday': {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return [toISO(y), toISO(y)];
    }
    case 'week': {
      const w = new Date(today); w.setDate(w.getDate() - 6);
      return [toISO(w), toISO(today)];
    }
    case 'month': {
      const m = new Date(today); m.setDate(m.getDate() - 29);
      return [toISO(m), toISO(today)];
    }
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [groupBy,  setGroupBy]  = useState<GroupBy>('categoria');
  const [dateFrom, setDateFrom] = useState(() => datesForPeriod('today')[0]);
  const [dateTo,   setDateTo]   = useState(() => datesForPeriod('today')[1]);
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const fetchData = useCallback(async (g: GroupBy, from: string, to: string) => {
    if (!from || !to) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ groupBy: g, dateFrom: from, dateTo: to });
      const res = await fetch(`/api/dashboard/sales?${params}`);
      if (!res.ok) throw new Error('Error al cargar datos');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(groupBy, dateFrom, dateTo);
  }, [groupBy, dateFrom, dateTo, fetchData]);

  const handlePeriod = (p: Period) => {
    const [from, to] = datesForPeriod(p);
    setDateFrom(from);
    setDateTo(to);
  };

  const activePeriod: Period | null = (['today','yesterday','week','month'] as Period[]).find(p => {
    const [f, t] = datesForPeriod(p);
    return f === dateFrom && f !== undefined && t === dateTo;
  }) ?? null;

  const periodLabel: Record<Period, string> = {
    today:     'Hoy',
    yesterday: 'Ayer',
    week:      'Últimos 7 días',
    month:     'Últimos 30 días',
  };

  const activeLabel = activePeriod
    ? periodLabel[activePeriod]
    : `${dateFrom} → ${dateTo}`;

  const kpi: KPI = data?.kpi ?? {
    totalVentas: 0, numTransacciones: 0, ticketPromedio: 0,
    efectivo: 0, tarjeta: 0, transferencia: 0, canceladas: 0,
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <BarChart2 size={32} color="var(--gold)" />
          <div>
            <h1>Dashboard Analítico</h1>
            <p className={styles.subtitle}>Análisis de rendimiento y KPIs — {activeLabel}</p>
          </div>
        </div>

        <div className={styles.filterRow}>
          {(['today','yesterday','week','month'] as Period[]).map(p => (
            <button
              key={p}
              className={`${styles.periodBtn} ${activePeriod === p ? styles.periodActive : ''}`}
              onClick={() => handlePeriod(p)}
            >
              <Calendar size={14} /> {p === 'today' ? 'Hoy' : p === 'yesterday' ? 'Ayer' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}

          <div className={styles.dateDivider} />

          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={styles.dateInput} />
          <span className={styles.dateSep}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={styles.dateInput} />
        </div>
      </header>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} glass ${styles.kpiMain}`}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)' }}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Ventas Totales</span>
            <span className={styles.kpiValue}>{loading ? '—' : fmt(kpi.totalVentas)}</span>
            <span className={styles.kpiSub}>{activeLabel}</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} glass`}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(52,152,219,0.12)', color: '#3498db' }}>
            <ReceiptText size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Transacciones</span>
            <span className={styles.kpiValue}>{loading ? '—' : kpi.numTransacciones}</span>
            <span className={styles.kpiSub}>servicios cobrados</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} glass`}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
            <ShoppingBag size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Ticket Promedio</span>
            <span className={styles.kpiValue}>{loading ? '—' : fmt(kpi.ticketPromedio)}</span>
            <span className={styles.kpiSub}>por cliente</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} glass`}>
          <div className={styles.kpiIcon} style={{ background: 'rgba(231,76,60,0.10)', color: 'var(--danger)' }}>
            <XCircle size={22} />
          </div>
          <div className={styles.kpiInfo}>
            <span className={styles.kpiLabel}>Cancelaciones</span>
            <span className={styles.kpiValue}>{loading ? '—' : kpi.canceladas}</span>
            <span className={styles.kpiSub}>en el período</span>
          </div>
        </div>
      </div>

      <div className={styles.payGrid}>
        <div className={`${styles.payCard} glass`}>
          <Banknote size={18} color="var(--gold)" />
          <span className={styles.payLabel}>Efectivo</span>
          <span className={styles.payVal}>{loading ? '—' : fmt(kpi.efectivo)}</span>
        </div>
        <div className={`${styles.payCard} glass`}>
          <CreditCard size={18} color="#3498db" />
          <span className={styles.payLabel}>Tarjeta</span>
          <span className={styles.payVal}>{loading ? '—' : fmt(kpi.tarjeta)}</span>
        </div>
        <div className={`${styles.payCard} glass`}>
          <Smartphone size={18} color="#2ecc71" />
          <span className={styles.payLabel}>Transferencia</span>
          <span className={styles.payVal}>{loading ? '—' : fmt(kpi.transferencia)}</span>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={`${styles.chartCard} glass`}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Tendencia de Ventas</h3>
              <p className={styles.chartSub}>Ventas diarias en el período</p>
            </div>
          </div>
          <div className={styles.chartBody}>
            {loading ? <div className={styles.chartEmpty}>Cargando...</div> : <LineChart data={data?.trend ?? []} />}
          </div>
        </div>

        <div className={`${styles.chartCard} glass`}>
          <div className={styles.chartHeader}>
            <div>
              <h3 className={styles.chartTitle}>Ranking por {groupBy === 'categoria' ? 'Categoría' : 'Servicio'}</h3>
              <p className={styles.chartSub}>Desglose de participación</p>
            </div>
            <div className={styles.groupBtns}>
              <button className={`${styles.groupBtn} ${groupBy === 'categoria' ? styles.groupActive : ''}`} onClick={() => setGroupBy('categoria')}>
                <Layers size={14} /> Cat.
              </button>
              <button className={`${styles.groupBtn} ${groupBy === 'producto' ? styles.groupActive : ''}`} onClick={() => setGroupBy('producto')}>
                <Package size={14} /> Serv.
              </button>
            </div>
          </div>
          <div className={styles.chartBody}>
            {loading ? <div className={styles.chartEmpty}>Cargando...</div> : <BarChart data={data?.breakdown ?? []} />}
          </div>
        </div>
      </div>

      <div className={`${styles.chartCard} glass`}>
        <div className={styles.chartHeader}>
          <div>
            <h3 className={styles.chartTitle}>Mapa de Calor: Horarios de Mayor Afluencia</h3>
            <p className={styles.chartSub}>Concentración de ventas por día y hora</p>
          </div>
        </div>
        <div className={styles.chartBody}>
          {loading ? <div className={styles.chartEmpty}>Cargando...</div> : <Heatmap data={data?.heatmap ?? []} />}
        </div>
      </div>
    </div>
  );
}
