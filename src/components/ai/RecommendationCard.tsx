'use client';

import { useState } from 'react';
import {
  ArrowUpCircle,
  CircleDot,
  MinusCircle,
  Check,
  X,
  Bookmark,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import type { Priority, Recommendation, RecommendationStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { cx, formatRelative } from '@/lib/utils';
import styles from './RecommendationCard.module.css';

const PRIORITY_META: Record<Priority, { label: string; icon: typeof ArrowUpCircle }> = {
  high: { label: 'High priority', icon: ArrowUpCircle },
  medium: { label: 'Medium priority', icon: CircleDot },
  low: { label: 'Low priority', icon: MinusCircle },
};

const STATUS_LABEL: Record<RecommendationStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
  saved: 'Saved for later',
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  onStatusChange: (status: RecommendationStatus) => void;
  /** Shows which document this came from — used on topic-wide lists. */
  contextLabel?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function RecommendationCard({
  recommendation: rec,
  onStatusChange,
  contextLabel,
  defaultExpanded = true,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const priority = PRIORITY_META[rec.priority];
  const PriorityIcon = priority.icon;
  const closed = rec.status === 'resolved' || rec.status === 'dismissed';

  return (
    <article className={cx(styles.card, styles[rec.priority], closed && styles.closed)}>
      <header className={styles.header}>
        <span className={cx(styles.priority, styles[`p_${rec.priority}`])}>
          <PriorityIcon size={12} aria-hidden />
          {priority.label}
        </span>
        {rec.section ? <span className={styles.section}>{rec.section}</span> : null}
        {contextLabel ? <span className={styles.context}>{contextLabel}</span> : null}
        {rec.status !== 'open' ? (
          <span className={cx(styles.status, closed && styles.statusClosed)}>
            {STATUS_LABEL[rec.status]}
          </span>
        ) : null}
        <button
          type="button"
          className={styles.collapse}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${rec.title}` : `Expand ${rec.title}`}
        >
          <ChevronDown size={15} className={cx(styles.chevron, expanded && styles.chevronOpen)} aria-hidden />
        </button>
      </header>

      <h3 className={styles.title}>{rec.title}</h3>

      {expanded ? (
        <div className={styles.body}>
          <p className={styles.explanation}>{rec.explanation}</p>

          <div className={styles.detail}>
            <p className={styles.detailLabel}>Why this matters</p>
            <p className={styles.detailText}>{rec.whyItMatters}</p>
          </div>

          <div className={styles.detail}>
            <p className={styles.detailLabel}>Suggested action</p>
            <p className={styles.detailText}>{rec.suggestedAction}</p>
          </div>

          <p className={styles.meta}>
            Suggested {formatRelative(rec.createdAt)} · you decide whether to apply it
          </p>
        </div>
      ) : null}

      <footer className={styles.actions}>
        {rec.status === 'open' || rec.status === 'saved' ? (
          <>
            <Button size="sm" variant="secondary" onClick={() => onStatusChange('resolved')}>
              <Check size={14} aria-hidden />
              Resolve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onStatusChange('dismissed')}>
              <X size={14} aria-hidden />
              Dismiss
            </Button>
            {rec.status === 'open' ? (
              <Button size="sm" variant="ghost" onClick={() => onStatusChange('saved')}>
                <Bookmark size={14} aria-hidden />
                Save for later
              </Button>
            ) : null}
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => onStatusChange('open')}>
            <RotateCcw size={14} aria-hidden />
            Reopen
          </Button>
        )}
      </footer>
    </article>
  );
}

export { PRIORITY_META };
