'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock, User as UserIcon, UserPlus, Mail, X, Check } from 'lucide-react';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import styles from './agenda.module.css';

interface Cita {
  IdCita: number;
  IdCliente: number;
  NombreCliente: string;
  Telefono: string;
  Titulo: string;
  Descripcion: string;
  FechaCita: string;
  Duracion: number;
  Status: number;
}

interface Cliente {
  IdCliente: number;
  NombreCliente: string;
  Telefono: string;
  CorreoElectronico?: string;
}

const EMPTY_NEW_CLIENT = { NombreCliente: '', Telefono: '', CorreoElectronico: '' };

// Rango base del calendario de horas del día (se amplía si hay citas fuera).
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 21;

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; cita: Cita | null; date?: Date }>({ open: false, cita: null });
  const [dayView, setDayView] = useState<Date | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState(EMPTY_NEW_CLIENT);
  const [newClientError, setNewClientError] = useState('');
  const [savingClient, setSavingClient] = useState(false);
  
  const [formData, setFormData] = useState({
    Titulo: '', Descripcion: '', Fecha: '', Hora: '', Duracion: '60'
  });

  useEffect(() => {
    fetchCitas();
    fetchClientes();
  }, [currentDate]);

  const fetchCitas = async () => {
    try {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const params = new URLSearchParams({
        start: toLocalDateString(monthStart),
        end: toLocalDateString(monthEnd),
      });
      const res = await fetch(`/api/citas?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCitas(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch citas status:', res.status);
        setCitas([]);
      }
    } catch (err) { 
      console.error('Error fetching citas:', err); 
      setCitas([]);
    } finally { 
      setLoading(false); 
    }
  };

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
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleOpenModal = (cita: Cita | null = null, date?: Date, hora?: string) => {
    if (cita) {
      const d = new Date(cita.FechaCita);
      setFormData({
        Titulo: cita.Titulo,
        Descripcion: cita.Descripcion || '',
        Fecha: toLocalDateString(d),
        Hora: d.toTimeString().split(' ')[0].substring(0, 5),
        Duracion: cita.Duracion.toString()
      });
      setSelectedCliente({ IdCliente: cita.IdCliente, NombreCliente: cita.NombreCliente, Telefono: cita.Telefono });
    } else {
      setFormData({
        Titulo: '', Descripcion: '',
        Fecha: toLocalDateString(date || new Date()),
        Hora: hora || '10:00', Duracion: '60'
      });
      setSelectedCliente(null);
    }
    setSearchTerm('');
    setShowNewClient(false);
    setNewClient(EMPTY_NEW_CLIENT);
    setNewClientError('');
    setModal({ open: true, cita, date });
  };

  // Alta rápida de cliente desde el modal de cita: lo crea y lo deja
  // seleccionado para la cita que se está agendando.
  const handleCreateClient = async () => {
    if (!newClient.NombreCliente.trim()) {
      setNewClientError('El nombre del cliente es obligatorio');
      return;
    }

    setNewClientError('');
    setSavingClient(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          NombreCliente: newClient.NombreCliente.trim(),
          Telefono: newClient.Telefono.trim(),
          CorreoElectronico: newClient.CorreoElectronico.trim(),
        }),
      });
      const data = await res.json();

      if (res.ok && data.id) {
        setSelectedCliente({
          IdCliente: data.id,
          NombreCliente: newClient.NombreCliente.trim(),
          Telefono: newClient.Telefono.trim(),
          CorreoElectronico: newClient.CorreoElectronico.trim(),
        });
        setShowNewClient(false);
        setNewClient(EMPTY_NEW_CLIENT);
        setSearchTerm('');
        fetchClientes();
      } else {
        setNewClientError(data.message || 'Error al crear el cliente');
      }
    } catch {
      setNewClientError('Error de conexión al crear el cliente');
    } finally {
      setSavingClient(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCliente) return alert('Selecciona un cliente');

    const citaData = {
      IdCliente: selectedCliente.IdCliente,
      Titulo: formData.Titulo,
      Descripcion: formData.Descripcion,
      FechaCita: `${formData.Fecha}T${formData.Hora}:00`,
      Duracion: parseInt(formData.Duracion),
    };

    const method = modal.cita ? 'PUT' : 'POST';
    const url = modal.cita ? `/api/citas/${modal.cita.IdCita}` : '/api/citas';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(citaData)
    });

    if (res.ok) {
      setModal({ open: false, cita: null });
      fetchCitas();
    }
  };

  const updateStatus = async (id: number, status: number) => {
    const res = await fetch(`/api/citas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: status })
    });
    if (!res.ok) {
      alert('No se pudo actualizar el estado de la cita');
      return;
    }
    setModal({ open: false, cita: null });
    fetchCitas();
  };

  // Búsqueda por nombre, teléfono o correo electrónico.
  const filteredClientes = searchTerm
    ? clientes.filter((c) => {
        const term = searchTerm.toLowerCase();
        return (
          c.NombreCliente.toLowerCase().includes(term) ||
          (c.Telefono || '').toLowerCase().includes(term) ||
          (c.CorreoElectronico || '').toLowerCase().includes(term)
        );
      })
    : [];

  const renderCalendar = () => {
    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className={styles.dayCellEmpty}></div>);
    }
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const dayCitas = citas.filter(c => new Date(c.FechaCita).toDateString() === date.toDateString());

      cells.push(
        <div key={day} className={`${styles.dayCell} ${isToday ? styles.today : ''}`} onClick={() => setDayView(date)}>
          <span className={styles.dayNumber}>{day}</span>
          <div className={styles.dayCitas}>
            {dayCitas.map(c => (
              <div 
                key={c.IdCita} 
                className={`${styles.citaBadge} ${c.Status === 2 ? styles.completed : c.Status === 3 ? styles.cancelled : ''}`}
                onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
              >
                {c.NombreCliente.split(' ')[0]} - {new Date(c.FechaCita).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  // Calendario de horas del día seleccionado: rango base 8:00–21:00,
  // ampliado si existen citas más tempranas o más tardías.
  const renderDayView = () => {
    if (!dayView) return null;

    const dayCitas = citas
      .filter((c) => new Date(c.FechaCita).toDateString() === dayView.toDateString())
      .sort((a, b) => new Date(a.FechaCita).getTime() - new Date(b.FechaCita).getTime());

    const citaHours = dayCitas.map((c) => new Date(c.FechaCita).getHours());
    const startHour = Math.min(DAY_START_HOUR, ...(citaHours.length ? citaHours : [DAY_START_HOUR]));
    const endHour = Math.max(DAY_END_HOUR - 1, ...(citaHours.length ? citaHours : [DAY_END_HOUR - 1]));

    const hours = [];
    for (let h = startHour; h <= endHour; h++) hours.push(h);

    const dateTitle = dayView.toLocaleDateString('es', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
      <div className={styles.modalOverlay} onClick={() => setDayView(null)}>
        <div className={`${styles.dayModal} glass animate-scale`} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3 style={{ textTransform: 'capitalize' }}>{dateTitle}</h3>
            <div className={styles.dayModalActions}>
              <button type="button" className={styles.dayNewBtn} onClick={() => handleOpenModal(null, dayView)}>
                <Plus size={16} /> Nueva Cita
              </button>
              <button type="button" onClick={() => setDayView(null)}><X size={20} /></button>
            </div>
          </div>

          <div className={styles.dayHours}>
            {hours.map((h) => {
              const hourCitas = dayCitas.filter((c) => new Date(c.FechaCita).getHours() === h);
              const hourLabel = `${String(h).padStart(2, '0')}:00`;

              return (
                <div key={h} className={styles.hourRow}>
                  <div className={styles.hourLabel}>{hourLabel}</div>
                  <div
                    className={styles.hourSlot}
                    onClick={() => handleOpenModal(null, dayView, hourLabel)}
                    title={`Agendar a las ${hourLabel}`}
                  >
                    {hourCitas.map((c) => (
                      <div
                        key={c.IdCita}
                        className={`${styles.dayCita} ${c.Status === 2 ? styles.completed : ''}`}
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
                      >
                        <span className={styles.dayCitaTime}>
                          {new Date(c.FechaCita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{c.Duracion} min
                        </span>
                        <span className={styles.dayCitaName}>{c.NombreCliente}</span>
                        {c.Titulo && <span className={styles.dayCitaTitle}>{c.Titulo}</span>}
                      </div>
                    ))}
                    {hourCitas.length === 0 && <span className={styles.hourEmpty}>+ Agendar</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <CalendarDays size={32} color="var(--gold)" />
          <div>
            <h1>Agenda de Citas</h1>
            <p className={styles.subtitle}>Organiza los servicios de tu estética</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => handleOpenModal()}>
          <Plus size={20} /> Nueva Cita
        </button>
      </header>

      <div className={`${styles.calendarWrap} glass animate-fade`}>
        <div className={styles.calendarHeader}>
          <div className={styles.monthName}>
            {currentDate.toLocaleString('es', { month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
          <div className={styles.navBtns}>
            <button onClick={handlePrevMonth}><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className={styles.todayBtn}>HOY</button>
            <button onClick={handleNextMonth}><ChevronRight size={20} /></button>
          </div>
        </div>
        
        <div className={styles.weekDays}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className={styles.daysGrid}>
          {renderCalendar()}
        </div>
      </div>

      {renderDayView()}

      {modal.open && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSave} className={`${styles.modal} glass animate-scale`}>
            <div className={styles.modalHeader}>
              <h3>{modal.cita ? 'Detalles de la Cita' : 'Agendar Cita'}</h3>
              <button type="button" onClick={() => setModal({ open: false, cita: null })}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label><UserIcon size={16} /> Cliente</label>
                {selectedCliente ? (
                  <div className={styles.selectedCliente}>
                    <span>
                      {selectedCliente.NombreCliente}
                      {selectedCliente.Telefono && (
                        <small className={styles.selectedClienteDetail}> · {selectedCliente.Telefono}</small>
                      )}
                    </span>
                    <button type="button" onClick={() => setSelectedCliente(null)}><X size={14} /></button>
                  </div>
                ) : showNewClient ? (
                  <div className={styles.newClientForm}>
                    <div className={styles.newClientTitle}>
                      <UserPlus size={15} /> Nuevo cliente
                    </div>
                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      value={newClient.NombreCliente}
                      onChange={(e) => setNewClient({ ...newClient, NombreCliente: e.target.value })}
                      autoFocus
                    />
                    <div className={styles.row}>
                      <CountryPhoneInput
                        value={newClient.Telefono}
                        onChange={(value) => setNewClient({ ...newClient, Telefono: value })}
                      />
                      <div className={styles.newClientField}>
                        <Mail size={14} />
                        <input
                          type="email"
                          placeholder="Correo electrónico"
                          value={newClient.CorreoElectronico}
                          onChange={(e) => setNewClient({ ...newClient, CorreoElectronico: e.target.value })}
                        />
                      </div>
                    </div>
                    {newClientError && <div className={styles.newClientError}>{newClientError}</div>}
                    <div className={styles.newClientActions}>
                      <button
                        type="button"
                        className={styles.newClientCancel}
                        onClick={() => { setShowNewClient(false); setNewClient(EMPTY_NEW_CLIENT); setNewClientError(''); }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={styles.newClientSave}
                        onClick={handleCreateClient}
                        disabled={savingClient}
                      >
                        <Check size={15} /> {savingClient ? 'Creando...' : 'Crear cliente'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.searchWrap}>
                    <input
                      type="text"
                      placeholder="Buscar por nombre, teléfono o correo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <div className={styles.dropdown}>
                        {filteredClientes.map(c => (
                          <div key={c.IdCliente} className={styles.option} onClick={() => { setSelectedCliente(c); setSearchTerm(''); }}>
                            {c.NombreCliente}
                            {(c.Telefono || c.CorreoElectronico) && (
                              <small className={styles.optionDetail}>
                                {[c.Telefono, c.CorreoElectronico].filter(Boolean).join(' · ')}
                              </small>
                            )}
                          </div>
                        ))}
                        {filteredClientes.length === 0 && (
                          <div className={styles.optionEmpty}>Sin resultados</div>
                        )}
                      </div>
                    )}
                    <button
                      type="button"
                      className={styles.newClientBtn}
                      onClick={() => {
                        setShowNewClient(true);
                        setNewClient({ ...EMPTY_NEW_CLIENT, NombreCliente: searchTerm.trim() });
                        setSearchTerm('');
                      }}
                    >
                      <UserPlus size={15} /> Dar de alta nuevo cliente
                    </button>
                  </div>
                )}
              </div>
              
              <div className={styles.inputGroup}>
                <label>Servicio / Título</label>
                <input 
                  type="text" 
                  value={formData.Titulo} 
                  onChange={(e) => setFormData({...formData, Titulo: e.target.value})} 
                  placeholder="Corte de cabello, Barba, etc." 
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Fecha</label>
                  <input type="date" value={formData.Fecha} onChange={(e) => setFormData({...formData, Fecha: e.target.value})} required />
                </div>
                <div className={styles.inputGroup}>
                  <label><Clock size={16} /> Hora</label>
                  <input type="time" value={formData.Hora} onChange={(e) => setFormData({...formData, Hora: e.target.value})} required />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Notas</label>
                <textarea 
                  value={formData.Descripcion} 
                  onChange={(e) => setFormData({...formData, Descripcion: e.target.value})} 
                  rows={2}
                />
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              {modal.cita && (
                <div className={styles.statusActions}>
                  {modal.cita.Status === 1 && (
                    <button type="button" className={styles.completeBtn} onClick={() => updateStatus(modal.cita!.IdCita, 2)}>
                      <Check size={16} /> Marcar Completada
                    </button>
                  )}
                  <button type="button" className={styles.cancelBtn} onClick={() => updateStatus(modal.cita!.IdCita, 3)}>
                    Cancelar Cita
                  </button>
                </div>
              )}
              <button type="submit" className={styles.saveBtn}>Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
