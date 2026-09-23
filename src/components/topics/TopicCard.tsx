'use client';

import Link from 'next/link';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Sparkles,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import type { Topic } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { topicStats } from '@/lib/selectors';
import { accentOf, topicIcon } from '@/lib/appearance';
import { Menu } from '@/components/ui/Menu';
import { cx, formatRelative, pluralize } from '@/lib/utils';
import styles from './TopicCard.module.css';

interface TopicCardProps {
  topic: Topic;
  view?: 'grid' | 'list';
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
  onToggleArchive: (topic: Topic) => void;
}

export function TopicCard({ topic, view = 'grid', onEdit, onDelete, onToggleArchive }: TopicCardProps) {
  const { data } = useApp();
  const stats = topicStats(data, topic.id);
  const Icon = topicIcon(topic.icon);
  const accent = accentOf(topic.accent);

  return (
    <article className={cx(styles.card, view === 'list' && styles.listCard, topic.archived && styles.archived)}>
      <div className={styles.head}>
        <span
          className={styles.icon}
          style={{ background: accent.soft, color: accent.text, borderColor: accent.border }}
          aria-hidden
        >
          <Icon size={17} />
        </span>

        <div className={styles.headText}>
          <h3 className={styles.name}>
            <Link href={`/topics/${topic.id}`} className={styles.link}>
              {topic.name}
            </Link>
          </h3>
          {topic.description ? <p className={styles.description}>{topic.description}</p> : null}
        </div>

        <Menu
          className={styles.menu}
          label={`Actions for ${topic.name}`}
          trigger={<MoreHorizontal size={17} aria-hidden />}
          items={[
            { label: 'Edit topic', icon: Pencil, onSelect: () => onEdit(topic) },
            {
              label: topic.archived ? 'Unarchive' : 'Archive',
              icon: topic.archived ? ArchiveRestore : Archive,
              onSelect: () => onToggleArchive(topic),
            },
            {
              label: 'Delete topic',
              icon: Trash2,
              tone: 'danger',
              separated: true,
              onSelect: () => onDelete(topic),
            },
          ]}
        />
      </div>

      {stats.typePreview.length ? (
        <p className={styles.types}>
          <FileText size={12} aria-hidden />
          {stats.typePreview.join(' · ')}
        </p>
      ) : stats.documentCount === 0 ? (
        <p className={styles.types}>No documents yet</p>
      ) : null}

      <footer className={styles.footer}>
        <span className={styles.metric}>{pluralize(stats.documentCount, 'document')}</span>
        <span className={styles.dot} aria-hidden>
          ·
        </span>
        <span className={styles.metric}>Updated {formatRelative(stats.lastActivity)}</span>

        <span className={styles.badges}>
          {stats.processingCount > 0 ? (
            <span className={cx(styles.badge, styles.busy)}>
              {stats.processingCount} processing
            </span>
          ) : null}
          {stats.failedCount + stats.unanalyzedCount > 0 ? (
            <span className={cx(styles.badge, styles.attention)}>
              <AlertTriangle size={11} aria-hidden />
              {stats.failedCount + stats.unanalyzedCount} needs attention
            </span>
          ) : null}
          {stats.openRecommendations > 0 ? (
            <span className={cx(styles.badge, styles.recs)}>
              <Sparkles size={11} aria-hidden />
              {pluralize(stats.openRecommendations, 'recommendation')}
            </span>
          ) : null}
          {topic.archived ? <span className={cx(styles.badge, styles.neutral)}>Archived</span> : null}
        </span>
      </footer>
    </article>
  );
}
