'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  UploadCloud,
  FolderKanban,
  FileText,
  Sparkles,
  CircleCheck,
  ArrowRight,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import type { Topic } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import {
  attentionItems,
  dashboardStats,
  recentDocuments,
  recentTopics,
  topicById,
} from '@/lib/selectors';
import { PageHeader } from '@/components/app/PageHeader';
import { TopicCard } from '@/components/topics/TopicCard';
import { TopicFormDialog } from '@/components/topics/TopicFormDialog';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { UploadDialog } from '@/components/documents/UploadDialog';
import { useDocumentActions } from '@/components/documents/useDocumentActions';
import { Button, ButtonLink } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { pluralize } from '@/lib/utils';
import styles from './dashboard.module.css';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView() {
  const { data, setTopicArchived, deleteTopic, runAnalysis } = useApp();
  const { notify } = useToast();
  const router = useRouter();
  const { menuItemsFor, dialogs } = useDocumentActions();

  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Topic | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Topic | null>(null);

  const stats = useMemo(() => dashboardStats(data), [data]);
  const topics = useMemo(() => recentTopics(data, 4), [data]);
  const documents = useMemo(() => recentDocuments(data, 4), [data]);
  const attention = useMemo(() => attentionItems(data, 4), [data]);

  const firstName = data.profile.fullName.split(' ')[0];
  const hasTopics = data.topics.length > 0;

  const metrics = [
    { label: 'Topics', value: stats.topicCount, icon: FolderKanban },
    { label: 'Documents', value: stats.documentCount, icon: FileText },
    { label: 'Analysed', value: stats.analyzedCount, icon: CircleCheck },
    { label: 'Recommendations', value: stats.openRecommendationCount, icon: Sparkles, accent: true },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        description={
          hasTopics
            ? 'Pick up where you left off, or start something new.'
            : 'Create your first topic to start organising your work.'
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => setUploadOpen(true)} disabled={!hasTopics}>
              <UploadCloud size={16} aria-hidden />
              Upload document
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden />
              Create topic
            </Button>
          </>
        }
      />

      {hasTopics ? (
        <ul className={styles.metrics}>
          {metrics.map((metric) => (
            <li key={metric.label} className={styles.metric}>
              <span className={metric.accent ? styles.metricIconAccent : styles.metricIcon} aria-hidden>
                <metric.icon size={15} />
              </span>
              <span className={styles.metricValue}>{metric.value}</span>
              <span className={styles.metricLabel}>{metric.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {!hasTopics ? (
        <EmptyState
          icon={FolderKanban}
          title="Create your first Topic to start organising your work"
          description="A topic is one project, job, goal or subject. Put every related document inside it and the AI will read them together rather than one at a time."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus size={16} aria-hidden />
              Create topic
            </Button>
          }
        />
      ) : (
        <>
          <section className={styles.section} aria-labelledby="recent-topics-heading">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle} id="recent-topics-heading">
                Recent topics
              </h2>
              <Link href="/topics" className={styles.sectionLink}>
                All topics
                <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
            <div className={styles.topicGrid}>
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onEdit={setEditTarget}
                  onDelete={setDeleteTarget}
                  onToggleArchive={(t) => {
                    setTopicArchived(t.id, !t.archived);
                    notify({ tone: 'success', title: t.archived ? 'Topic unarchived' : 'Topic archived' });
                  }}
                />
              ))}
            </div>
          </section>

          <div className={styles.columns}>
            <section className={styles.section} aria-labelledby="recent-documents-heading">
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="recent-documents-heading">
                  Recent documents
                </h2>
                <Button size="sm" variant="ghost" onClick={() => setUploadOpen(true)}>
                  <UploadCloud size={14} aria-hidden />
                  Upload
                </Button>
              </div>
              {documents.length === 0 ? (
                <EmptyState
                  size="sm"
                  icon={FileText}
                  title="No documents yet"
                  description="Upload your first document and AI will help you understand and improve it."
                  action={
                    <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
                      Upload a document
                    </Button>
                  }
                />
              ) : (
                <div className={styles.stack}>
                  {documents.map((doc) => {
                    const topic = topicById(data, doc.topicId);
                    return (
                      <DocumentCard
                        key={doc.id}
                        document={doc}
                        topicName={topic?.name}
                        topicHref={topic ? `/topics/${topic.id}` : undefined}
                        menuItems={menuItemsFor(doc, { includeOpen: true })}
                        onRetry={() => void runAnalysis(doc.id)}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            <section className={styles.section} aria-labelledby="attention-heading">
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle} id="attention-heading">
                  Needs your attention
                </h2>
                {stats.openRecommendationCount > 0 ? (
                  <span className={styles.countPill}>
                    {pluralize(stats.openRecommendationCount, 'open suggestion')}
                  </span>
                ) : null}
              </div>

              {attention.length === 0 ? (
                <EmptyState
                  size="sm"
                  icon={Inbox}
                  title="You're caught up"
                  description="Nothing is waiting on you. New suggestions appear here after a document is analysed."
                />
              ) : (
                <ul className={styles.attentionList}>
                  {attention.map((item) => (
                    <li key={item.document.id}>
                      <Link href={`/documents/${item.document.id}`} className={styles.attentionItem}>
                        <span
                          className={
                            item.reason === 'high-priority' ? styles.attentionAI : styles.attentionWarn
                          }
                          aria-hidden
                        >
                          {item.reason === 'high-priority' ? (
                            <Sparkles size={14} />
                          ) : (
                            <AlertTriangle size={14} />
                          )}
                        </span>
                        <span className={styles.attentionText}>
                          <span className={styles.attentionName}>{item.document.name}</span>
                          <span className={styles.attentionDetail}>
                            {item.detail}
                            {item.topic ? ` · ${item.topic.name}` : ''}
                          </span>
                        </span>
                        <ArrowRight size={14} className={styles.attentionArrow} aria-hidden />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <ButtonLink href="/topics" variant="secondary" size="sm" className={styles.viewAll}>
                Go to topics
              </ButtonLink>
            </section>
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
      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this topic?"
        tone="danger"
        confirmLabel="Delete topic"
        message={
          <>
            <strong>{deleteTarget?.name}</strong> and everything inside it — documents, analysis,
            recommendations and assistant history — will be deleted. This can&rsquo;t be undone.
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
      {dialogs}
    </>
  );
}
