/**
 * Derived reads over AppData.
 *
 * Counts are never stored — a topic's document count, recommendation count and
 * "needs attention" flags are all computed from the underlying collections, so
 * they can't drift apart between screens.
 */

import type {
  AppData,
  DocumentAnalysis,
  DocumentRecord,
  DocumentStatus,
  Priority,
  Recommendation,
  Topic,
  TopicInsight,
} from './types';
import { byUpdatedDesc, matches, unique } from './utils';

export const PROCESSING_STATUSES: DocumentStatus[] = [
  'queued',
  'uploading',
  'parsing',
  'analyzing',
  'recommending',
];

export function isProcessing(doc: DocumentRecord): boolean {
  return PROCESSING_STATUSES.includes(doc.status);
}

export function priorityRank(p: Priority): number {
  return p === 'high' ? 3 : p === 'medium' ? 2 : 1;
}

/* -------------------------------------------------------------------------- */
/* Lookups                                                                    */
/* -------------------------------------------------------------------------- */

export function topicById(data: AppData, id: string | undefined): Topic | undefined {
  return id ? data.topics.find((t) => t.id === id) : undefined;
}

export function documentById(data: AppData, id: string | undefined): DocumentRecord | undefined {
  return id ? data.documents.find((d) => d.id === id) : undefined;
}

export function analysisForDocument(
  data: AppData,
  documentId: string | undefined,
): DocumentAnalysis | undefined {
  return documentId ? data.analyses.find((a) => a.documentId === documentId) : undefined;
}

export function recommendationsForDocument(
  data: AppData,
  documentId: string | undefined,
): Recommendation[] {
  if (!documentId) return [];
  return data.recommendations
    .filter((r) => r.documentId === documentId)
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
}

export function documentsForTopic(data: AppData, topicId: string): DocumentRecord[] {
  return data.documents.filter((d) => d.topicId === topicId).sort(byUpdatedDesc);
}

export function insightsForTopic(data: AppData, topicId: string): TopicInsight[] {
  return data.insights
    .filter((i) => i.topicId === topicId)
    .sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
}

export function messagesForTopic(data: AppData, topicId: string) {
  return data.messages.filter((m) => m.topicId === topicId);
}

/** The AI-detected category for a document, or a neutral fallback. */
export function documentTypeLabel(data: AppData, doc: DocumentRecord): string | null {
  return analysisForDocument(data, doc.id)?.documentType ?? null;
}

/* -------------------------------------------------------------------------- */
/* Aggregates                                                                 */
/* -------------------------------------------------------------------------- */

export interface TopicStats {
  documentCount: number;
  analyzedCount: number;
  processingCount: number;
  failedCount: number;
  unanalyzedCount: number;
  openRecommendations: number;
  highPriorityCount: number;
  openInsights: number;
  /** Distinct AI-detected document types, for the card preview line. */
  typePreview: string[];
  lastActivity: string;
}

export function topicStats(data: AppData, topicId: string): TopicStats {
  const docs = documentsForTopic(data, topicId);
  const docIds = new Set(docs.map((d) => d.id));
  const open = data.recommendations.filter((r) => docIds.has(r.documentId) && r.status === 'open');
  const topic = topicById(data, topicId);

  const timestamps = [topic?.updatedAt, ...docs.map((d) => d.updatedAt)].filter(Boolean) as string[];
  const lastActivity =
    timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ??
    topic?.createdAt ??
    new Date().toISOString();

  return {
    documentCount: docs.length,
    analyzedCount: docs.filter((d) => d.status === 'ready').length,
    processingCount: docs.filter(isProcessing).length,
    failedCount: docs.filter((d) => d.status === 'failed').length,
    unanalyzedCount: docs.filter((d) => d.status === 'unanalyzed').length,
    openRecommendations: open.length,
    highPriorityCount: open.filter((r) => r.priority === 'high').length,
    openInsights: data.insights.filter((i) => i.topicId === topicId && i.status === 'open').length,
    typePreview: unique(
      docs
        .map((d) => documentTypeLabel(data, d))
        .filter((t): t is string => Boolean(t) && t !== 'Document'),
    ).slice(0, 4),
    lastActivity,
  };
}

export interface DashboardStats {
  topicCount: number;
  documentCount: number;
  analyzedCount: number;
  openRecommendationCount: number;
  processingCount: number;
  attentionCount: number;
}

export function dashboardStats(data: AppData): DashboardStats {
  const active = data.topics.filter((t) => !t.archived);
  const activeIds = new Set(active.map((t) => t.id));
  const docs = data.documents.filter((d) => activeIds.has(d.topicId));
  const docIds = new Set(docs.map((d) => d.id));

  return {
    topicCount: active.length,
    documentCount: docs.length,
    analyzedCount: docs.filter((d) => d.status === 'ready').length,
    openRecommendationCount: data.recommendations.filter(
      (r) => docIds.has(r.documentId) && r.status === 'open',
    ).length,
    processingCount: docs.filter(isProcessing).length,
    attentionCount: docs.filter((d) => d.status === 'failed' || d.status === 'unanalyzed').length,
  };
}

export function recentTopics(data: AppData, limit = 4): Topic[] {
  return data.topics.filter((t) => !t.archived).sort(byUpdatedDesc).slice(0, limit);
}

export function recentDocuments(data: AppData, limit = 5): DocumentRecord[] {
  const activeIds = new Set(data.topics.filter((t) => !t.archived).map((t) => t.id));
  return data.documents
    .filter((d) => activeIds.has(d.topicId))
    .sort(byUpdatedDesc)
    .slice(0, limit);
}

/** Documents that can't be left alone: failed, never analysed, or high-priority work. */
export interface AttentionItem {
  document: DocumentRecord;
  topic: Topic | undefined;
  reason: 'failed' | 'unanalyzed' | 'high-priority';
  detail: string;
}

export function attentionItems(data: AppData, limit = 5): AttentionItem[] {
  const activeIds = new Set(data.topics.filter((t) => !t.archived).map((t) => t.id));
  const items: AttentionItem[] = [];

  for (const doc of data.documents) {
    if (!activeIds.has(doc.topicId)) continue;
    const topic = topicById(data, doc.topicId);
    if (doc.status === 'failed') {
      items.push({ document: doc, topic, reason: 'failed', detail: 'Analysis failed — you can retry it' });
    } else if (doc.status === 'unanalyzed') {
      items.push({ document: doc, topic, reason: 'unanalyzed', detail: 'Uploaded but never analysed' });
    } else {
      const high = data.recommendations.filter(
        (r) => r.documentId === doc.id && r.status === 'open' && r.priority === 'high',
      );
      if (high.length) {
        items.push({
          document: doc,
          topic,
          reason: 'high-priority',
          detail: `${high.length} high-priority suggestion${high.length === 1 ? '' : 's'}`,
        });
      }
    }
  }

  const order = { failed: 0, unanalyzed: 1, 'high-priority': 2 } as const;
  return items
    .sort(
      (a, b) =>
        order[a.reason] - order[b.reason] ||
        new Date(b.document.updatedAt).getTime() - new Date(a.document.updatedAt).getTime(),
    )
    .slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Search                                                                     */
/* -------------------------------------------------------------------------- */

export interface DocumentSearchHit {
  document: DocumentRecord;
  topic: Topic | undefined;
  analysis: DocumentAnalysis | undefined;
  /** Where the query matched, so results can explain themselves. */
  matchedOn: string[];
}

export interface SearchResults {
  topics: Topic[];
  documents: DocumentSearchHit[];
  total: number;
}

export function search(data: AppData, query: string): SearchResults {
  const q = query.trim();
  if (!q) return { topics: [], documents: [], total: 0 };

  const topics = data.topics.filter(
    (t) =>
      matches(t.name, q) ||
      matches(t.description, q) ||
      matches(t.goal, q) ||
      t.tags.some((tag) => matches(tag, q)),
  );

  const documents: DocumentSearchHit[] = [];
  for (const doc of data.documents) {
    const analysis = analysisForDocument(data, doc.id);
    const matchedOn: string[] = [];
    if (matches(doc.name, q)) matchedOn.push('name');
    if (matches(doc.format, q)) matchedOn.push('file type');
    if (analysis) {
      if (matches(analysis.documentType, q)) matchedOn.push('document type');
      if (matches(analysis.summary, q)) matchedOn.push('AI summary');
      if (matches(analysis.inferredGoal, q)) matchedOn.push('document goal');
      if (analysis.keyInformation.some((k) => matches(k.value, q))) matchedOn.push('key information');
    }
    if (doc.textExtracted && doc.extractedText && matches(doc.extractedText, q)) {
      matchedOn.push('document text');
    }
    if (matchedOn.length) {
      documents.push({ document: doc, topic: topicById(data, doc.topicId), analysis, matchedOn });
    }
  }

  documents.sort((a, b) => byUpdatedDesc(a.document, b.document));
  return { topics, documents, total: topics.length + documents.length };
}
