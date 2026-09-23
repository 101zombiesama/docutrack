/**
 * Core domain model.
 *
 * Everything the app renders derives from these entities. Nothing that can be
 * computed (document counts, recommendation counts, "last updated") is stored
 * twice — see `src/lib/selectors.ts` for derived values.
 */

export type ID = string;
export type ISODate = string;

/* -------------------------------------------------------------------------- */
/* User & settings                                                            */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  id: ID;
  fullName: string;
  email: string;
  jobTitle: string;
  organization: string;
  bio: string;
  /** Data URL for an uploaded avatar, or null to fall back to initials. */
  avatarUrl: string | null;
  createdAt: ISODate;
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type ViewMode = 'grid' | 'list';
export type SummaryStyle = 'concise' | 'detailed';
export type DetailLevel = 'brief' | 'standard' | 'in-depth';

export interface AppSettings {
  /* General */
  theme: ThemePreference;
  language: string;
  defaultTopicView: ViewMode;
  defaultDocumentView: ViewMode;
  compactDensity: boolean;

  /* AI preferences */
  summaryStyle: SummaryStyle;
  recommendationDetail: DetailLevel;
  autoAnalyzeUploads: boolean;
  includeTopicContext: boolean;
  autoGenerateTopicInsights: boolean;

  /* Document preferences */
  confirmBeforeDelete: boolean;
  confirmBeforeRerun: boolean;
}

/* -------------------------------------------------------------------------- */
/* Topics                                                                     */
/* -------------------------------------------------------------------------- */

/** Accent keys map to a palette in `src/lib/appearance.ts`. */
export type TopicAccent =
  | 'indigo'
  | 'violet'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'lime'
  | 'slate';

export interface Topic {
  id: ID;
  name: string;
  description: string;
  /** User-stated objective. Used as explicit context for AI analysis. */
  goal: string;
  icon: string;
  accent: TopicAccent;
  tags: string[];
  archived: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

export type DocumentFormat =
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'txt'
  | 'md'
  | 'xlsx'
  | 'csv'
  | 'pptx'
  | 'rtf'
  | 'other';

/**
 * Lifecycle of a document from drop to analysed. The UI never skips straight
 * to `ready` — each stage is surfaced to the user.
 */
export type DocumentStatus =
  | 'queued'
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'recommending'
  | 'ready'
  | 'failed'
  | 'unanalyzed';

export interface DocumentRecord {
  id: ID;
  topicId: ID;
  name: string;
  format: DocumentFormat;
  sizeBytes: number;
  status: DocumentStatus;
  /** Short human label for the current status, e.g. "Understanding content…". */
  statusDetail?: string;
  /** 0–100, only meaningful while uploading. */
  progress?: number;
  /** Present when status === 'failed'. */
  error?: string;
  uploadedAt: ISODate;
  updatedAt: ISODate;
  /**
   * Text actually extracted from the file. Only plain-text formats can be read
   * in the browser today; binary formats leave this null and the UI says so.
   */
  extractedText: string | null;
  /** Whether a real extraction happened (vs. an unsupported binary format). */
  textExtracted: boolean;
  /** Object URL / data URL for download, when the original bytes are held. */
  downloadUrl?: string | null;
  source: 'seed' | 'upload';
  starred?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Analysis                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Provenance labelling. The product promise is that the user can always tell
 * what came from their document, what they typed, and what the model guessed.
 */
export type Provenance = 'extracted' | 'user' | 'inferred';

export interface KeyInformationItem {
  id: ID;
  label: string;
  value: string;
  provenance: Provenance;
}

export interface DocumentAnalysis {
  id: ID;
  documentId: ID;
  topicId: ID;
  /** AI-detected category, e.g. "CV / Resume". */
  documentType: string;
  summary: string;
  /** "What this document is" — role and nature of the document. */
  description: string;
  /** What the document appears intended to accomplish (AI-inferred). */
  inferredGoal: string;
  keyInformation: KeyInformationItem[];
  /** True when the topic's goal/description were supplied to the model. */
  usedTopicContext: boolean;
  /** Whether the model saw real extracted text or only file metadata. */
  basedOn: 'document-text' | 'file-metadata';
  confidence: 'low' | 'medium' | 'high';
  notes: string[];
  model: string;
  analyzedAt: ISODate;
}

export type Priority = 'high' | 'medium' | 'low';
export type RecommendationStatus = 'open' | 'resolved' | 'dismissed' | 'saved';

export interface Recommendation {
  id: ID;
  documentId: ID;
  topicId: ID;
  title: string;
  explanation: string;
  whyItMatters: string;
  suggestedAction: string;
  priority: Priority;
  /** Section of the document the suggestion points at, when identifiable. */
  section?: string;
  status: RecommendationStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/* Cross-document intelligence                                                */
/* -------------------------------------------------------------------------- */

export type InsightKind =
  | 'gap'
  | 'inconsistency'
  | 'overlap'
  | 'alignment'
  | 'next-step';

export interface TopicInsight {
  id: ID;
  topicId: ID;
  kind: InsightKind;
  title: string;
  body: string;
  suggestedAction?: string;
  relatedDocumentIds: ID[];
  priority: Priority;
  status: 'open' | 'dismissed';
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/* Assistant                                                                  */
/* -------------------------------------------------------------------------- */

export interface ChatCitation {
  documentId: ID;
  documentName: string;
}

export interface ChatMessage {
  id: ID;
  topicId: ID;
  role: 'user' | 'assistant';
  content: string;
  citations?: ChatCitation[];
  state: 'complete' | 'thinking' | 'error';
  createdAt: ISODate;
}

/* -------------------------------------------------------------------------- */
/* Store shape                                                                */
/* -------------------------------------------------------------------------- */

export interface AppData {
  profile: UserProfile;
  settings: AppSettings;
  topics: Topic[];
  documents: DocumentRecord[];
  analyses: DocumentAnalysis[];
  recommendations: Recommendation[];
  insights: TopicInsight[];
  messages: ChatMessage[];
  /** Topic ids whose insights are currently being regenerated. */
  version: number;
}
