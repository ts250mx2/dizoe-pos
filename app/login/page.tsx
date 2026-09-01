'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, LockKeyhole, UserRound } from 'lucide-react';
import styles from './login.module.css';

const INSTAGRAM_URL = 'https://www.instagram.com/dizoe.salon/';

function InstagramMark({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.7" r="1" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'No se pudo iniciar sesión');
        return;
      }
      localStorage.setItem('dizoe-user', JSON.stringify(data.user));
      router.push('/');
    } catch {
      setError('No fue posible conectar con el sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/branding/dizoe-interior-hero.webp"
        alt="Interior de DIZOE Beauty Salon & Nails"
        className={styles.backdrop}
      />
      <div className={styles.tint} />
      <div className={styles.grain} />

      <header className={styles.topbar}>
        <div className={styles.brandLockup}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/branding/dizoe-logo.png" alt="DIZOE" />
          <span>Beauty Salon &amp; Nails</span>
        </div>

        <nav aria-label="Enlaces principales">
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={styles.instagramLink}>
            <InstagramMark />
            <span>@dizoe.salon</span>
          </a>
          <Link href="/reservar" className={styles.bookTop}>
            <CalendarDays size={17} />
            Agenda tu cita
          </Link>
        </nav>
      </header>

      <section className={styles.stage}>
        <div className={styles.editorial}>
          <span className={styles.verticalText}>HAIR · NAILS · BEAUTY</span>
          <div className={styles.copy}>
            <p className={styles.eyebrow}><span /> Tu belleza, tu momento</p>
            <h1>Haz espacio<br />para sentirte<br /><em>increíble.</em></h1>
            <p className={styles.intro}>
              Belleza cuidada, atención cercana y detalles pensados para que salgas sintiéndote tú.
            </p>
            <div className={styles.services} aria-label="Servicios">
              <span>Cabello</span><i />
              <span>Uñas</span><i />
              <span>Beauty</span><i />
              <span>Detalles</span>
            </div>
          </div>
          <div className={styles.monogram} aria-hidden="true">D</div>
        </div>

        <aside className={styles.accessPanel}>
          <div className={styles.panelHead}>
            <span>Acceso al sistema</span>
            <strong>Bienvenida</strong>
            <p>Administra el día de DIZOE.</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.field}>
              <span>Usuario</span>
              <div className={styles.inputWrap}>
                <UserRound size={18} />
                <input
                  type="text"
                  placeholder="Escribe tu usuario"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>Contraseña</span>
              <div className={styles.inputWrap}>
                <LockKeyhole size={18} />
                <input
                  type="password"
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error && <div className={styles.error} role="alert">{error}</div>}

            <button type="submit" className={styles.loginButton} disabled={loading}>
              <span>{loading ? 'Ingresando…' : 'Entrar al panel'}</span>
              <ArrowRight size={19} />
            </button>
          </form>

          <div className={styles.panelDivider}><span>o</span></div>

          <Link href="/reservar" className={styles.clientButton}>
            <CalendarDays size={18} />
            <span><small>¿Vienes como cliente?</small>Reservar una cita</span>
            <ArrowRight size={18} />
          </Link>

          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className={styles.mobileInstagram}>
            <InstagramMark size={16} /> Síguenos en @dizoe.salon
          </a>
        </aside>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} DIZOE</span>
        <span>Beauty Salon &amp; Nails · México</span>
      </footer>
    </main>
  );
}
