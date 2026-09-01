'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Layout, List, Palette, Image as ImageIcon, Type } from 'lucide-react';
import LogoDropZone from '@/components/LogoDropZone';
import styles from './configuracion.module.css';

export default function ConfiguracionPage() {
  const [config, setConfig] = useState({
    Header1: '', Header2: '', Header3: '', Header4: '', Header5: '',
    Footer1: '', Footer2: '', Footer3: '',
    PrintKitchenDefault: 0, RequireCustomerName: 1,
    AppTitle: '', LogoPath: '',
    PrimaryColor: '#c9a84c', PrimaryHover: '#a8863a', AccentColor: '#e2c272'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Al soltar un logo se sube de inmediato y LogoPath queda apuntando al
  // archivo subido; falta dar "Guardar Cambios" para persistirlo en la BD.
  const handleLogoChange = async (dataUrl: string | null) => {
    setLogoError('');

    if (!dataUrl) {
      setConfig((prev) => ({ ...prev, LogoPath: '' }));
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoBase64: dataUrl }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setConfig((prev) => ({ ...prev, LogoPath: data.path }));
      } else {
        setLogoError(data.message || 'Error al subir el logo');
      }
    } catch {
      setLogoError('Error de conexión al subir el logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const res = await fetch('/api/config/ticket');
    const data = await res.json();
    setConfig(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/config/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      alert('Configuración guardada correctamente');
      // Apply colors immediately
      document.documentElement.style.setProperty('--gold', config.PrimaryColor);
      document.documentElement.style.setProperty('--gold-deep', config.PrimaryHover);
      document.documentElement.style.setProperty('--gold-light', config.AccentColor);
      document.documentElement.style.setProperty('--primary', config.PrimaryColor);
      document.documentElement.style.setProperty('--primary-hover', config.PrimaryHover);
    }
    setSaving(false);
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Settings size={32} color="var(--gold)" />
          <div>
            <h1>Configuración General</h1>
            <p className={styles.subtitle}>Personaliza tu sistema, ticket y apariencia</p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSave} className={styles.formGrid}>
        {/* Identidad y Colores */}
        <div className={`${styles.section} glass`}>
          <div className={styles.sectionTitle}>
            <Palette size={20} />
            <h2>Identidad y Apariencia</h2>
          </div>
          <div className={styles.inputs}>
            <div className={styles.inputGroup}>
              <label><Type size={16} /> Título del Sistema</label>
              <input 
                type="text" 
                value={config.AppTitle} 
                onChange={(e) => setConfig({...config, AppTitle: e.target.value})}
                placeholder="Nombre de tu negocio..."
              />
            </div>
            <div className={styles.inputGroup}>
              <label><ImageIcon size={16} /> Logo</label>
              <LogoDropZone
                value={config.LogoPath || null}
                onChange={handleLogoChange}
                onError={setLogoError}
              />
              {uploadingLogo && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Subiendo logo...
                </p>
              )}
              {logoError && (
                <p style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.35rem' }}>
                  {logoError}
                </p>
              )}
            </div>
            <div className={styles.inputGroup}>
              <label><ImageIcon size={16} /> Ruta del Logo (URL)</label>
              <input
                type="text"
                value={config.LogoPath}
                onChange={(e) => setConfig({...config, LogoPath: e.target.value})}
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
            
            <div className={styles.colorGrid}>
              <div className={styles.inputGroup}>
                <label>Color Primario (Oro)</label>
                <div className={styles.colorPicker}>
                  <input 
                    type="color" 
                    value={config.PrimaryColor} 
                    onChange={(e) => setConfig({...config, PrimaryColor: e.target.value})}
                  />
                  <span>{config.PrimaryColor}</span>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Color Hover</label>
                <div className={styles.colorPicker}>
                  <input 
                    type="color" 
                    value={config.PrimaryHover} 
                    onChange={(e) => setConfig({...config, PrimaryHover: e.target.value})}
                  />
                  <span>{config.PrimaryHover}</span>
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label>Color Acento</label>
                <div className={styles.colorPicker}>
                  <input 
                    type="color" 
                    value={config.AccentColor} 
                    onChange={(e) => setConfig({...config, AccentColor: e.target.value})}
                  />
                  <span>{config.AccentColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración del Ticket */}
        <div className={`${styles.section} glass`}>
          <div className={styles.sectionTitle}>
            <Layout size={20} />
            <h2>Encabezado del Ticket</h2>
          </div>
          <div className={styles.inputs}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={styles.inputGroup}>
                <label>Línea {i}</label>
                <input 
                  type="text" 
                  value={(config as any)[`Header${i}`] || ''} 
                  onChange={(e) => setConfig({...config, [`Header${i}`]: e.target.value})}
                  placeholder={`Texto ${i}...`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className={`${styles.section} glass`}>
          <div className={styles.sectionTitle}>
            <List size={20} />
            <h2>Pie de Página del Ticket</h2>
          </div>
          <div className={styles.inputs}>
            {[1, 2, 3].map(i => (
              <div key={i} className={styles.inputGroup}>
                <label>Línea {i}</label>
                <input 
                  type="text" 
                  value={(config as any)[`Footer${i}`] || ''} 
                  onChange={(e) => setConfig({...config, [`Footer${i}`]: e.target.value})}
                  placeholder={`Texto ${i}...`}
                />
              </div>
            ))}
          </div>
          
          <div className={styles.preview}>
            <h3>Vista Previa Ticket</h3>
            <div className={styles.ticketMockup}>
              <div className={styles.mockHeader}>
                {config.LogoPath && <img src={config.LogoPath} alt="Logo" style={{ width: 40, marginBottom: 8 }} />}
                {config.Header1 && <div>{config.Header1}</div>}
                {config.Header2 && <div>{config.Header2}</div>}
              </div>
              <div className={styles.mockDivider}></div>
              <div className={styles.mockBody}>--------------------------<br/>SERVICIO 1      $150.00<br/>--------------------------</div>
              <div className={styles.mockDivider}></div>
              <div className={styles.mockFooter}>
                {config.Footer1 && <div>{config.Footer1}</div>}
                {config.Footer2 && <div>{config.Footer2}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerActions}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            <Save size={18} /> {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
