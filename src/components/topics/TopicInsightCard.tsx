'use client';

import Link from 'next/link';
import {
  PuzzleIcon,
  GitCompareArrows,
  Layers,
  Link2,
  ArrowRight,
  X,
} from 'lucide-react';
import type { InsightKind, TopicInsight } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { cx } from '@/lib/utils';
import styles from './TopicInsightCard.module.css';

const KIND_META: Record<InsightKind, { label: string; icon: typeof Layers }> = {
  gap: { label: 'Possible gap', icon: PuzzleIcon },
  inconsistency: { label: 'Possible inconsistency', icon: GitCompareArrows },
  overlap: { label: 'Overlap', icon: Layers },
  alignment: { label: 'Alignment', icon: Link2 },
  'next-step': { label: 'Suggested next step', icon: ArrowRight },
};

export function TopicInsightCard({ insight }: { insight: TopicInsight }) {
  const { data, dismissInsight } = useApp();
  const meta = KIND_META[insight.kind];
  const Icon = meta.icon;
  const related = insight.relatedDocumentIds
    .map((id) => data.documents.find((d) => d.id === id))
    .filter(Boolean);

  return (
    <article className={cx(styles.card, styles[insight.priority])}>
      <header className={styles.header}>
        <span className={styles.kind}>
          <Icon size={12} aria-hidden />
          {meta.label}
        </span>
        <span className={styles.priority}>{insight.priority} priority</span>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => dismissInsight(insight.id)}
          aria-label={`Dismiss insight: ${insight.title}`}
        >
          <X size={14} aria-hidden />
        </button>
      </header>

      <h3 className={styles.title}>{insight.title}</h3>
      <p className={styles.body}>{insight.body}</p>

      {insight.suggestedAction ? (
        <p className={styles.action}>
          <ArrowRight size={13} aria-hidden />
          {insight.suggestedAction}
        </p>
      ) : null}

      {related.length > 0 ? (
        <p className={styles.related}>
          <span className={styles.relatedLabel}>Based on</span>
          {related.map((doc) => (
            <Link key={doc!.id} href={`/documents/${doc!.id}`} className={styles.relatedLink}>
              {doc!.name}
            </Link>
          ))}
        </p>
      ) : null}
    </article>
  );
}
