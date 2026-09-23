'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { TopicFormDialog } from '@/components/topics/TopicFormDialog';
import { SkeletonCard, Skeleton } from '@/components/ui/Skeleton';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { GlobalSearch } from './GlobalSearch';
import styles from './AppShell.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { ready, storageNotice, dismissStorageNotice } = useApp();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const openCreate = useCallback(() => setCreateOpen(true), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!ready) {
    return (
      <div className={styles.shell}>
        <div className={styles.bootSidebar} aria-hidden>
          <Skeleton width="60%" height={20} />
          <Skeleton width="100%" height={34} radius="8px" />
          <Skeleton width="80%" height={13} />
          <Skeleton width="70%" height={13} />
          <Skeleton width="76%" height={13} />
        </div>
        <div className={styles.main}>
          <div className={styles.content}>
            <p className="srOnly" role="status">
              Loading your workspace
            </p>
            <Skeleton width="220px" height={26} />
            <div className={styles.bootGrid}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <a className="skipLink" href="#main-content">
        Skip to content
      </a>
      <Sidebar onCreateTopic={openCreate} />

      <div className={styles.main}>
        <Topbar onSearch={openSearch} onCreateTopic={openCreate} />

        {storageNotice ? (
          <div className={styles.notice} role="status">
            <AlertTriangle size={15} aria-hidden />
            <p>{storageNotice}</p>
            <button type="button" onClick={dismissStorageNotice} aria-label="Dismiss notice">
              <X size={14} aria-hidden />
            </button>
          </div>
        ) : null}

        <main className={styles.content} id="main-content">
          {children}
        </main>
      </div>

      <MobileNav onCreateTopic={openCreate} onSearch={openSearch} />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      <TopicFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(topic) => router.push(`/topics/${topic.id}`)}
      />
    </div>
  );
}
