'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, LayoutGrid, List, FolderKanban, SearchX, X } from 'lucide-react';
import type { Topic, ViewMode } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { topicStats } from '@/lib/selectors';
import { PageHeader } from '@/components/app/PageHeader';
import { TopicCard } from '@/components/topics/TopicCard';
import { TopicFormDialog } from '@/components/topics/TopicFormDialog';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Segmented } from '@/components/ui/Segmented';
import { useToast } from '@/components/ui/Toast';
import { cx, matches, pluralize } from '@/lib/utils';
import styles from './topics.module.css';

type StatusFilter = 'active' | 'archived' | 'all';
type SortKey = 'updated' | 'name' | 'documents' | 'recommendations';

const SORT_LABELS: Record<SortKey, string> = {
  updated: 'Recently updated',
  name: 'Name (A–Z)',
  documents: 'Most documents',
  recommendations: 'Most recommendations',
};

export function TopicsView() {
  const { data, deleteTopic, setTopicArchived } = useApp();
  const { notify } = useToast();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');
  const [sort, setSort] = useState<SortKey>('updated');
  const [view, setView] = useState<ViewMode>(data.settings.defaultTopicView);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Topic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  const counts = useMemo(
    () => ({
      active: data.topics.filter((t) => !t.archived).length,
      archived: data.topics.filter((t) => t.archived).length,
      all: data.topics.length,
    }),
    [data.topics],
  );

  const visible = useMemo(() => {
    const filtered = data.topics.filter((topic) => {
      if (status === 'active' && topic.archived) return false;
      if (status === 'archived' && !topic.archived) return false;
      if (!query.trim()) return true;
      return (
        matches(topic.name, query) ||
        matches(topic.description, query) ||
        matches(topic.goal, query) ||
        topic.tags.some((tag) => matches(tag, query))
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'documents')
        return topicStats(data, b.id).documentCount - topicStats(data, a.id).documentCount;
      if (sort === 'recommendations')
        return topicStats(data, b.id).openRecommendations - topicStats(data, a.id).openRecommendations;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [data, query, sort, status]);

  const noTopicsAtAll = data.topics.length === 0;

  return (
    <>
      <PageHeader
        title="Topics"
        description="Each topic holds the documents for one project, goal or piece of work."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            Create topic
          </Button>
        }
      />

      {!noTopicsAtAll ? (
        <div className={styles.toolbar}>
          <div className={styles.searchField}>
            <Search size={15} aria-hidden className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics by name, goal or tag"
              aria-label="Search topics"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} aria-hidden />
              </button>
            ) : null}
          </div>

          <Segmented
            label="Filter topics"
            size="sm"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'active', label: 'Active', count: counts.active },
              { value: 'archived', label: 'Archived', count: counts.archived },
              { value: 'all', label: 'All', count: counts.all },
            ]}
          />

          <div className={styles.toolbarEnd}>
            <label className={styles.sortLabel} htmlFor="topic-sort">
              Sort
            </label>
            <select
              id="topic-sort"
              className={styles.sortSelect}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>

            <Segmented
              label="View mode"
              size="sm"
              compact
              value={view}
              onChange={setView}
              options={[
                { value: 'grid', label: 'Grid', ariaLabel: 'Grid view', icon: <LayoutGrid size={14} /> },
                { value: 'list', label: 'List', ariaLabel: 'List view', icon: <List size={14} /> },
              ]}
            />
          </div>
        </div>
      ) : null}

      {noTopicsAtAll ? (
        <EmptyState
          icon={FolderKanban}
          title="No topics yet"
          description="Create your first topic to start organising your work. Everything in Docutrack lives inside one."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden />
              Create topic
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={query ? `No topics match “${query}”` : 'Nothing here yet'}
          description={
            query
              ? 'Try a different word, or clear the search to see everything.'
              : status === 'archived'
                ? 'Archived topics stay searchable and can be restored at any time.'
                : 'Create a topic to get started.'
          }
          action={
            query ? (
              <Button variant="secondary" onClick={() => setQuery('')}>
                Clear search
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                Create topic
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className={styles.resultCount} role="status">
            {pluralize(visible.length, 'topic')}
            {query ? ` matching “${query}”` : ''}
          </p>
          <div className={cx(view === 'grid' ? styles.grid : styles.list)}>
            {visible.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                view={view}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onToggleArchive={(t) => {
                  setTopicArchived(t.id, !t.archived);
                  notify({
                    tone: 'success',
                    title: t.archived ? `“${t.name}” unarchived` : `“${t.name}” archived`,
                  });
                }}
              />
            ))}
          </div>
        </>
      )}

      <TopicFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(topic) => router.push(`/topics/${topic.id}`)}
      />
      <TopicFormDialog
        open={!!editTarget}
        topic={editTarget ?? undefined}
        onClose={() => setEditTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this topic?"
        tone="danger"
        confirmLabel="Delete topic"
        message={
          <>
            <strong>{deleteTarget?.name}</strong> and its{' '}
            {deleteTarget ? pluralize(topicStats(data, deleteTarget.id).documentCount, 'document') : ''}{' '}
            will be deleted, along with their analysis and recommendations. This can&rsquo;t be undone.
          </>
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteTopic(deleteTarget.id);
            notify({ tone: 'success', title: `Deleted “${deleteTarget.name}”` });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
