'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, X, SearchX, FolderKanban, FileText } from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { search } from '@/lib/selectors';
import { accentOf, topicIcon } from '@/lib/appearance';
import { PageHeader } from '@/components/app/PageHeader';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { useDocumentActions } from '@/components/documents/useDocumentActions';
import { EmptyState } from '@/components/ui/EmptyState';
import { Segmented } from '@/components/ui/Segmented';
import { formatRelative, pluralize } from '@/lib/utils';
import styles from './search.module.css';

type Scope = 'all' | 'topics' | 'documents';

const EXAMPLES = ['CV', 'job description', 'distributed systems', 'tax'];

export function SearchView() {
  const { data, runAnalysis } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const { menuItemsFor, dialogs } = useDocumentActions();

  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [scope, setScope] = useState<Scope>('all');

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  // Keep the URL shareable without pushing a history entry per keystroke.
  useEffect(() => {
    const handle = setTimeout(() => {
      const current = params.get('q') ?? '';
      if (query === current) return;
      router.replace(query ? `/search?q=${encodeURIComponent(query)}` : '/search', { scroll: false });
    }, 350);
    return () => clearTimeout(handle);
  }, [params, query, router]);

  const results = useMemo(() => search(data, query), [data, query]);
  const showTopics = scope !== 'documents' && results.topics.length > 0;
  const showDocuments = scope !== 'topics' && results.documents.length > 0;

  return (
    <>
      <PageHeader
        title="Search"
        description="Look across topic names, goals and tags, plus document names, types, AI summaries and readable document text."
      />

      <div className={styles.searchBar}>
        <Search size={17} className={styles.icon} aria-hidden />
        <input
          type="search"
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search everything…"
          aria-label="Search topics and documents"
          autoFocus
        />
        {query ? (
          <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
            <X size={15} aria-hidden />
          </button>
        ) : null}
      </div>

      {query.trim() ? (
        <div className={styles.toolbar}>
          <Segmented
            label="Result type"
            size="sm"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: 'All', count: results.total },
              { value: 'topics', label: 'Topics', count: results.topics.length },
              { value: 'documents', label: 'Documents', count: results.documents.length },
            ]}
          />
          <p className={styles.count} role="status">
            {results.total === 0
              ? 'No results'
              : `${pluralize(results.total, 'result')} for “${query.trim()}”`}
          </p>
        </div>
      ) : null}

      {!query.trim() ? (
        <div className={styles.placeholder}>
          <EmptyState
            icon={Search}
            title="Search your workspace"
            description="Find a topic by its goal, a document by what the AI decided it is, or a phrase inside a readable file."
          />
          <div className={styles.examples}>
            <span className={styles.examplesLabel}>Try</span>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className={styles.example}
                onClick={() => setQuery(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      ) : results.total === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`Nothing matches “${query.trim()}”`}
          description="Check the spelling, or try a broader term. Only readable file types (TXT, MD, CSV) are searched by their contents."
        />
      ) : (
        <div className={styles.results}>
          {showTopics ? (
            <section aria-labelledby="topic-results-heading" className={styles.group}>
              <h2 className={styles.groupTitle} id="topic-results-heading">
                <FolderKanban size={15} aria-hidden />
                Topics
                <span className={styles.groupCount}>{results.topics.length}</span>
              </h2>
              <ul className={styles.topicList}>
                {results.topics.map((topic) => {
                  const Icon = topicIcon(topic.icon);
                  const accent = accentOf(topic.accent);
                  const count = data.documents.filter((d) => d.topicId === topic.id).length;
                  return (
                    <li key={topic.id}>
                      <Link href={`/topics/${topic.id}`} className={styles.topicRow}>
                        <span
                          className={styles.topicIcon}
                          style={{ background: accent.soft, color: accent.text }}
                          aria-hidden
                        >
                          <Icon size={15} />
                        </span>
                        <span className={styles.topicText}>
                          <span className={styles.topicName}>{topic.name}</span>
                          <span className={styles.topicMeta}>
                            {pluralize(count, 'document')} · updated {formatRelative(topic.updatedAt)}
                            {topic.archived ? ' · archived' : ''}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {showDocuments ? (
            <section aria-labelledby="document-results-heading" className={styles.group}>
              <h2 className={styles.groupTitle} id="document-results-heading">
                <FileText size={15} aria-hidden />
                Documents
                <span className={styles.groupCount}>{results.documents.length}</span>
              </h2>
              <div className={styles.documentList}>
                {results.documents.map((hit) => (
                  <div key={hit.document.id} className={styles.hit}>
                    <DocumentCard
                      document={hit.document}
                      topicName={hit.topic?.name}
                      topicHref={hit.topic ? `/topics/${hit.topic.id}` : undefined}
                      menuItems={menuItemsFor(hit.document, { includeOpen: true })}
                      onRetry={() => void runAnalysis(hit.document.id)}
                    />
                    <p className={styles.matchedOn}>Matched on {hit.matchedOn.join(', ')}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
      {dialogs}
    </>
  );
}
