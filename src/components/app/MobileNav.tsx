'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Plus, Search, User } from 'lucide-react';
import { cx } from '@/lib/utils';
import styles from './MobileNav.module.css';

interface MobileNavProps {
  onCreateTopic: () => void;
  onSearch: () => void;
}

export function MobileNav({ onCreateTopic, onSearch }: MobileNavProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <nav className={styles.bar} aria-label="Main">
      <Link
        href="/dashboard"
        className={cx(styles.item, isActive('/dashboard') && styles.active)}
        aria-current={isActive('/dashboard') ? 'page' : undefined}
      >
        <LayoutDashboard size={19} aria-hidden />
        <span>Home</span>
      </Link>
      <Link
        href="/topics"
        className={cx(styles.item, isActive('/topics') && styles.active)}
        aria-current={isActive('/topics') ? 'page' : undefined}
      >
        <FolderKanban size={19} aria-hidden />
        <span>Topics</span>
      </Link>

      <button type="button" className={styles.create} onClick={onCreateTopic} aria-label="Create topic">
        <Plus size={20} aria-hidden />
      </button>

      <button type="button" className={styles.item} onClick={onSearch}>
        <Search size={19} aria-hidden />
        <span>Search</span>
      </button>
      <Link
        href="/profile"
        className={cx(styles.item, isActive('/profile') && styles.active)}
        aria-current={isActive('/profile') ? 'page' : undefined}
      >
        <User size={19} aria-hidden />
        <span>You</span>
      </Link>
    </nav>
  );
}
