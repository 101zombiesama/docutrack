'use client';

import { useEffect, useRef, useState } from 'react';
import { cx } from '@/lib/utils';
import styles from './Menu.module.css';

export interface MenuItem {
  label: string;
  icon?: React.ComponentType<{ size?: number | string; 'aria-hidden'?: boolean }>;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Draws a divider above this item. */
  separated?: boolean;
}

interface MenuProps {
  /** The element that opens the menu; rendered inside a button wrapper. */
  trigger: React.ReactNode;
  label: string;
  items: MenuItem[];
  align?: 'start' | 'end';
  className?: string;
}

export function Menu({ trigger, label, items, align = 'end', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0) itemRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  const enabledIndexes = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);

  function move(direction: 1 | -1) {
    if (enabledIndexes.length === 0) return;
    const position = enabledIndexes.indexOf(activeIndex);
    const next =
      position === -1
        ? enabledIndexes[direction === 1 ? 0 : enabledIndexes.length - 1]
        : enabledIndexes[(position + direction + enabledIndexes.length) % enabledIndexes.length];
    setActiveIndex(next);
  }

  return (
    <div className={cx(styles.root, className)} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
          setActiveIndex(-1);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            move(e.key === 'ArrowDown' ? 1 : -1);
          }
        }}
      >
        {trigger}
      </button>

      {open ? (
        <div
          className={cx(styles.menu, align === 'start' ? styles.alignStart : styles.alignEnd)}
          role="menu"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              move(1);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              move(-1);
            }
          }}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={cx(
                  styles.item,
                  item.tone === 'danger' && styles.danger,
                  item.separated && styles.separated,
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {Icon ? <Icon size={15} aria-hidden /> : <span className={styles.iconSpacer} />}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
