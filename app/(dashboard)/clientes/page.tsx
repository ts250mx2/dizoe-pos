'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit2, Trash2, X, Save } from 'lucide-react';
import CountryPhoneInput from '@/components/CountryPhoneInput';
import styles from './clientes.module.css';

interface Cliente {
  IdCliente: number;
  NombreCliente: string;
  Telefono: string;
  CorreoElectronico: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState<{ open: boolean; cliente: Cliente | null }>({ open: false, cliente: null });
  const [formData, setFormData] = useState({ NombreCliente: '', Telefono: '', CorreoElectronico: '' });
  const [saving, setSaving] = useState(false);

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
