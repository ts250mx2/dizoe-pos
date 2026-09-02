'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, Edit2, History, Plus, ReceiptText, Save, Search, ShoppingBag, Trash2, UserCheck, X } from 'lucide-react';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import styles from './clientes.module.css';

interface Cliente {
  IdCliente: number;
  NombreCliente: string;
  Telefono: string;
  CorreoElectronico: string;
}

interface ClientSale { IdVenta: number; Folio: string; Total: number; FechaVenta: string; Cancelada: number; Detalle: string | null; }
interface ClientAppointment { IdCita: number; Titulo: string; Descripcion: string | null; FechaCita: string; Duracion: number; Status: number; Origen: string; }
interface ClientHistory {
  client: Cliente & { FechaRegistro: string };
  summary: { purchases: number; appointments: number; totalSpent: number };
  sales: ClientSale[];
  appointments: ClientAppointment[];
}

const APPOINTMENT_STATUS: Record<number, { label: string; className: string }> = {
  1: { label: 'Pendiente', className: 'statusPending' },
  2: { label: 'Completada', className: 'statusCompleted' },
  3: { label: 'Cancelada', className: 'statusCancelled' },
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null });
  const [formData, setFormData] = useState({ NombreCliente: '', Telefono: '', CorreoElectronico: '' });
  const [saving, setSaving] = useState(false);
  const [historyClient, setHistoryClient] = useState<Cliente | null>(null);
  const [historyData, setHistoryData] = useState<ClientHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch clientes status:', res.status);
        setClientes([]);
      }
    } catch (err) {
      console.error('Error fetching clientes:', err);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.NombreCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Telefono.includes(searchTerm)
  );

  const handleOpenModal = (cliente: Cliente | null = null) => {
    if (cliente) {
      setFormData({ 
        NombreCliente: cliente.NombreCliente, 
        Telefono: cliente.Telefono || '', 
        CorreoElectronico: cliente.CorreoElectronico || '' 
      });
    } else {
      setFormData({ NombreCliente: '', Telefono: '', CorreoElectronico: '' });
    }
    setModal({ open: true, cliente });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = modal.cliente ? 'PUT' : 'POST';
      const url = modal.cliente ? `/api/clientes/${modal.cliente.IdCliente}` : '/api/clientes';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setModal({ open: false, cliente: null });
        fetchClientes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (res.ok) fetchClientes();
    } catch (err) {
      console.error(err);
    }
  };

  const openHistory = async (client: Cliente) => {
    setHistoryClient(client); setHistoryData(null); setHistoryError(''); setHistoryLoading(true);
    try {
      const response = await fetch(`/api/clientes/${client.IdCliente}`);
      const result = await response.json();
      if (response.ok) setHistoryData(result);
      else setHistoryError(result.message || 'No se pudo cargar el historial');
    } catch { setHistoryError('No se pudo conectar para cargar el historial'); }
    finally { setHistoryLoading(false); }
  };

  const historyEvents = historyData ? [
    ...historyData.sales.map((sale) => ({ type: 'sale' as const, date: sale.FechaVenta, data: sale })),
    ...historyData.appointments.map((appointment) => ({ type: 'appointment' as const, date: appointment.FechaCita, data: appointment })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando clientes...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <UserCheck size={32} color="var(--gold)" />
          <div>
            <h1>Catálogo de Clientes</h1>
            <p className={styles.subtitle}>Gestiona la información de tus clientes</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={20} /> Nuevo Cliente
        </button>
      </header>

      <div className={`${styles.searchBox} glass`}>
        <Search size={18} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o teléfono..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={`${styles.tableWrapper} glass animate-fade`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              filteredClientes.map(c => (
                <tr key={c.IdCliente}>
                  <td>
                    <div className={styles.clientName}>
                      <div className={styles.avatar}>{c.NombreCliente.charAt(0)}</div>
                      {c.NombreCliente}
                    </div>
                  </td>
                  <td>{c.Telefono || '-'}</td>
                  <td>{c.CorreoElectronico || '-'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className={styles.actions}>
                      <button onClick={() => void openHistory(c)} className={styles.historyBtn} title="Ver historial" aria-label={`Ver historial de ${c.NombreCliente}`}><History size={16} /></button>
                      <button onClick={() => handleOpenModal(c)} className={styles.editBtn} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(c.IdCliente)} className={styles.deleteBtn} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {historyClient && (
        <div className={styles.historyOverlay} onClick={() => setHistoryClient(null)}>
          <aside className={styles.historyDrawer} role="dialog" aria-modal="true" aria-labelledby="client-history-title" onClick={(event) => event.stopPropagation()}>
            <div className={styles.historyHeader}>
              <div className={styles.historyIdentity}>
                <div className={styles.historyAvatar}>{historyClient.NombreCliente.charAt(0)}</div>
                <div><span>Historial del cliente</span><h2 id="client-history-title">{historyClient.NombreCliente}</h2><p>{[historyClient.Telefono, historyClient.CorreoElectronico].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p></div>
              </div>
              <button type="button" className={styles.historyClose} onClick={() => setHistoryClient(null)} aria-label="Cerrar historial"><X size={20} /></button>
            </div>
            <div className={styles.historyContent}>
              {historyLoading ? <div className={styles.historyState}><History size={28} /> Cargando historial...</div>
                : historyError ? <div className={`${styles.historyState} ${styles.historyError}`}>{historyError}</div>
                  : historyData && <>
                    <section className={styles.historySummary} aria-label="Resumen del cliente">
                      <article><ShoppingBag size={18} /><span>Compras</span><strong>{historyData.summary.purchases}</strong></article>
                      <article><CalendarDays size={18} /><span>Citas</span><strong>{historyData.summary.appointments}</strong></article>
                      <article><ReceiptText size={18} /><span>Total gastado</span><strong>{Number(historyData.summary.totalSpent).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></article>
                    </section>
                    <div className={styles.timelineHeader}><h3>Actividad</h3><span>{historyEvents.length} registros</span></div>
                    {historyEvents.length === 0 ? <div className={styles.historyEmpty}><History size={30} /><strong>Aún no hay actividad</strong><span>Las compras y citas de este cliente aparecerán aquí.</span></div>
                      : <div className={styles.timeline}>{historyEvents.map((event) => {
                        if (event.type === 'sale') {
                          const sale = event.data;
                          return <article className={styles.timelineItem} key={`sale-${sale.IdVenta}`}><div className={`${styles.timelineIcon} ${styles.saleIcon}`}><ShoppingBag size={16} /></div><div className={styles.timelineCard}><div className={styles.eventTop}><div><span>Compra · Folio {sale.Folio || sale.IdVenta}</span><strong>{Number(sale.Total).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></div>{Number(sale.Cancelada) === 1 && <span className={styles.statusCancelled}>Cancelada</span>}</div><p>{sale.Detalle || 'Venta sin detalle disponible'}</p><time>{new Date(sale.FechaVenta).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</time></div></article>;
                        }
                        const appointment = event.data;
                        const status = APPOINTMENT_STATUS[appointment.Status] || APPOINTMENT_STATUS[1];
                        return <article className={styles.timelineItem} key={`appointment-${appointment.IdCita}`}><div className={`${styles.timelineIcon} ${styles.appointmentIcon}`}><CalendarDays size={16} /></div><div className={styles.timelineCard}><div className={styles.eventTop}><div><span>Cita</span><strong>{appointment.Titulo || 'Servicio sin título'}</strong></div><span className={styles[status.className]}>{status.label}</span></div><p>{appointment.Descripcion || `${appointment.Duracion || 60} minutos · ${appointment.Origen === 'PUBLICO' ? 'Reserva en línea' : 'Agendada en salón'}`}</p><time>{new Date(appointment.FechaCita).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</time></div></article>;
                      })}</div>}
                  </>}
            </div>
          </aside>
        </div>
      )}

      {modal.open && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSave} className={`${styles.modal} glass animate-scale`}>
            <div className={styles.modalHeader}>
              <h3>{modal.cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
              <button type="button" onClick={() => setModal({ open: false, cliente: null })}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  value={formData.NombreCliente}
                  onChange={(e) => setFormData({ ...formData, NombreCliente: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Teléfono</label>
                <CountryPhoneInput
                  value={formData.Telefono}
                  onChange={(value) => setFormData({ ...formData, Telefono: value })}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  value={formData.CorreoElectronico}
                  onChange={(e) => setFormData({ ...formData, CorreoElectronico: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setModal({ open: false, cliente: null })}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
