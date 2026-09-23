import { FileText, PenLine, Sparkles } from 'lucide-react';
import type { Provenance } from '@/lib/types';
import { cx } from '@/lib/utils';
import styles from './Provenance.module.css';

const META: Record<Provenance, { label: string; icon: typeof FileText; title: string }> = {
  extracted: {
    label: 'From document',
    icon: FileText,
    title: 'Read directly from the file',
  },
  user: {
    label: 'You wrote this',
    icon: PenLine,
    title: 'Taken from information you entered',
  },
  inferred: {
    label: 'AI inferred',
    icon: Sparkles,
    title: 'Inferred by the model — worth checking',
  },
};

/** Labels where a piece of information came from. Never colour alone. */
export function ProvenanceTag({ provenance, className }: { provenance: Provenance; className?: string }) {
  const meta = META[provenance];
  const Icon = meta.icon;
  return (
    <span className={cx(styles.tag, styles[provenance], className)} title={meta.title}>
      <Icon size={11} aria-hidden />
      {meta.label}
    </span>
  );
}
