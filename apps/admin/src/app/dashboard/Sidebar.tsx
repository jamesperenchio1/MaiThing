'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Building2,
  ClipboardList,
  Gavel,
  LayoutDashboard,
  Menu,
  Package,
  Users,
  X,
} from 'lucide-react';
import styles from './admin.module.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/merchants', label: 'Merchants', icon: Building2 },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/listings', label: 'Listings', icon: Package },
  { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { href: '/dashboard/disputes', label: 'Disputes', icon: Gavel },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>MaiThing Admin</div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen ? (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} aria-hidden="true" />
      ) : null}
    </>
  );
}
