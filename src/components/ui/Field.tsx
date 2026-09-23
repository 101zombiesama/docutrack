'use client';

import { useId } from 'react';
import { cx } from '@/lib/utils';
import styles from './Field.module.css';

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Renders the control; receives the id/aria wiring it must spread. */
  children: (props: {
    id: string;
    'aria-describedby': string | undefined;
    'aria-invalid': boolean | undefined;
  }) => React.ReactNode;
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.required} aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass = styles.input;
export const textareaClass = cx(styles.input, styles.textarea);
export const selectClass = cx(styles.input, styles.select);
