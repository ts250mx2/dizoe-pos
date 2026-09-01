'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarClock, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import styles from './horarios.module.css';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
interface Config { IntervaloMinutos:number; AnticipacionMinimaHoras:number; DiasFuturos:number; ReservasPublicasActivas:number }
interface HourBlock { IdHorario:number; DiaSemana:number; HoraInicio:string; HoraFin:string; Capacidad:number }
interface Exception { IdExcepcion:number; Fecha:string; HoraInicio:string; HoraFin:string; Capacidad:number; Nota:string|null }

export default function ScheduleSettingsPage() {
  const [config,setConfig]=useState<Config>({IntervaloMinutos:30,AnticipacionMinimaHoras:2,DiasFuturos:60,ReservasPublicasActivas:1});
  const [hours,setHours]=useState<HourBlock[]>([]); const [exceptions,setExceptions]=useState<Exception[]>([]);
  const [hourForm,setHourForm]=useState({DiaSemana:1,HoraInicio:'10:00',HoraFin:'14:00',Capacidad:2});
  const [exceptionForm,setExceptionForm]=useState({Fecha:'',HoraInicio:'10:00',HoraFin:'14:00',Capacidad:0,Nota:''});
  const [message,setMessage]=useState('');

  const load=async()=>{const response=await fetch('/api/agenda/settings');const data=await response.json();if(response.ok){setConfig(data.config);setHours(data.hours||[]);setExceptions(data.exceptions||[]);}};
  useEffect(()=>{void load();},[]);
  const request=async(url:string,options:RequestInit)=>{setMessage('');const response=await fetch(url,options);const data=await response.json();if(!response.ok){setMessage(data.message||'No se pudo guardar');return false;}await load();return true;};
  const saveConfig=async(event:React.FormEvent)=>{event.preventDefault();if(await request('/api/agenda/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)}))setMessage('Configuración guardada.');};
  const addHour=async(event:React.FormEvent)=>{event.preventDefault();if(await request('/api/agenda/hours',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(hourForm)}))setHourForm({...hourForm,HoraInicio:hourForm.HoraFin});};
  const addException=async(event:React.FormEvent)=>{event.preventDefault();if(await request('/api/agenda/exceptions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(exceptionForm)}))setExceptionForm({...exceptionForm,Nota:''});};

  return <div className={styles.container}>
    <header className={styles.header}><div><span>Disponibilidad pública</span><h1>Horarios y capacidad</h1><p>Configura cuántas personas pueden atenderse simultáneamente en cada bloque.</p></div><Link href="/reservar" target="_blank"><ExternalLink size={17}/>Abrir agenda pública</Link></header>
    {message&&<div className={styles.message}>{message}</div>}
    <section className={styles.panel}><div className={styles.panelTitle}><CalendarClock/><div><h2>Reglas generales</h2><p>Controlan cómo se generan los espacios que ve el cliente.</p></div></div>
      <form className={styles.configGrid} onSubmit={saveConfig}><label>Intervalo entre horarios<select value={config.IntervaloMinutos} onChange={e=>setConfig({...config,IntervaloMinutos:Number(e.target.value)})}><option value={15}>15 minutos</option><option value={30}>30 minutos</option><option value={60}>60 minutos</option></select></label><label>Anticipación mínima<input type="number" min="0" value={config.AnticipacionMinimaHoras} onChange={e=>setConfig({...config,AnticipacionMinimaHoras:Number(e.target.value)})}/><small>horas</small></label><label>Ventana de reservación<input type="number" min="1" max="365" value={config.DiasFuturos} onChange={e=>setConfig({...config,DiasFuturos:Number(e.target.value)})}/><small>días</small></label><label className={styles.toggle}><input type="checkbox" checked={!!config.ReservasPublicasActivas} onChange={e=>setConfig({...config,ReservasPublicasActivas:e.target.checked?1:0})}/><span>Reservaciones públicas activas</span></label><button><Save size={17}/>Guardar reglas</button></form>
    </section>

    <section className={styles.panel}><div className={styles.panelTitle}><CalendarClock/><div><h2>Horario semanal</h2><p>Puedes crear varios bloques por día con distinta capacidad.</p></div></div>
      <form className={styles.inlineForm} onSubmit={addHour}><label>Día<select value={hourForm.DiaSemana} onChange={e=>setHourForm({...hourForm,DiaSemana:Number(e.target.value)})}>{DAYS.map((day,index)=><option key={day} value={index}>{day}</option>)}</select></label><label>Desde<input type="time" value={hourForm.HoraInicio} onChange={e=>setHourForm({...hourForm,HoraInicio:e.target.value})}/></label><label>Hasta<input type="time" value={hourForm.HoraFin} onChange={e=>setHourForm({...hourForm,HoraFin:e.target.value})}/></label><label>Espacios<input type="number" min="1" value={hourForm.Capacidad} onChange={e=>setHourForm({...hourForm,Capacidad:Number(e.target.value)})}/></label><button><Plus size={17}/>Agregar bloque</button></form>
      <div className={styles.dayList}>{DAYS.map((day,index)=>{const blocks=hours.filter(item=>item.DiaSemana===index);return <div className={styles.dayRow} key={day}><strong>{day}</strong><div>{blocks.length?blocks.map(block=><span className={styles.block} key={block.IdHorario}>{block.HoraInicio}–{block.HoraFin}<b>{block.Capacidad} espacios</b><button onClick={()=>request(`/api/agenda/hours?id=${block.IdHorario}`,{method:'DELETE'})} aria-label="Eliminar bloque"><Trash2 size={14}/></button></span>):<em>Cerrado</em>}</div></div>})}</div>
    </section>

    <section className={styles.panel}><div className={styles.panelTitle}><CalendarClock/><div><h2>Excepciones por fecha y hora</h2><p>Sustituyen la capacidad semanal. Usa 0 espacios para cerrar ese bloque.</p></div></div>
      <form className={styles.exceptionForm} onSubmit={addException}><label>Fecha<input type="date" value={exceptionForm.Fecha} onChange={e=>setExceptionForm({...exceptionForm,Fecha:e.target.value})} required/></label><label>Desde<input type="time" value={exceptionForm.HoraInicio} onChange={e=>setExceptionForm({...exceptionForm,HoraInicio:e.target.value})}/></label><label>Hasta<input type="time" value={exceptionForm.HoraFin} onChange={e=>setExceptionForm({...exceptionForm,HoraFin:e.target.value})}/></label><label>Espacios<input type="number" min="0" value={exceptionForm.Capacidad} onChange={e=>setExceptionForm({...exceptionForm,Capacidad:Number(e.target.value)})}/></label><label className={styles.note}>Nota<input value={exceptionForm.Nota} onChange={e=>setExceptionForm({...exceptionForm,Nota:e.target.value})} placeholder="Ej. Personal reducido"/></label><button><Plus size={17}/>Agregar excepción</button></form>
      <div className={styles.exceptionList}>{exceptions.length?exceptions.map(item=><div key={item.IdExcepcion}><strong>{new Date(`${item.Fecha}T12:00:00`).toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})}</strong><span>{item.HoraInicio}–{item.HoraFin}</span><b className={item.Capacidad===0?styles.closed:''}>{item.Capacidad===0?'Cerrado':`${item.Capacidad} espacios`}</b><em>{item.Nota||'Sin nota'}</em><button onClick={()=>request(`/api/agenda/exceptions?id=${item.IdExcepcion}`,{method:'DELETE'})}><Trash2 size={15}/></button></div>):<p className={styles.empty}>No hay excepciones registradas.</p>}</div>
    </section>
  </div>;
}
