'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { CalendarDays, MessageCircle, Scissors, Send, Sparkles, X } from 'lucide-react';
import styles from './StylistAgent.module.css';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }
const WELCOME: ChatMessage = { role: 'assistant', content: '¡Hola! Soy Zoe, tu estilista virtual de DIZOE. Puedo mostrarte servicios y precios, recomendarte una opción o ayudarte a reservar. ¿Qué te gustaría hacer?' };

export default function StylistAgent() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages, sending]);

  const sendMessage = async (content: string) => {
    const clean = content.trim();
    if (!clean || sending) return;
    const nextMessages = [...messages, { role: 'user' as const, content: clean }];
    setMessages(nextMessages); setDraft(''); setSending(true);
    try {
      const response = await fetch('/api/stylist-agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: nextMessages }) });
      const result = await response.json();
      setMessages((current) => [...current, { role: 'assistant', content: response.ok ? result.reply : result.message || 'No pude responder en este momento.' }]);
    } catch { setMessages((current) => [...current, { role: 'assistant', content: 'No pude conectarme. Intenta nuevamente en un momento.' }]); }
    finally { setSending(false); }
  };

  const handleSubmit = (event: FormEvent) => { event.preventDefault(); void sendMessage(draft); };
  return <div className={styles.agentRoot}>
    {open && <section className={styles.chatPanel} role="dialog" aria-modal="false" aria-labelledby="stylist-agent-title">
      <header className={styles.chatHeader}><div className={styles.stylistPortrait}><Scissors size={21} /></div><div><span><i /> Estilista virtual</span><h2 id="stylist-agent-title">Zoe</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar asistente"><X size={19} /></button></header>
      <div className={styles.messages} ref={scrollRef} aria-live="polite">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`${styles.message} ${message.role === 'user' ? styles.userMessage : styles.agentMessage}`}>{message.role === 'assistant' && <Sparkles size={13} />}<p>{message.content}</p></div>)}
        {sending && <div className={`${styles.message} ${styles.agentMessage} ${styles.typing}`}><span /><span /><span /></div>}
      </div>
      {messages.length === 1 && <div className={styles.suggestions}><button type="button" onClick={() => void sendMessage('Muéstrame los servicios y precios')}><Sparkles size={14} /> Ver precios</button><button type="button" onClick={() => void sendMessage('Quiero agendar una cita')}><CalendarDays size={14} /> Agendar cita</button></div>}
      <form className={styles.composer} onSubmit={handleSubmit}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escribe tu mensaje..." maxLength={1200} disabled={sending} aria-label="Mensaje para Zoe" /><button type="submit" disabled={sending || !draft.trim()} aria-label="Enviar mensaje"><Send size={18} /></button></form>
      <p className={styles.disclaimer}>Los precios y horarios se consultan en tiempo real.</p>
    </section>}
    <button type="button" className={styles.launcher} onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? <X size={20} /> : <MessageCircle size={21} />}<span><small>¿Te ayudo?</small>Zoe · estilista virtual</span></button>
  </div>;
}
