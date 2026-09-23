/**
 * AI service contract.
 *
 * UI components never import a provider directly — they call the functions in
 * `./index`, which resolve to whichever provider is configured. The shapes here
 * mirror what a real backend would return from:
 *
 *   POST /api/documents/analyze
 *   POST /api/topics/analyze
 *   POST /api/topics/:id/chat
 */

import type {
  ChatMessage,
  DocumentAnalysis,
  DocumentRecord,
  Priority,
  Recommendation,
  Topic,
  TopicInsight,
  AppSettings,
} from '../../types';

/** Everything the model is told about the topic a document lives in. */
export interface TopicContext {
  id: string;
  name: string;
  description: string;
  /** User-authored goal — explicit, not inferred. */
  goal: string;
  tags: string[];
  /** Sibling documents, so analysis is contextual rather than per-file. */
  siblings: Array<{ id: string; name: string; documentType?: string; summary?: string }>;
}

export interface AnalyzeDocumentInput {
  document: Pick<
    DocumentRecord,
    'id' | 'name' | 'format' | 'sizeBytes' | 'extractedText' | 'textExtracted' | 'topicId'
  >;
  topicContext: TopicContext | null;
  preferences: Pick<
    AppSettings,
    'summaryStyle' | 'recommendationDetail' | 'includeTopicContext'
  >;
}

export interface AnalyzeDocumentResult {
  analysis: Omit<DocumentAnalysis, 'id'>;
  recommendations: Array<
    Omit<Recommendation, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  >;
}

export interface AnalyzeTopicInput {
  topic: Topic;
  documents: DocumentRecord[];
  analyses: DocumentAnalysis[];
  openRecommendations: Recommendation[];
}

export interface AnalyzeTopicResult {
  insights: Array<Omit<TopicInsight, 'id' | 'status' | 'createdAt'>>;
  generatedAt: string;
}

export interface AssistantInput {
  topic: Topic;
  documents: DocumentRecord[];
  analyses: DocumentAnalysis[];
  recommendations: Recommendation[];
  insights: TopicInsight[];
  question: string;
  history: ChatMessage[];
}

export interface AssistantResult {
  content: string;
  citations: Array<{ documentId: string; documentName: string }>;
}

export class AIServiceError extends Error {
  readonly retryable: boolean;
  readonly code: string;
  constructor(message: string, code = 'ai_error', retryable = true) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

export interface AIProvider {
  readonly name: string;
  analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentResult>;
  analyzeTopic(input: AnalyzeTopicInput): Promise<AnalyzeTopicResult>;
  askTopicAssistant(input: AssistantInput): Promise<AssistantResult>;
}

export type { Priority };
