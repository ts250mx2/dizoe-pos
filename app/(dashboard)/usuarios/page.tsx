'use client';

import { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, X, Save, Shield, ShieldCheck, UserCog } from 'lucide-react';
import styles from '../clientes/clientes.module.css';

const PUESTOS: Record<number, string> = {
  1: 'Administrador',
  2: 'Cajero',
  3: 'Estilista',
};

interface AppUser {
  IdUsuario: number;
  Usuario: string;
  IdPuesto: number;
  Login: string;
  Status: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });
  const [formData, setFormData] = useState<any>({
    Usuario: '', IdPuesto: 3, Login: '', Password: '', Status: 1
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch users status:', res.status);
        setUsers([]);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = modal.user ? 'PUT' : 'POST';
    const url = modal.user ? `/api/users/${modal.user.IdUsuario}` : '/api/users';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setModal({ open: false, user: null });
      fetchUsers();
    } else {
      const d = await res.json();
      alert(d.message || 'Error');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
    else {
        const d = await res.json();
        alert(d.message || 'Error');
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '100%' }}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <UserCog size={32} color="var(--gold)" />
          <div>
            <h1>Usuarios y Personal</h1>
            <p className={styles.subtitle}>Gestiona los accesos y roles del equipo</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => { 
            setFormData({ Usuario: '', IdPuesto: 3, Login: '', Password: '', Status: 1 }); 
            setModal({ open: true, user: null }); 
        }}>
          <Plus size={20} /> Nuevo Usuario
        </button>
      </header>

      <div className={`${styles.tableWrapper} glass animate-fade`}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Login / Usuario</th>
              <th>Puesto / Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.IdUsuario}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} color="var(--gold)" />
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.Usuario}</span>
                  </div>
                </td>
                <td><code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: '4px' }}>{u.Login}</code></td>
                <td>
                    <span className={u.IdPuesto === 1 ? 'badge-warn' : 'badge-info'} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}>
                        {u.IdPuesto === 1 ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {PUESTOS[u.IdPuesto]}
                    </span>
                </td>
                <td><span className={u.Status ? 'badge-success' : 'badge-danger'} style={{ fontSize: '0.7rem' }}>{u.Status ? 'Activo' : 'Inactivo'}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <div className={styles.actions}>
                    <button onClick={() => { 
                        setFormData({ ...u, Password: '' }); 
                        setModal({ open: true, user: u }); 
                    }} className={styles.editBtn}><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(u.IdUsuario)} className={styles.deleteBtn} disabled={u.IdUsuario === 1}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className={styles.modalOverlay}>
          <form onSubmit={handleSave} className={`${styles.modal} glass animate-scale`}>
            <div className={styles.modalHeader}>
              <h3>{modal.user ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button type="button" onClick={() => setModal({ open: false, user: null })}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <input type="text" value={formData.Usuario} onChange={(e) => setFormData({ ...formData, Usuario: e.target.value })} required />
              </div>

              <div className="grid-responsive" style={{ gap: '15px' }}>
                <div className={styles.inputGroup}>
                    <label>Login / Nickname</label>
                    <input type="text" value={formData.Login} onChange={(e) => setFormData({ ...formData, Login: e.target.value })} required />
                </div>
                <div className={styles.inputGroup}>
                    <label>Puesto / Rol</label>
                    <select value={formData.IdPuesto} onChange={(e) => setFormData({ ...formData, IdPuesto: parseInt(e.target.value) })} required>
                        {Object.entries(PUESTOS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>{modal.user ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'}</label>
                <input type="password" value={formData.Password} onChange={(e) => setFormData({ ...formData, Password: e.target.value })} required={!modal.user} />
              </div>
            </div>
            <div className={styles.modalFooter}>
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
