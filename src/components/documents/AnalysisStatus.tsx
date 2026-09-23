'use client';

import {
  CheckCircle2,
  AlertTriangle,
  CircleDashed,
  Loader2,
  UploadCloud,
  FileSearch,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import type { DocumentRecord, DocumentStatus } from '@/lib/types';
import { Progress } from '@/components/ui/Progress';
import { cx } from '@/lib/utils';
import styles from './AnalysisStatus.module.css';

const STATUS_META: Record<
  DocumentStatus,
  { label: string; icon: typeof CheckCircle2; tone: string; spin?: boolean }
> = {
  queued: { label: 'Queued', icon: CircleDashed, tone: 'muted' },
  uploading: { label: 'Uploading…', icon: UploadCloud, tone: 'busy' },
  parsing: { label: 'Reading document…', icon: FileSearch, tone: 'busy' },
  analyzing: { label: 'Understanding content…', icon: Sparkles, tone: 'busy' },
  recommending: { label: 'Generating recommendations…', icon: ListChecks, tone: 'busy' },
  ready: { label: 'Ready', icon: CheckCircle2, tone: 'ready' },
  failed: { label: 'Analysis failed', icon: AlertTriangle, tone: 'failed' },
  unanalyzed: { label: 'Not analysed', icon: CircleDashed, tone: 'muted' },
};

interface AnalysisStatusProps {
  document: DocumentRecord;
  /** Shows the upload progress bar and stage text beneath the pill. */
  detailed?: boolean;
  className?: string;
}

export function AnalysisStatus({ document, detailed, className }: AnalysisStatusProps) {
  const meta = STATUS_META[document.status];
  const Icon = meta.icon;
  const busy = meta.tone === 'busy';
  const label = document.statusDetail && busy ? document.statusDetail : meta.label;

  return (
    <div className={cx(styles.wrap, className)}>
      <span
        className={cx(styles.pill, styles[meta.tone])}
        // Progress is announced once per change rather than on every tick.
        role={busy ? 'status' : undefined}
      >
        {busy ? (
          <Loader2 size={12} className={styles.spin} aria-hidden />
        ) : (
          <Icon size={12} aria-hidden />
        )}
        {label}
      </span>

      {detailed && document.status === 'uploading' && typeof document.progress === 'number' ? (
        <Progress value={document.progress} label={`Uploading ${document.name}`} className={styles.progress} />
      ) : null}

      {detailed && busy && document.status !== 'uploading' ? (
        <Progress label={`Processing ${document.name}`} className={styles.progress} />
      ) : null}
    </div>
  );
}

export { STATUS_META };
