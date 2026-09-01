'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, ArrowRight } from 'lucide-react';
import styles from './login.module.css';

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
    <main className={styles.container}>
      <section className={`${styles.card} glass animate-scale`}>
        <div className={styles.brandPanel}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/dizoe-logo.png"
            alt="DIZOE Beauty Salon & Nails"
            className={styles.logo}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.eyebrow}>Acceso administrativo</span>
            <h1>Bienvenida a DIZOE</h1>
            <p>Ingresa para administrar ventas, citas, clientes y servicios.</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <label className={styles.field}>
              <span>Usuario</span>
              <div className={styles.inputGroup}>
                <User size={18} className={styles.icon} />
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
              <div className={styles.inputGroup}>
                <Lock size={18} className={styles.icon} />
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

            <button type="submit" className={styles.loginBtn} disabled={loading}>
              {loading ? 'Ingresando…' : <>Ingresar <ArrowRight size={18} /></>}
            </button>
          </form>

          <Link href="/reservar" className={styles.bookingLink}>
            ¿Eres cliente? Agenda tu cita en línea
          </Link>

          <div className={styles.footer}>
            © {new Date().getFullYear()} DIZOE · Beauty Salon & Nails
          </div>
        </div>
      </section>
    </main>
  );
}
