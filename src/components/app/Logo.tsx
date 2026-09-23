import { cx } from '@/lib/utils';
import styles from './Logo.module.css';

/**
 * Wordmark. The glyph is three document nodes converging on a topic node —
 * the same idea the landing page animation draws at full scale.
 */
export function Logo({
  size = 26,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) {
  return (
    <span className={cx(styles.logo, className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden
        className={styles.mark}
      >
        <rect width="28" height="28" rx="8" className={styles.plate} />
        <path
          d="M8 8.5h4.2M8 14h4.2M8 19.5h4.2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className={styles.lines}
        />
        <path
          d="M12.2 8.5C16 8.5 17.4 11 18.6 14M12.2 14h6.4M12.2 19.5C16 19.5 17.4 17 18.6 14"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          className={styles.links}
        />
        <circle cx="19.4" cy="14" r="2.7" className={styles.node} />
      </svg>
      {withWordmark ? <span className={styles.word}>Docutrack</span> : null}
    </span>
  );
}
