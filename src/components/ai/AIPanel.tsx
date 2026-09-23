import { Sparkles } from 'lucide-react';
import { cx } from '@/lib/utils';
import styles from './AIPanel.module.css';

/**
 * The consistent wrapper for anything the model produced. Every AI surface in
 * the product uses this frame, so generated content is always visually
 * distinguishable from the user's own data.
 */
export function AIPanel({
  title,
  subtitle,
  actions,
  footnote,
  children,
  tone = 'default',
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footnote?: React.ReactNode;
  children: React.ReactNode;
  tone?: 'default' | 'plain';
  className?: string;
}) {
  return (
    <section className={cx(styles.panel, tone === 'plain' && styles.plain, className)}>
      <header className={styles.header}>
        <span className={styles.mark} aria-hidden>
          <Sparkles size={13} />
        </span>
        <div className={styles.headings}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
      {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
    </section>
  );
}
