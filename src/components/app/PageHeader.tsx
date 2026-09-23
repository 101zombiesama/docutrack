import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cx } from '@/lib/utils';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  backHref,
  backLabel = 'Back',
  className,
}: PageHeaderProps) {
  return (
    <header className={cx(styles.header, className)}>
      {backHref ? (
        <Link href={backHref} className={styles.back}>
          <ChevronLeft size={15} aria-hidden />
          {backLabel}
        </Link>
      ) : null}
      <div className={styles.row}>
        <div className={styles.text}>
          {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
          <h1 className={styles.title}>{title}</h1>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  );
}
