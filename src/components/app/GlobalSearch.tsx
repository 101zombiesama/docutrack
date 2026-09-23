'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Search, CornerDownLeft, FileText, FolderKanban } from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { search } from '@/lib/selectors';
import { accentOf, formatMeta, topicIcon } from '@/lib/appearance';
import { cx, truncate } from '@/lib/utils';
import styles from './GlobalSearch.module.css';

interface Result {
  key: string;
  href: string;
  title: string;
  subtitle: string;
  kind: 'topic' | 'document';
  accent?: string;
  accentSoft?: string;
  icon: React.ReactNode;
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 30);
      const { overflow } = document.body.style;
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = overflow;
      };
    }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!query.trim()) return [];
    const found = search(data, query);
    const topics: Result[] = found.topics.slice(0, 4).map((topic) => {
      const Icon = topicIcon(topic.icon);
      const accent = accentOf(topic.accent);
      return {
        key: topic.id,
        href: `/topics/${topic.id}`,
        title: topic.name,
        subtitle: topic.description || 'Topic',
        kind: 'topic',
        accent: accent.text,
        accentSoft: accent.soft,
        icon: <Icon size={15} />,
      };
    });
    const documents: Result[] = found.documents.slice(0, 6).map((hit) => {
      const meta = formatMeta(hit.document.format);
      return {
        key: hit.document.id,
        href: `/documents/${hit.document.id}`,
        title: hit.document.name,
        subtitle: `${hit.topic?.name ?? 'No topic'} · matched on ${hit.matchedOn.join(', ')}`,
        kind: 'document',
        icon: <meta.icon size={15} />,
      };
    });
    return [...topics, ...documents];
  }, [data, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!mounted || !open) return null;

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      onOpenChange(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) go(target.href);
      else if (query.trim()) go(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  const topicCount = results.filter((r) => r.kind === 'topic').length;

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => e.target === e.currentTarget && onOpenChange(false)}
    >
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Search">
        <div className={styles.inputRow}>
          <Search size={17} className={styles.inputIcon} aria-hidden />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search topics, documents, AI summaries…"
            aria-label="Search topics and documents"
            aria-controls="global-search-results"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className={styles.kbd}>Esc</kbd>
        </div>

        <div className={styles.results}>
          {!query.trim() ? (
            <p className={styles.hint}>
              Search across topic names, goals, tags, file names, document types and AI summaries.
            </p>
          ) : results.length === 0 ? (
            <p className={styles.hint}>
              No matches for <strong>{truncate(query, 40)}</strong>. Try a different term.
            </p>
          ) : (
            <ul className={styles.list} id="global-search-results" ref={listRef}>
              {results.map((result, index) => (
                <li key={`${result.kind}-${result.key}`}>
                  {index === 0 && topicCount > 0 ? (
                    <p className={styles.groupLabel}>
                      <FolderKanban size={12} aria-hidden /> Topics
                    </p>
                  ) : null}
                  {index === topicCount ? (
                    <p className={styles.groupLabel}>
                      <FileText size={12} aria-hidden /> Documents
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className={cx(styles.result, index === activeIndex && styles.activeResult)}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => go(result.href)}
                  >
                    <span
                      className={styles.resultIcon}
                      style={
                        result.accent
                          ? { background: result.accentSoft, color: result.accent }
                          : undefined
                      }
                      aria-hidden
                    >
                      {result.icon}
                    </span>
                    <span className={styles.resultText}>
                      <span className={styles.resultTitle}>{result.title}</span>
                      <span className={styles.resultSubtitle}>{result.subtitle}</span>
                    </span>
                    <CornerDownLeft size={13} className={styles.enterHint} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {query.trim() ? (
          <button
            type="button"
            className={styles.seeAll}
            onClick={() => go(`/search?q=${encodeURIComponent(query.trim())}`)}
          >
            See all results for “{truncate(query.trim(), 32)}”
          </button>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
