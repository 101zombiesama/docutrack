'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileQuestion,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  Target,
  FileText,
  Info,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
} from 'lucide-react';
import type { Priority, RecommendationStatus } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import {
  analysisForDocument,
  documentById,
  isProcessing,
  recommendationsForDocument,
  topicById,
} from '@/lib/selectors';
import { formatMeta } from '@/lib/appearance';
import { PageHeader } from '@/components/app/PageHeader';
import { AnalysisStatus } from '@/components/documents/AnalysisStatus';
import { useDocumentActions } from '@/components/documents/useDocumentActions';
import { AIPanel } from '@/components/ai/AIPanel';
import { ProvenanceTag } from '@/components/ai/Provenance';
import { RecommendationCard } from '@/components/ai/RecommendationCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Menu } from '@/components/ui/Menu';
import { Segmented } from '@/components/ui/Segmented';
import { Tabs, TabPanel } from '@/components/ui/Tabs';
import { useToast } from '@/components/ui/Toast';
import { formatBytes, formatDateTime, formatRelative, truncate } from '@/lib/utils';
import styles from './document.module.css';

type TabKey = 'overview' | 'recommendations' | 'details';
type PriorityFilter = 'all' | Priority;

export function DocumentDetail({ documentId }: { documentId: string }) {
  const { data, runAnalysis, setRecommendationStatus } = useApp();
  const { notify } = useToast();
  const router = useRouter();
  const { menuItemsFor, dialogs, download } = useDocumentActions();

  const [tab, setTab] = useState<TabKey>('overview');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [showClosed, setShowClosed] = useState(false);

  const doc = documentById(data, documentId);
  const analysis = analysisForDocument(data, documentId);
  const topic = topicById(data, doc?.topicId);
  const recommendations = useMemo(
    () => recommendationsForDocument(data, documentId),
    [data, documentId],
  );

  const open = recommendations.filter((r) => r.status === 'open' || r.status === 'saved');
  const closed = recommendations.filter((r) => r.status === 'resolved' || r.status === 'dismissed');

  const filtered = (showClosed ? closed : open).filter((r) =>
    priorityFilter === 'all' ? true : r.priority === priorityFilter,
  );

  if (!doc) {
    return (
      <>
        <PageHeader title="Document not found" backHref="/topics" backLabel="All topics" />
        <EmptyState
          icon={FileQuestion}
          title="This document doesn't exist"
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

  const meta = formatMeta(doc.format);
  const FormatIcon = meta.icon;
  const busy = isProcessing(doc);

  return (
    <>
      <PageHeader
        backHref={topic ? `/topics/${topic.id}` : '/topics'}
        backLabel={topic ? topic.name : 'All topics'}
        eyebrow={
          <>
            <span className={styles.formatBadge} style={{ color: meta.color }}>
              <FormatIcon size={13} aria-hidden />
              {meta.label}
            </span>
            {analysis ? <span className={styles.typeBadge}>{analysis.documentType}</span> : null}
            {topic ? (
              <Link href={`/topics/${topic.id}`} className={styles.topicLink}>
                {topic.name}
              </Link>
            ) : null}
          </>
        }
        title={doc.name}
        actions={
          <>
            <Button
              variant={doc.status === 'ready' ? 'secondary' : 'primary'}
              onClick={() => void runAnalysis(doc.id)}
              disabled={busy}
              loading={busy}
            >
              {busy ? null : doc.status === 'ready' ? (
                <RefreshCw size={15} aria-hidden />
              ) : (
                <Sparkles size={15} aria-hidden />
              )}
              {doc.status === 'ready' ? 'Re-run analysis' : 'Run analysis'}
            </Button>
            <Menu
              label={`More actions for ${doc.name}`}
              trigger={<MoreHorizontal size={17} aria-hidden />}
              items={menuItemsFor(doc)}
            />
          </>
        }
      />

      <div className={styles.layout}>
        {/* --- Left: the document itself ---------------------------------- */}
        <section className={styles.docPanel} aria-labelledby="document-panel-heading">
          <header className={styles.docPanelHead}>
            <h2 className={styles.docPanelTitle} id="document-panel-heading">
              <Eye size={15} aria-hidden />
              Document
            </h2>
            <AnalysisStatus document={doc} detailed />
          </header>

          <dl className={styles.facts}>
            <div>
              <dt>Type</dt>
              <dd>{meta.label}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatBytes(doc.sizeBytes)}</dd>
            </div>
            <div>
              <dt>Uploaded</dt>
              <dd>{formatDateTime(doc.uploadedAt)}</dd>
            </div>
            <div>
              <dt>Topic</dt>
              <dd>
                {topic ? (
                  <Link href={`/topics/${topic.id}`} className={styles.inlineLink}>
                    {topic.name}
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>

          <div className={styles.preview}>
            {doc.textExtracted && doc.extractedText ? (
              <>
                <p className={styles.previewLabel}>
                  <FileText size={12} aria-hidden />
                  Text read from this file
                </p>
                <pre className={styles.previewText}>{truncate(doc.extractedText, 4000)}</pre>
              </>
            ) : (
              <div className={styles.previewUnavailable}>
                <p className={styles.previewLabel}>
                  <Info size={12} aria-hidden />
                  Preview not available
                </p>
                <p className={styles.previewBody}>
                  {meta.label} files need a server-side parser to read, and this build doesn&rsquo;t
                  have one connected. The original file is unchanged — nothing here has modified it.
                </p>
                <Button size="sm" variant="secondary" onClick={() => download(doc)}>
                  <Download size={14} aria-hidden />
                  Download original
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* --- Right: AI analysis ----------------------------------------- */}
        <section className={styles.aiPanel} aria-label="AI analysis">
          <Tabs
            label="Document analysis"
            idPrefix="doc"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'overview', label: 'Overview', icon: <Sparkles size={14} /> },
              {
                value: 'recommendations',
                label: 'Recommendations',
                count: open.length,
                icon: <ListChecks size={14} />,
              },
              { value: 'details', label: 'Details', icon: <Info size={14} /> },
            ]}
          />

          {busy ? (
            <TabPanel idPrefix="doc" value={tab}>
              <div className={styles.processing} role="status" aria-live="polite">
                <Loader2 size={20} className={styles.spin} aria-hidden />
                <h3 className={styles.processingTitle}>Analysing your document…</h3>
                <p className={styles.processingBody}>
                  {doc.statusDetail ?? 'Understanding its content, purpose, and context.'}
                </p>
              </div>
            </TabPanel>
          ) : doc.status === 'failed' ? (
            <TabPanel idPrefix="doc" value={tab}>
              <div className={styles.failed} role="alert">
                <span className={styles.failedIcon} aria-hidden>
                  <AlertTriangle size={18} />
                </span>
                <h3 className={styles.processingTitle}>We couldn&rsquo;t analyse this document</h3>
                <p className={styles.processingBody}>
                  {doc.error ?? 'The analysis service did not return a usable response.'} The document
                  is still available. You can retry the analysis.
                </p>
                <Button variant="primary" onClick={() => void runAnalysis(doc.id)}>
                  <RefreshCw size={15} aria-hidden />
                  Retry analysis
                </Button>
              </div>
            </TabPanel>
          ) : !analysis ? (
            <TabPanel idPrefix="doc" value={tab}>
              <EmptyState
                icon={Sparkles}
                title="This document hasn't been analysed yet"
                description="Run analysis to get a summary, an inferred goal and suggestions based on this topic."
                action={
                  <Button variant="primary" onClick={() => void runAnalysis(doc.id)}>
                    <Sparkles size={15} aria-hidden />
                    Run analysis
                  </Button>
                }
              />
            </TabPanel>
          ) : tab === 'overview' ? (
            <TabPanel idPrefix="doc" value="overview">
              <div className={styles.tabBody}>
                <AIPanel
                  title="AI summary"
                  subtitle={`Generated ${formatRelative(analysis.analyzedAt)}${
                    analysis.usedTopicContext && topic ? ` using “${topic.name}” as context` : ''
                  }`}
                  footnote={
                    analysis.basedOn === 'file-metadata'
                      ? 'Based on the file name, type and topic context — not on the text inside the file.'
                      : 'Based on the text read from this file plus the topic it belongs to.'
                  }
                >
                  <p className={styles.summary}>{analysis.summary}</p>

                  <div className={styles.block}>
                    <h3 className={styles.blockTitle}>
                      What is this document?
                      <ProvenanceTag provenance="inferred" />
                    </h3>
                    <p className={styles.blockText}>{analysis.description}</p>
                  </div>

                  <div className={styles.block}>
                    <h3 className={styles.blockTitle}>
                      Document goal
                      <ProvenanceTag provenance="inferred" />
                    </h3>
                    <p className={styles.blockText}>{analysis.inferredGoal}</p>
                    {topic?.goal ? (
                      <p className={styles.goalCompare}>
                        <Target size={12} aria-hidden />
                        <span>
                          <strong>Your topic goal:</strong> {topic.goal}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </AIPanel>

                <section className={styles.keyInfo} aria-labelledby="key-info-heading">
                  <h3 className={styles.sectionTitle} id="key-info-heading">
                    Key information
                  </h3>
                  {analysis.keyInformation.length === 0 ? (
                    <p className={styles.blockText}>Nothing notable was extracted from this file.</p>
                  ) : (
                    <dl className={styles.keyList}>
                      {analysis.keyInformation.map((item) => (
                        <div key={item.id} className={styles.keyItem}>
                          <dt>
                            {item.label}
                            <ProvenanceTag provenance={item.provenance} />
                          </dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </section>

                {analysis.notes.length > 0 ? (
                  <div className={styles.notes}>
                    {analysis.notes.map((note) => (
                      <p key={note} className={styles.note}>
                        <Info size={13} aria-hidden />
                        {note}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </TabPanel>
          ) : tab === 'recommendations' ? (
            <TabPanel idPrefix="doc" value="recommendations">
              <div className={styles.tabBody}>
                <div className={styles.recToolbar}>
                  <Segmented
                    label="Filter by priority"
                    size="sm"
                    value={priorityFilter}
                    onChange={setPriorityFilter}
                    options={[
                      { value: 'all', label: 'All' },
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
                    ]}
                  />
                  <Segmented
                    label="Recommendation status"
                    size="sm"
                    value={showClosed ? 'closed' : 'open'}
                    onChange={(value) => setShowClosed(value === 'closed')}
                    options={[
                      { value: 'open', label: 'Active', count: open.length },
                      { value: 'closed', label: 'Handled', count: closed.length },
                    ]}
                  />
                </div>

                {filtered.length === 0 ? (
                  <EmptyState
                    size="sm"
                    icon={CheckCircle2}
                    title={showClosed ? 'Nothing handled yet' : "You're caught up"}
                    description={
                      showClosed
                        ? 'Recommendations you resolve or dismiss are kept here.'
                        : priorityFilter !== 'all'
                          ? `No active ${priorityFilter}-priority recommendations for this document.`
                          : 'No active recommendations for this document.'
                    }
                    action={
                      priorityFilter !== 'all' ? (
                        <Button size="sm" variant="secondary" onClick={() => setPriorityFilter('all')}>
                          Show all priorities
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <div className={styles.recList}>
                    {filtered.map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        onStatusChange={(status: RecommendationStatus) => {
                          setRecommendationStatus(rec.id, status);
                          if (status === 'resolved')
                            notify({ tone: 'success', title: 'Marked as resolved' });
                          if (status === 'dismissed') notify({ tone: 'info', title: 'Recommendation dismissed' });
                          if (status === 'saved') notify({ tone: 'info', title: 'Saved for later' });
                        }}
                      />
                    ))}
                  </div>
                )}

                <p className={styles.recFootnote}>
                  Recommendations are suggestions about your document. Nothing here changes the
                  original file — any edits are yours to make.
                </p>
              </div>
            </TabPanel>
          ) : (
            <TabPanel idPrefix="doc" value="details">
              <div className={styles.tabBody}>
                <dl className={styles.detailList}>
                  <div>
                    <dt>File name</dt>
                    <dd>{doc.name}</dd>
                  </div>
                  <div>
                    <dt>File type</dt>
                    <dd>{meta.label}</dd>
                  </div>
                  <div>
                    <dt>Size</dt>
                    <dd>{formatBytes(doc.sizeBytes)}</dd>
                  </div>
                  <div>
                    <dt>Uploaded</dt>
                    <dd>{formatDateTime(doc.uploadedAt)}</dd>
                  </div>
                  <div>
                    <dt>Last updated</dt>
                    <dd>{formatDateTime(doc.updatedAt)}</dd>
                  </div>
                  <div>
                    <dt>Last analysed</dt>
                    <dd>{formatDateTime(analysis.analyzedAt)}</dd>
                  </div>
                  <div>
                    <dt>Detected type</dt>
                    <dd>
                      {analysis.documentType} <ProvenanceTag provenance="inferred" />
                    </dd>
                  </div>
                  <div>
                    <dt>Analysis based on</dt>
                    <dd>
                      {analysis.basedOn === 'document-text'
                        ? 'Text read from the file'
                        : 'File name, type and topic context only'}
                    </dd>
                  </div>
                  <div>
                    <dt>Topic context used</dt>
                    <dd>{analysis.usedTopicContext ? 'Yes' : 'No'}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd className={styles.capitalize}>{analysis.confidence}</dd>
                  </div>
                  <div>
                    <dt>Model</dt>
                    <dd className={styles.mono}>{analysis.model}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{doc.source === 'seed' ? 'Demonstration data' : 'Uploaded by you'}</dd>
                  </div>
                </dl>

                {analysis.notes.length > 0 ? (
                  <div className={styles.notes}>
                    {analysis.notes.map((note) => (
                      <p key={note} className={styles.note}>
                        <Info size={13} aria-hidden />
                        {note}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </TabPanel>
          )}
        </section>
      </div>
      {dialogs}
    </>
  );
}
