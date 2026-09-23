import { cx } from '@/lib/utils';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
}

export function Skeleton({ width, height = 14, radius, className }: SkeletonProps) {
  return (
    <span
      className={cx(styles.skeleton, className)}
      style={{ width, height, borderRadius: radius }}
      aria-hidden
    />
  );
}

/** Card-shaped placeholder used while the store hydrates. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cx(styles.card, className)} aria-hidden>
      <div className={styles.cardHeader}>
        <Skeleton width={34} height={34} radius="10px" />
        <Skeleton width="42%" height={13} />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '58%' : '100%'} height={11} />
      ))}
    </div>
  );
}
