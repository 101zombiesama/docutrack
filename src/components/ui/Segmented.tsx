'use client';

import { cx } from '@/lib/utils';
import styles from './Segmented.module.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  /** Used when the label alone isn't descriptive, e.g. icon-only view toggles. */
  ariaLabel?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the whole group. */
  label: string;
  size?: 'sm' | 'md';
  compact?: boolean;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'md',
  compact,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      className={cx(styles.group, styles[size], compact && styles.compact, className)}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={cx(styles.option, selected && styles.selected)}
            aria-pressed={selected}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            {compact && option.ariaLabel ? null : option.label}
            {typeof option.count === 'number' ? (
              <span className={styles.count}>{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
