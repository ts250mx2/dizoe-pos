'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, CheckCircle2, ChevronRight, Clock3, LoaderCircle, Mail, Sparkles, User } from 'lucide-react';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import styles from './reservar.module.css';

interface Service { IdProducto: number; Producto: string; Precio1: number; DuracionMinutos: number; Categoria: string }
interface Slot { time: string; capacity: number; occupied: number; available: number; status: 'available' | 'occupied' }
interface Config { DiasFuturos: number; ReservasPublicasActivas: number }

const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function PublicBookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [time, setTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '', correo: '' });
  const [lookingUpClient, setLookingUpClient] = useState(false);
  const [clientFound, setClientFound] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<{ service: string; date: string; time: string; duration: number } | null>(null);

  useEffect(() => {
    fetch('/api/public/booking').then(async (response) => {
      const data = await response.json();
      if (response.ok) { setServices(data.services || []); setConfig(data.config); }
    });
  }, []);

  useEffect(() => {
    setTime('');
    if (!serviceId || !date) { setSlots([]); return; }
    setLoadingSlots(true);
    fetch(`/api/public/booking/availability?fecha=${date}&servicio=${serviceId}`)
      .then(async (response) => {
        const data = await response.json();
        setSlots(response.ok ? data.slots || [] : []);
      })
      .finally(() => setLoadingSlots(false));
  }, [date, serviceId]);

  useEffect(() => {
    const normalizedPhone = form.telefono.replace(/\D/g, '');
    if (normalizedPhone.length < 7) {
      setClientFound(null);
      setLookingUpClient(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLookingUpClient(true);
      try {
        const response = await fetch(`/api/public/booking/client?telefono=${encodeURIComponent(normalizedPhone)}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const data = await response.json();
        if (response.ok && data.found) {
          setClientFound(true);
          setForm((current) => current.telefono.replace(/\D/g, '') === normalizedPhone
            ? { ...current, nombre: data.nombre || '', correo: data.correo || '' }
            : current);
        } else if (response.ok) setClientFound(false);
      } catch (lookupError) {
        if ((lookupError as Error).name !== 'AbortError') setClientFound(null);
      } finally {
        if (!controller.signal.aborted) setLookingUpClient(false);
      }
    }, 450);

    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [form.telefono]);

  const selectedService = services.find((service) => service.IdProducto === Number(serviceId));
  const maxDate = useMemo(() => {
    const result = new Date(); result.setDate(result.getDate() + Number(config?.DiasFuturos || 60)); return dateString(result);
  }, [config]);

  const reserve = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.telefono.replace(/\D/g, '').length < 7 || !form.nombre.trim()) {
      setError('Completa tu teléfono y nombre antes de confirmar.');
      return;
    }
    setSending(true); setError('');
    const response = await fetch('/api/public/booking/reserve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, idProducto: Number(serviceId), fecha: date, hora: time }),
    });
    const data = await response.json();
    if (response.ok) setConfirmed(data.booking);
    else {
      setError(data.message || 'No se pudo confirmar la cita');
      if (response.status === 409) {
        const availability = await fetch(`/api/public/booking/availability?fecha=${date}&servicio=${serviceId}`).then((item) => item.json());
        setSlots(availability.slots || []); setTime('');
      }
    }
    setSending(false);
  };

  if (confirmed) return (
    <main className={styles.page}><section className={styles.successCard}>
      <div className={styles.successIcon}><Check size={30} /></div>
      <span className={styles.eyebrow}>Cita confirmada</span><h1>Nos vemos pronto</h1>
      <p>Tu espacio en DIZOE quedó reservado.</p>
      <dl><div><dt>Servicio</dt><dd>{confirmed.service}</dd></div><div><dt>Fecha</dt><dd>{new Date(`${confirmed.date}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</dd></div><div><dt>Hora</dt><dd>{confirmed.time} · {confirmed.duration} min</dd></div></dl>
      <button onClick={() => { setConfirmed(null); setTime(''); setDate(''); }}>Agendar otra cita</button>
    </section></main>
  );

  return (
    <main className={styles.page}>
      <header className={styles.brand}><img src="/branding/dizoe-logo.png" alt="DIZOE Beauty Salon & Nails" /><div><span>Reservaciones en línea</span><strong>DIZOE</strong></div></header>
      <section className={styles.hero}><span className={styles.eyebrow}>Tu momento, a tu hora</span><h1>Agenda tu próxima visita</h1><p>Elige el servicio y consulta los espacios disponibles. Los horarios ocupados no muestran información de otras personas.</p></section>

      {!config?.ReservasPublicasActivas ? <section className={styles.closed}><Clock3 size={28} /><h2>Reservaciones pausadas</h2><p>Comunícate directamente con DIZOE para agendar.</p></section> : (
        <div className={styles.bookingGrid}>
          <section className={styles.steps}>
            <article className={styles.step}><div className={styles.stepTitle}><span>1</span><div><h2>Escribe tu teléfono</h2><p>Si ya eres cliente, completaremos tus datos automáticamente.</p></div></div>
              <div className={styles.contactGrid}>
                <CountryPhoneInput value={form.telefono} onChange={(value) => { setForm({ ...form, telefono: value }); setClientFound(null); }} tone="light" autoFocus required />
                <label><User size={17} /><input autoComplete="name" placeholder="Nombre completo" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label>
                <label><Mail size={17} /><input type="email" autoComplete="email" placeholder="Correo (opcional)" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} /></label>
              </div>
              {lookingUpClient && <div className={styles.lookupStatus}><LoaderCircle size={15} className={styles.spin} /> Buscando tu registro…</div>}
              {!lookingUpClient && clientFound === true && <div className={`${styles.lookupStatus} ${styles.found}`}><CheckCircle2 size={15} /> Cliente encontrado. Verifica que tus datos sean correctos.</div>}
              {!lookingUpClient && clientFound === false && <div className={styles.lookupStatus}>No encontramos ese teléfono. Completa tu nombre para continuar.</div>}
            </article>

            <article className={styles.step}><div className={styles.stepTitle}><span>2</span><div><h2>Elige tu servicio</h2><p>La duración se considera al buscar espacio.</p></div></div>
              <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}><option value="">Selecciona un servicio</option>{services.map((service) => <option key={service.IdProducto} value={service.IdProducto}>{service.Producto} · {service.DuracionMinutos} min · ${Number(service.Precio1).toFixed(2)}</option>)}</select>
              {selectedService && <div className={styles.serviceNote}><Sparkles size={17} /><span>{selectedService.Categoria}</span><strong>{selectedService.DuracionMinutos} min</strong></div>}
            </article>

            <article className={styles.step}><div className={styles.stepTitle}><span>3</span><div><h2>Selecciona la fecha</h2><p>Mostraremos la capacidad real del día.</p></div></div>
              <label className={styles.dateField}><CalendarDays size={18} /><input type="date" min={dateString(new Date())} max={maxDate} value={date} onChange={(event) => setDate(event.target.value)} disabled={!serviceId} /></label>
            </article>

            <article className={styles.step}><div className={styles.stepTitle}><span>4</span><div><h2>Elige un horario</h2><p>“Ocupado” significa que todos los lugares están tomados.</p></div></div>
              {loadingSlots ? <div className={styles.loading}>Consultando espacios…</div> : serviceId && date && slots.length === 0 ? <div className={styles.noSlots}>No hay horarios abiertos para esta fecha.</div> : (
                <div className={styles.slotGrid}>{slots.map((slot) => <button key={slot.time} disabled={slot.status === 'occupied'} className={`${styles.slot} ${time === slot.time ? styles.selectedSlot : ''} ${slot.status === 'occupied' ? styles.occupied : ''}`} onClick={() => setTime(slot.time)}><strong>{slot.time}</strong><span>{slot.status === 'occupied' ? 'Ocupado' : slot.available === 1 ? '1 espacio' : `${slot.available} espacios`}</span></button>)}</div>
              )}
            </article>
          </section>

          <aside className={styles.summary}>
            <span className={styles.eyebrow}>Resumen</span><h2>Tu cita</h2>
            <div className={styles.summaryLine}><User size={17} /><span>{form.nombre || form.telefono || 'Escribe tu teléfono'}</span></div>
            <div className={styles.summaryLine}><Sparkles size={17} /><span>{selectedService?.Producto || 'Selecciona un servicio'}</span></div>
            <div className={styles.summaryLine}><CalendarDays size={17} /><span>{date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : 'Selecciona una fecha'}</span></div>
            <div className={styles.summaryLine}><Clock3 size={17} /><span>{time || 'Selecciona un horario'}</span></div>
            {time && <form onSubmit={reserve} className={styles.clientForm}>{error && <div className={styles.error}>{error}</div>}<button disabled={sending || !form.nombre.trim() || form.telefono.replace(/\D/g, '').length < 7}>{sending ? 'Confirmando…' : <>Confirmar cita <ChevronRight size={18} /></>}</button></form>}
          </aside>
        </div>
      )}
    </main>
  );
}
