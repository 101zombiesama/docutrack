'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  Pencil,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  Trash2,
  Target,
  Sparkles,
  RefreshCw,
  Search,
  X,
  FileText,
  SearchX,
  FolderOpen,
  AlertTriangle,
  Lightbulb,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { DocumentRecord, ViewMode } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import {
  analysisForDocument,
  documentsForTopic,
  insightsForTopic,
  isProcessing,
  topicById,
  topicStats,
} from '@/lib/selectors';
import { accentOf, topicIcon } from '@/lib/appearance';
import { PageHeader } from '@/components/app/PageHeader';
import { TopicFormDialog } from '@/components/topics/TopicFormDialog';
import { TopicInsightCard } from '@/components/topics/TopicInsightCard';
import { TopicAssistant } from '@/components/topics/TopicAssistant';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { UploadDropzone } from '@/components/documents/UploadDropzone';
import { useDocumentActions } from '@/components/documents/useDocumentActions';
import { AIPanel } from '@/components/ai/AIPanel';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Menu } from '@/components/ui/Menu';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { formatRelative, matches, pluralize } from '@/lib/utils';
import styles from './topic.module.css';

type DocFilter = 'all' | 'recent' | 'attention' | 'analyzed' | 'processing';

const DAY = 24 * 60 * 60 * 1000;

export function TopicWorkspace({ topicId }: { topicId: string }) {
  const {
    data,
    deleteTopic,
    setTopicArchived,
    generateInsights,
    insightsPending,
    insightsError,
    runAnalysis,
  } = useApp();
  const { notify } = useToast();
  const router = useRouter();
  const { menuItemsFor, dialogs } = useDocumentActions();

  const [filter, setFilter] = useState<DocFilter>('all');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>(data.settings.defaultDocumentView);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);

  const topic = topicById(data, topicId);
  const documents = useMemo(
    () => (topic ? documentsForTopic(data, topic.id) : []),
    [data, topic],
  );
  const stats = useMemo(() => (topic ? topicStats(data, topic.id) : null), [data, topic]);
  const insights = useMemo(
    () => (topic ? insightsForTopic(data, topic.id).filter((i) => i.status === 'open') : []),
    [data, topic],
  );

  const counts = useMemo(() => {
    const now = Date.now();
    return {
      all: documents.length,
      recent: documents.filter((d) => now - new Date(d.uploadedAt).getTime() < 7 * DAY).length,
      attention: documents.filter((d) => d.status === 'failed' || d.status === 'unanalyzed').length,
      analyzed: documents.filter((d) => d.status === 'ready').length,
      processing: documents.filter(isProcessing).length,
    };
  }, [documents]);

  const visible = useMemo(() => {
    const now = Date.now();
    return documents.filter((doc) => {
      if (filter === 'recent' && now - new Date(doc.uploadedAt).getTime() >= 7 * DAY) return false;
      if (filter === 'attention' && doc.status !== 'failed' && doc.status !== 'unanalyzed') return false;
      if (filter === 'analyzed' && doc.status !== 'ready') return false;
      if (filter === 'processing' && !isProcessing(doc)) return false;
      if (!query.trim()) return true;
      const analysis = analysisForDocument(data, doc.id);
      return (
        matches(doc.name, query) ||
        matches(doc.format, query) ||
        matches(analysis?.documentType, query) ||
        matches(analysis?.summary, query)
      );
    });
  }, [data, documents, filter, query]);

  if (!topic) {
    return (
      <>
        <PageHeader title="Topic not found" backHref="/topics" backLabel="All topics" />
        <EmptyState
          icon={FolderOpen}
          title="This topic doesn't exist"
          description="It may have been deleted, or the link may be out of date."
          action={
            <Button variant="primary" onClick={() => router.push('/topics')}>
              Go to topics
            </Button>
          }
        />
      </>
    );
  }

  const Icon = topicIcon(topic.icon);
  const accent = accentOf(topic.accent);
  const pending = !!insightsPending[topic.id];
  const error = insightsError[topic.id];
  const analysedCount = stats?.analyzedCount ?? 0;

  return (
    <>
      <PageHeader
        backHref="/topics"
        backLabel="All topics"
        eyebrow={
          <>
            <span
              className={styles.topicIcon}
              style={{ background: accent.soft, color: accent.text, borderColor: accent.border }}
              aria-hidden
            >
              <Icon size={15} />
            </span>
            {topic.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {topic.archived ? <span className={styles.archivedTag}>Archived</span> : null}
          </>
        }
        title={topic.name}
        description={topic.description || undefined}
        actions={
          <>
            <Button variant="primary" onClick={() => setUploadVisible((v) => !v)}>
              <UploadCloud size={16} aria-hidden />
              Upload document
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil size={15} aria-hidden />
              Edit topic
            </Button>
            <Menu
              label="More topic actions"
              trigger={<MoreHorizontal size={17} aria-hidden />}
              items={[
                {
                  label: pending ? 'Generating insights…' : 'Generate topic insights',
                  icon: Sparkles,
                  disabled: pending,
                  onSelect: () => void generateInsights(topic.id),
                },
                {
                  label: topic.archived ? 'Unarchive topic' : 'Archive topic',
                  icon: topic.archived ? ArchiveRestore : Archive,
                  onSelect: () => {
                    setTopicArchived(topic.id, !topic.archived);
                    notify({
                      tone: 'success',
                      title: topic.archived ? 'Topic unarchived' : 'Topic archived',
                    });
                  },
                },
                {
                  label: 'Delete topic',
                  icon: Trash2,
                  tone: 'danger',
                  separated: true,
                  onSelect: () => setDeleteOpen(true),
                },
              ]}
            />
          </>
        }
      />

      <div className={styles.summaryRow}>
        <div className={styles.goalCard}>
          <p className={styles.goalLabel}>
            <Target size={13} aria-hidden />
            Goal — you wrote this
          </p>
          {topic.goal ? (
            <p className={styles.goalText}>{topic.goal}</p>
          ) : (
            <p className={styles.goalEmpty}>
              No goal set yet. Adding one makes every recommendation in this topic more specific.{' '}
              <button type="button" className={styles.inlineButton} onClick={() => setEditOpen(true)}>
                Add a goal
              </button>
            </p>
          )}
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>Documents</dt>
            <dd>{stats?.documentCount ?? 0}</dd>
          </div>
          <div>
            <dt>Analysed</dt>
            <dd>{analysedCount}</dd>
          </div>
          <div>
            <dt>Suggestions</dt>
            <dd>{stats?.openRecommendations ?? 0}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd className={styles.statSmall}>{formatRelative(stats?.lastActivity)}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.columns}>
        <section className={styles.documents} aria-labelledby="topic-documents-heading">
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle} id="topic-documents-heading">
              Documents
            </h2>
            <Segmented
              label="Document view"
              size="sm"
              compact
              value={view}
              onChange={setView}
              options={[
                { value: 'list', label: 'List', ariaLabel: 'List view', icon: <List size={14} /> },
                { value: 'grid', label: 'Grid', ariaLabel: 'Grid view', icon: <LayoutGrid size={14} /> },
              ]}
            />
            <div className={styles.searchField}>
              <Search size={15} className={styles.searchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search in this topic"
                aria-label="Search documents in this topic"
                className={styles.searchInput}
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} aria-label="Clear search">
                  <X size={14} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          <Segmented
            label="Filter documents"
            size="sm"
            value={filter}
            onChange={setFilter}
            className={styles.filters}
            options={[
              { value: 'all', label: 'All', count: counts.all },
              { value: 'recent', label: 'Recently added', count: counts.recent },
              { value: 'attention', label: 'Needs attention', count: counts.attention },
              { value: 'analyzed', label: 'Analysed', count: counts.analyzed },
              ...(counts.processing > 0
                ? [{ value: 'processing' as const, label: 'Processing', count: counts.processing }]
                : []),
            ]}
          />

          {uploadVisible || documents.length === 0 ? (
            <UploadDropzone
              topicId={topic.id}
              compact={documents.length > 0}
              onStarted={(accepted) => {
                setUploadVisible(false);
                setFilter('all');
                notify({
                  tone: 'success',
                  title: `${pluralize(accepted, 'document')} added`,
                  description: 'Processing runs through upload, reading and analysis.',
                });
              }}
            />
          ) : null}

          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No documents yet"
              description="Upload your first document and AI will help you understand and improve it."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              size="sm"
              icon={SearchX}
              title={query ? `Nothing matches “${query}”` : 'Nothing in this view'}
              description={
                query
                  ? 'Try a different term, or clear the search.'
                  : 'Switch to another filter to see the rest of this topic.'
              }
              action={
                query ? (
                  <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                    Clear search
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                    Show all documents
                  </Button>
                )
              }
            />
          ) : (
            <div className={view === 'grid' ? styles.documentGrid : styles.documentList}>
              {visible.map((doc: DocumentRecord) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  view={view}
                  menuItems={menuItemsFor(doc, { includeOpen: true })}
                  onRetry={() => void runAnalysis(doc.id)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className={styles.aiColumn} aria-label="AI insights and assistant">
          <AIPanel
            title="AI topic insights"
            subtitle="What the documents in this topic look like when read together"
            actions={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void generateInsights(topic.id)}
                loading={pending}
                disabled={pending}
              >
                {pending ? null : <RefreshCw size={14} aria-hidden />}
                {insights.length ? 'Refresh' : 'Generate'}
              </Button>
            }
            footnote="Insights compare documents with each other and with your goal. They are suggestions, not conclusions — check them against the documents themselves."
          >
            {pending ? (
              <div className={styles.insightSkeletons} role="status" aria-live="polite">
                <p className="srOnly">Generating topic insights</p>
                {[0, 1].map((i) => (
                  <div key={i} className={styles.insightSkeleton}>
                    <Skeleton width="34%" height={11} />
                    <Skeleton width="80%" height={14} />
                    <Skeleton width="100%" height={11} />
                    <Skeleton width="62%" height={11} />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className={styles.insightError} role="alert">
                <AlertTriangle size={15} aria-hidden />
                <div>
                  <p className={styles.insightErrorTitle}>We couldn&rsquo;t generate insights</p>
                  <p className={styles.insightErrorBody}>
                    {error} Your documents are unaffected — you can try again.
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => void generateInsights(topic.id)}>
                  Retry
                </Button>
              </div>
            ) : insights.length === 0 ? (
              <EmptyState
                size="sm"
                icon={Lightbulb}
                title={analysedCount === 0 ? 'Nothing to compare yet' : 'No insights generated yet'}
                description={
                  analysedCount === 0
                    ? 'Upload and analyse at least one document, then insights can look across them.'
                    : 'Generate insights to see gaps, overlaps and alignment across these documents.'
                }
                action={
                  analysedCount > 0 ? (
                    <Button size="sm" variant="primary" onClick={() => void generateInsights(topic.id)}>
                      <Sparkles size={14} aria-hidden />
                      Generate insights
                    </Button>
                  ) : null
                }
              />
            ) : (
              <div className={styles.insightList}>
                {insights.map((insight) => (
                  <TopicInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </AIPanel>

          <TopicAssistant topic={topic} />
        </aside>
      </div>

      <TopicFormDialog open={editOpen} topic={topic} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this topic?"
        tone="danger"
        confirmLabel="Delete topic"
        message={
          <>
            <strong>{topic.name}</strong> and its {pluralize(documents.length, 'document')} will be
            deleted, along with all analysis, recommendations and assistant history. This can&rsquo;t
            be undone.
          </>
        }
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteTopic(topic.id);
          setDeleteOpen(false);
          notify({ tone: 'success', title: `Deleted “${topic.name}”` });
          router.push('/topics');
        }}
      />
      {dialogs}
    </>
  );
}
