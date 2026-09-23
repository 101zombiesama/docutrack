import { cx } from '@/lib/utils';
import styles from './Progress.module.css';

interface ProgressProps {
  /** 0–100, or omitted for an indeterminate bar. */
  value?: number;
  label: string;
  className?: string;
}

export function Progress({ value, label, className }: ProgressProps) {
  const indeterminate = typeof value !== 'number';
  return (
    <div
      className={cx(styles.track, indeterminate && styles.indeterminate, className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
    >
      <span className={styles.fill} style={indeterminate ? undefined : { width: `${value}%` }} />
    </div>
  );
}
