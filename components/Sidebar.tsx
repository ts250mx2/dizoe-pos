'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, DollarSign,
  Users, LogOut, ChevronRight, TrendingUp,
  Sun, Moon, Tags, Settings, UserCircle,
  ChevronsLeft, ChevronsRight, BarChart2,
  CalendarDays, UserCheck, Warehouse, CalendarCog,
} from 'lucide-react';
import { useTheme }   from './ThemeProvider';
import { useSidebar } from './SidebarContext';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname          = usePathname();
  const router            = useRouter();
  const { theme, toggle: toggleTheme } = useTheme();
  const { collapsed, isAdmin, toggle: toggleSidebar } = useSidebar();

  const menuItems = [
    { name: 'POS / Venta',    icon: ShoppingCart,  path: '/' },
    { name: 'Dashboard',      icon: BarChart2,     path: '/dashboard',      adminOnly: true },
    { name: 'Agenda',         icon: CalendarDays,  path: '/agenda' },
    { name: 'Horarios y espacios', icon: CalendarCog, path: '/horarios' },
    { name: 'Clientes',       icon: UserCheck,     path: '/clientes',       adminOnly: true },
    { name: 'Caja / Cortes',  icon: TrendingUp,    path: '/cash',           adminOnly: true },
    { name: 'Movimientos',    icon: DollarSign,    path: '/movimientos',    adminOnly: true },
    { name: 'Catálogo',       icon: Package,       path: '/servicios',      adminOnly: true },
    { name: 'Inventario',     icon: Warehouse,     path: '/inventario',     adminOnly: true },
    { name: 'Categorías',     icon: Tags,          path: '/categorias',     adminOnly: true },
    { name: 'Usuarios',       icon: UserCircle,    path: '/usuarios',       adminOnly: true },
    { name: 'Configuración',  icon: Settings,      path: '/configuracion',  adminOnly: true },
  ];

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('dizoe-user');
    router.push('/login');
  };

  return (
    <>
      {/* ── Sidebar panel ── */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.hidden : ''} glass`}>
        {/* Decorative gold bar */}
        <div className={styles.goldBar} />

        {/* Nav */}
        <nav className={styles.nav}>
          {menuItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <item.icon size={19} />
                <span>{item.name}</span>
                {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.collapseBtn} onClick={toggleSidebar} title="Ocultar menú">
            <ChevronsLeft size={18} />
            <span>Ocultar menú</span>
          </button>
        </div>
      </aside>

      {/* ── Floating open button ── */}
      {collapsed && (
        <button
          className={styles.openBtn}
          onClick={toggleSidebar}
          title="Mostrar menú"
          aria-label="Abrir menú"
        >
          <ChevronsRight size={22} />
        </button>
      )}
    </>
  );
}
