'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Search,
  Settings,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { recentTopics, topicStats } from '@/lib/selectors';
import { accentOf, topicIcon } from '@/lib/appearance';
import { Avatar } from '@/components/ui/Avatar';
import { cx } from '@/lib/utils';
import styles from './Sidebar.module.css';
import { Logo } from './Logo';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/topics', label: 'Topics', icon: FolderKanban },
  { href: '/search', label: 'Search', icon: Search },
];

export function Sidebar({ onCreateTopic }: { onCreateTopic: () => void }) {
  const { data } = useApp();
  const pathname = usePathname();
  const topics = recentTopics(data, 5);

  return (
    <nav className={styles.sidebar} aria-label="Main">
      <div className={styles.head}>
        <Link href="/dashboard" className={styles.logoLink} aria-label="Docutrack dashboard">
          <Logo />
        </Link>
      </div>

      <button type="button" className={styles.createButton} onClick={onCreateTopic}>
        <Plus size={16} aria-hidden />
        New topic
      </button>

      <ul className={styles.nav}>
        {NAV.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cx(styles.navItem, active && styles.active)}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon size={17} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Recent topics</h2>
          <Link href="/topics" className={styles.sectionLink}>
            All
            <ChevronRight size={13} aria-hidden />
          </Link>
        </div>
        <ul className={styles.topicList}>
          {topics.length === 0 ? (
            <li className={styles.noTopics}>No topics yet</li>
          ) : (
            topics.map((topic) => {
              const Icon = topicIcon(topic.icon);
              const accent = accentOf(topic.accent);
              const stats = topicStats(data, topic.id);
              const active = pathname === `/topics/${topic.id}`;
              return (
                <li key={topic.id}>
                  <Link
                    href={`/topics/${topic.id}`}
                    className={cx(styles.topicItem, active && styles.active)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span
                      className={styles.topicIcon}
                      style={{ background: accent.soft, color: accent.text, borderColor: accent.border }}
                      aria-hidden
                    >
                      <Icon size={13} />
                    </span>
                    <span className={styles.topicName}>{topic.name}</span>
                    <span className={styles.topicCount} aria-label={`${stats.documentCount} documents`}>
                      {stats.documentCount}
                    </span>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className={styles.foot}>
        <Link
          href="/profile"
          className={cx(styles.profile, pathname === '/profile' && styles.active)}
          aria-current={pathname === '/profile' ? 'page' : undefined}
        >
          <Avatar name={data.profile.fullName || 'You'} src={data.profile.avatarUrl} size={30} />
          <span className={styles.profileText}>
            <span className={styles.profileName}>{data.profile.fullName || 'Your profile'}</span>
            <span className={styles.profileRole}>{data.profile.jobTitle || 'View profile'}</span>
          </span>
        </Link>
        <Link
          href="/settings"
          className={cx(styles.settings, pathname === '/settings' && styles.active)}
          aria-label="Settings"
          aria-current={pathname === '/settings' ? 'page' : undefined}
        >
          <Settings size={17} aria-hidden />
        </Link>
      </div>
    </nav>
  );
}
