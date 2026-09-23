'use client';

import Link from 'next/link';
import { Search, Sun, Moon, Plus } from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { Avatar } from '@/components/ui/Avatar';
import styles from './Topbar.module.css';
import { Logo } from './Logo';

interface TopbarProps {
  onSearch: () => void;
  onCreateTopic: () => void;
}

export function Topbar({ onSearch, onCreateTopic }: TopbarProps) {
  const { data, updateSettings } = useApp();
  const isDark = data.settings.theme === 'dark';

  return (
    <header className={styles.bar}>
      <Link href="/dashboard" className={styles.mobileLogo} aria-label="Docutrack dashboard">
        <Logo size={24} />
      </Link>

      <button type="button" className={styles.search} onClick={onSearch}>
        <Search size={16} aria-hidden />
        <span className={styles.searchText}>Search topics and documents</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </button>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          title={isDark ? 'Light theme' : 'Dark theme'}
        >
          {isDark ? <Sun size={17} aria-hidden /> : <Moon size={17} aria-hidden />}
        </button>

        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileOnly}`}
          onClick={onCreateTopic}
          aria-label="Create topic"
        >
          <Plus size={18} aria-hidden />
        </button>

        <Link href="/profile" className={styles.avatarLink} aria-label="Your profile">
          <Avatar name={data.profile.fullName || 'You'} src={data.profile.avatarUrl} size={28} />
        </Link>
      </div>
    </header>
  );
}
