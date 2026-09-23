'use client';

import Link from 'next/link';
import { MoreHorizontal, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import type { DocumentRecord } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { analysisForDocument, recommendationsForDocument } from '@/lib/selectors';
import { formatMeta } from '@/lib/appearance';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Button } from '@/components/ui/Button';
import { cx, formatBytes, formatRelative } from '@/lib/utils';
import { AnalysisStatus } from './AnalysisStatus';
import styles from './DocumentCard.module.css';

interface DocumentCardProps {
  document: DocumentRecord;
  view?: 'list' | 'grid';
  menuItems?: MenuItem[];
  /** Shown on cross-topic lists so a document always names its topic. */
  topicName?: string;
  topicHref?: string;
  onRetry?: () => void;
}

export function DocumentCard({
  document: doc,
  view = 'list',
  menuItems,
  topicName,
  topicHref,
  onRetry,
}: DocumentCardProps) {
  const { data } = useApp();
  const analysis = analysisForDocument(data, doc.id);
  const openRecs = recommendationsForDocument(data, doc.id).filter((r) => r.status === 'open');
  const meta = formatMeta(doc.format);
  const FormatIcon = meta.icon;

  return (
    <article className={cx(styles.card, view === 'grid' && styles.gridCard)}>
      <span className={styles.iconWrap} style={{ color: meta.color }} aria-hidden>
        <FormatIcon size={18} />
      </span>

      <div className={styles.main}>
        <div className={styles.titleRow}>
          <h3 className={styles.name}>
            <Link href={`/documents/${doc.id}`} className={styles.link}>
              {doc.name}
            </Link>
          </h3>
          {analysis ? <span className={styles.type}>{analysis.documentType}</span> : null}
        </div>

        <p className={styles.meta}>
          <span className={styles.format}>{meta.label}</span>
          <span aria-hidden>·</span>
          <span>{formatBytes(doc.sizeBytes)}</span>
          <span aria-hidden>·</span>
          <span>Updated {formatRelative(doc.updatedAt)}</span>
          {topicName ? (
            <>
              <span aria-hidden>·</span>
              {topicHref ? (
                <Link href={topicHref} className={styles.topicLink}>
                  {topicName}
                </Link>
              ) : (
                <span>{topicName}</span>
              )}
            </>
          ) : null}
        </p>

        {analysis?.summary ? <p className={styles.summary}>{analysis.summary}</p> : null}

        {doc.status === 'failed' ? (
          <p className={styles.error}>
            <AlertTriangle size={13} aria-hidden />
            {doc.error ?? 'Analysis failed.'} The document is still here.
          </p>
        ) : null}

        <div className={styles.statusRow}>
          <AnalysisStatus document={doc} detailed />
          {openRecs.length > 0 ? (
            <span className={styles.recs}>
              <Sparkles size={11} aria-hidden />
              {openRecs.length} recommendation{openRecs.length === 1 ? '' : 's'}
            </span>
          ) : null}
          {(doc.status === 'failed' || doc.status === 'unanalyzed') && onRetry ? (
            <Button size="sm" variant="secondary" onClick={onRetry} className={styles.retry}>
              {doc.status === 'failed' ? (
                <RefreshCw size={13} aria-hidden />
              ) : (
                <Sparkles size={13} aria-hidden />
              )}
              {doc.status === 'failed' ? 'Retry analysis' : 'Run analysis'}
            </Button>
          ) : null}
        </div>
      </div>

      {menuItems?.length ? (
        <Menu
          className={styles.menu}
          label={`Actions for ${doc.name}`}
          trigger={<MoreHorizontal size={17} aria-hidden />}
          items={menuItems}
        />
      ) : null}
    </article>
  );
}
