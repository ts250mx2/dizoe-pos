'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Printer, CheckCircle2, X } from 'lucide-react';
import styles from './cash.module.css';

export default function CashPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [movements, setMovements] = useState<any[]>([]);
  const [movementModal, setMovementModal] = useState<{ type: 'entrada' | 'salida' } | null>(null);
  const [movData, setMovData] = useState({ amount: '', concept: '' });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/cash/status');
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Error al consultar el estado de la caja');
        setStatus({ isOpen: false });
        return;
      }

      setStatus(data);
      if (data.isOpen) {
        fetchMovements(data.session.IdApertura);
      }
    } catch {
      alert('Error de conexión al consultar la caja');
      setStatus({ isOpen: false });
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (idApertura: number) => {
    const res = await fetch(`/api/movements?idApertura=${idApertura}`);
    const data = await res.json();
    setMovements(Array.isArray(data) ? data : []);
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/cash/list');
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch cash/list status:', res.status);
        setHistory([]);
      }
    } catch (err) {
      console.error('Error fetching cash/list:', err);
      setHistory([]);
    }
  };

  const handleOpen = async () => {
    if (!amount) return;
    const res = await fetch('/api/cash/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'open', amount: parseFloat(amount) })
    });
    if (res.ok) {
      fetchStatus();
    } else {
      alert('No se pudo abrir la caja, intenta de nuevo');
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movData.amount || !movData.concept) return;

    const res = await fetch('/api/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...movData,
        amount: parseFloat(movData.amount),
        type: movementModal?.type,
        idApertura: status.session.IdApertura
      })
    });

    if (res.ok) {
      setMovementModal(null);
      setMovData({ amount: '', concept: '' });
      fetchMovements(status.session.IdApertura);
    } else {
      alert('No se pudo registrar el movimiento, intenta de nuevo');
    }
  };

  const handleClose = async () => {
    if (!confirm('¿Estás seguro de cerrar la caja?')) return;

    const totals = {
      efectivo: status.session.Efectivo || 0,
      tarjeta: status.session.Tarjeta || 0,
      total: status.session.TotalVentas || 0,
      cancelados: status.session.Cancelados || 0
    };
    
    const res = await fetch('/api/cash/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'close', 
        id: status.session.IdApertura,
        totals 
      })
    });

    if (res.ok) {
      alert('Corte generado con éxito');
      fetchStatus();
      fetchHistory();
    } else {
      alert('No se pudo cerrar la caja, intenta de nuevo');
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <TrendingUp size={32} color="var(--gold)" />
          <div>
            <h1>Control de Caja</h1>
            <p className={styles.subtitle}>Gestiona tus aperturas y cortes diarios</p>
          </div>
        </div>
      </header>

      {!status.isOpen ? (
        <div className={`${styles.card} glass animate-scale`}>
          <div className={styles.formIcon}><CheckCircle2 size={48} color="var(--gold)" /></div>
          <h2>Apertura de Caja</h2>
          <p>Ingresa el fondo inicial para comenzar</p>
          <div className={styles.inputGroup}>
            <label>Fondo de Caja ($)</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
          <button className={styles.mainBtn} onClick={handleOpen}>
            Abrir Caja
          </button>
        </div>
      ) : (
        <div className={styles.dashboard}>
          <div className={styles.stats}>
            <div className={`${styles.statCard} glass`}>
              <span className={styles.statLabel}>Fondo Inicial</span>
              <span className={styles.statValue}>${Number(status.session.FondoCaja || 0).toFixed(2)}</span>
            </div>
            <div className={`${styles.statCard} glass`}>
              <span className={styles.statLabel}>Ventas Hoy</span>
              <span className={styles.statValue}>${Number(status.session.TotalVentas || 0).toFixed(2)}</span>
            </div>
            <div className={`${styles.statCard} glass`}>
              <span className={styles.statLabel}>Efectivo en Caja</span>
              <span className={styles.statValue}>${(
                Number(status.session.FondoCaja || 0) +
                Number(status.session.Efectivo || 0) +
                movements.reduce((acc, m) => acc + Number(m.Efectivo || 0), 0)
              ).toFixed(2)}</span>
            </div>
          </div>

          <div className={styles.mainGrid}>
            <div className={`${styles.section} glass`}>
              <div className={styles.sectionHeader}>
                <h3>Movimientos</h3>
                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => setMovementModal({ type: 'entrada' })}>
                    <ArrowUpRight size={18} /> Entrada
                  </button>
                  <button className={`${styles.actionBtn} ${styles.btnDanger}`} onClick={() => setMovementModal({ type: 'salida' })}>
                    <ArrowDownRight size={18} /> Salida
                  </button>
                </div>
              </div>
              <div className={styles.movTable}>
                {movements.length === 0 ? (
                  <p className={styles.emptyMsg}>No hay movimientos</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Concepto</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m, idx) => (
                        <tr key={idx}>
                          <td>{new Date(m.FechaRetiro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>{m.Concepto}</td>
                          <td className={m.Efectivo >= 0 ? styles.positive : styles.negative}>
                            ${Number(Math.abs(m.Efectivo)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className={`${styles.section} glass`}>
              <h3>Resumen de Corte</h3>
              <div className={styles.corteDetails}>
                <div className={styles.corteRow}>
                  <span>Efectivo</span>
                  <span>${Number(status.session.Efectivo || 0).toFixed(2)}</span>
                </div>
                <div className={styles.corteRow}>
                  <span>Tarjeta</span>
                  <span>${Number(status.session.Tarjeta || 0).toFixed(2)}</span>
                </div>
                <div className={styles.corteRow}>
                  <span>Transferencia</span>
                  <span>${Number(status.session.Transferencia || 0).toFixed(2)}</span>
                </div>
                <div className={styles.corteRow}>
                  <span>Movimientos</span>
                  <span>${Number(movements.reduce((acc, m) => acc + Number(m.Efectivo), 0)).toFixed(2)}</span>
                </div>
                <hr className={styles.divider} />
                <div className={`${styles.corteRow} ${styles.totalRow}`}>
                  <span>Total Ventas</span>
                  <span>${Number(status.session.TotalVentas || 0).toFixed(2)}</span>
                </div>
              </div>
              <div className={styles.footerBtns}>
                <button className={styles.closeCajaBtn} onClick={handleClose}>Cerrar Caja y Generar Corte</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {movementModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass animate-scale`}>
            <div className={styles.modalHeader}>
              <h3>Registrar {movementModal.type === 'entrada' ? 'Entrada' : 'Salida'}</h3>
              <button onClick={() => setMovementModal(null)}><X size={20} /></button>
            </div>
            <form onSubmit={handleMovement} className={styles.movForm}>
              <div className={styles.inputGroup}>
                <label>Monto ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={movData.amount}
                  onChange={(e) => setMovData({...movData, amount: e.target.value})}
                  required 
                  autoFocus 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Concepto</label>
                <input 
                  type="text" 
                  value={movData.concept}
                  onChange={(e) => setMovData({...movData, concept: e.target.value})}
                  placeholder="Ej: Pago de material..." 
                  required 
                />
              </div>
              <button type="submit" className={movementModal.type === 'entrada' ? styles.mainBtn : `${styles.mainBtn} ${styles.btnDanger}`}>
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
