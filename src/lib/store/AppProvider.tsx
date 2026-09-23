'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type {
  AppData,
  AppSettings,
  ChatMessage,
  DocumentRecord,
  RecommendationStatus,
  Topic,
  TopicAccent,
  UserProfile,
} from '../types';
import { DEFAULT_SETTINGS } from '../defaults';
import { createSeedData } from '../seed';
import { clearState, loadState, saveState } from '../storage';
import { applyTheme } from '../theme';
import { formatOf, nowISO, uid } from '../utils';
import { analysisForDocument, documentsForTopic, topicById } from '../selectors';
import { parseDocument, uploadFile, validateFile, ParseError } from '../services/parser';
import { AIServiceError, analyzeDocument, analyzeTopic, askTopicAssistant } from '../services/ai';
import { reducer } from './reducer';
import { useToast } from '@/components/ui/Toast';

/* -------------------------------------------------------------------------- */

const EMPTY: AppData = {
  profile: {
    id: 'user_local',
    fullName: '',
    email: '',
    jobTitle: '',
    organization: '',
    bio: '',
    avatarUrl: null,
    createdAt: '1970-01-01T00:00:00.000Z',
  },
  settings: DEFAULT_SETTINGS,
  topics: [],
  documents: [],
  analyses: [],
  recommendations: [],
  insights: [],
  messages: [],
  version: 1,
};

export interface TopicInput {
  name: string;
  description: string;
  goal: string;
  icon: string;
  accent: TopicAccent;
  tags: string[];
}

export interface UploadOutcome {
  accepted: number;
  rejected: Array<{ name: string; reason: string }>;
}

interface AppContextValue {
  data: AppData;
  ready: boolean;
  storageNotice: string | null;
  dismissStorageNotice: () => void;
  /** Topic ids whose cross-document insights are being regenerated. */
  insightsPending: Record<string, boolean>;
  insightsError: Record<string, string | null>;
  assistantPending: Record<string, boolean>;

  createTopic: (input: TopicInput) => Topic;
  updateTopic: (id: string, patch: Partial<Topic>) => void;
  deleteTopic: (id: string) => void;
  setTopicArchived: (id: string, archived: boolean) => void;

  uploadDocuments: (topicId: string, files: File[]) => Promise<UploadOutcome>;
  runAnalysis: (documentId: string) => Promise<void>;
  renameDocument: (id: string, name: string) => void;
  moveDocument: (id: string, topicId: string) => void;
  deleteDocument: (id: string) => void;

  setRecommendationStatus: (id: string, status: RecommendationStatus) => void;
  generateInsights: (topicId: string) => Promise<void>;
  dismissInsight: (id: string) => void;

  sendAssistantMessage: (topicId: string, question: string) => Promise<void>;
  clearAssistant: (topicId: string) => void;

  updateProfile: (patch: Partial<UserProfile>) => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  restoreDemoData: () => void;
  deleteAllData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

/* -------------------------------------------------------------------------- */

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, EMPTY);
  const [ready, setReady] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [insightsPending, setInsightsPending] = useState<Record<string, boolean>>({});
  const [insightsError, setInsightsError] = useState<Record<string, string | null>>({});
  const [assistantPending, setAssistantPending] = useState<Record<string, boolean>>({});
  const { notify } = useToast();

  // Async work reads the newest state through this ref, never a stale closure.
  const dataRef = useRef(data);
  dataRef.current = data;

  /* --- Hydration -------------------------------------------------------- */
  useEffect(() => {
    const { data: stored, error } = loadState();
    dispatch({ type: 'hydrate', data: stored ?? createSeedData() });
    if (error) setStorageNotice(error);
    setReady(true);
  }, []);

  /* --- Persistence (debounced) ------------------------------------------ */
  useEffect(() => {
    if (!ready) return;
    const handle = setTimeout(() => {
      const outcome = saveState(data);
      if (!outcome.ok) setStorageNotice(outcome.reason);
    }, 220);
    return () => clearTimeout(handle);
  }, [data, ready]);

  /* --- Theme ------------------------------------------------------------- */
  useEffect(() => {
    if (!ready) return;
    applyTheme(data.settings.theme);
    if (data.settings.theme !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [data.settings.theme, ready]);

  /* --- Interface density -------------------------------------------------- */
  useEffect(() => {
    if (!ready) return;
    if (data.settings.compactDensity) document.documentElement.dataset.density = 'compact';
    else delete document.documentElement.dataset.density;
  }, [data.settings.compactDensity, ready]);

  /* --- Topics ------------------------------------------------------------ */
  const createTopic = useCallback((input: TopicInput): Topic => {
    const stamp = nowISO();
    const topic: Topic = {
      id: uid('topic'),
      name: input.name.trim(),
      description: input.description.trim(),
      goal: input.goal.trim(),
      icon: input.icon,
      accent: input.accent,
      tags: input.tags,
      archived: false,
      createdAt: stamp,
      updatedAt: stamp,
    };
    dispatch({ type: 'topic/add', topic });
    return topic;
  }, []);

  const updateTopic = useCallback((id: string, patch: Partial<Topic>) => {
    dispatch({ type: 'topic/patch', id, patch });
  }, []);

  const deleteTopic = useCallback((id: string) => {
    dispatch({ type: 'topic/delete', id });
  }, []);

  const setTopicArchived = useCallback((id: string, archived: boolean) => {
    dispatch({ type: 'topic/patch', id, patch: { archived } });
  }, []);

  /* --- Document pipeline -------------------------------------------------- */

  /**
   * Runs analysis for a document that already exists in the store. Shared by
   * the upload flow, the retry button and "re-run analysis".
   *
   * `freshlyParsed` exists because the upload pipeline dispatches the parse
   * result and analyses in the same tick: the store copy has not re-rendered
   * yet, so the extracted text is handed over directly rather than read back.
   */
  const analyseExisting = useCallback(
    async (
      documentId: string,
      freshlyParsed?: Pick<DocumentRecord, 'extractedText' | 'textExtracted' | 'format'>,
    ) => {
      const patch = dispatch;
      const current = dataRef.current;
      const stored = current.documents.find((d) => d.id === documentId);
      if (!stored) return;
      const doc = freshlyParsed ? { ...stored, ...freshlyParsed } : stored;

      patch({
        type: 'document/patch',
        id: doc.id,
        patch: { status: 'analyzing', statusDetail: 'Understanding content…', error: undefined },
      });

      const topic = topicById(current, doc.topicId);
      const siblings = documentsForTopic(current, doc.topicId)
        .filter((d) => d.id !== doc.id && d.status === 'ready')
        .slice(0, 8)
        .map((d) => {
          const analysis = analysisForDocument(current, d.id);
          return {
            id: d.id,
            name: d.name,
            documentType: analysis?.documentType,
            summary: analysis?.summary,
          };
        });

      try {
        const result = await analyzeDocument({
          document: {
            id: doc.id,
            name: doc.name,
            format: doc.format,
            sizeBytes: doc.sizeBytes,
            extractedText: doc.extractedText,
            textExtracted: doc.textExtracted,
            topicId: doc.topicId,
          },
          topicContext: topic
            ? {
                id: topic.id,
                name: topic.name,
                description: topic.description,
                goal: topic.goal,
                tags: topic.tags,
                siblings,
              }
            : null,
          preferences: {
            summaryStyle: current.settings.summaryStyle,
            recommendationDetail: current.settings.recommendationDetail,
            includeTopicContext: current.settings.includeTopicContext,
          },
        });

        patch({
          type: 'document/patch',
          id: doc.id,
          patch: { status: 'recommending', statusDetail: 'Generating recommendations…' },
        });
        await new Promise((r) => setTimeout(r, 550));

        const stamp = nowISO();
        patch({
          type: 'analysis/set',
          analysis: { ...result.analysis, id: uid('an') },
          recommendations: result.recommendations.map((rec) => ({
            ...rec,
            id: uid('rec'),
            status: 'open' as const,
            createdAt: stamp,
            updatedAt: stamp,
          })),
        });
        patch({
          type: 'document/patch',
          id: doc.id,
          patch: { status: 'ready', statusDetail: undefined, error: undefined, progress: undefined },
        });
      } catch (error) {
        const message =
          error instanceof AIServiceError
            ? error.message
            : 'Something went wrong while analysing this document.';
        patch({
          type: 'document/patch',
          id: doc.id,
          patch: { status: 'failed', statusDetail: 'Analysis failed', error: message },
        });
        throw error;
      }
    },
    [],
  );

  const uploadDocuments = useCallback(
    async (topicId: string, files: File[]): Promise<UploadOutcome> => {
      const rejected: Array<{ name: string; reason: string }> = [];
      const accepted: File[] = [];

      for (const file of files) {
        const validation = validateFile(file);
        if (validation.ok) accepted.push(file);
        else rejected.push({ name: file.name, reason: validation.reason! });
      }

      // Files are processed one at a time so each stage stays observable.
      for (const file of accepted) {
        const id = uid('doc');
        const stamp = nowISO();
        const record: DocumentRecord = {
          id,
          topicId,
          name: file.name,
          format: formatOf(file.name),
          sizeBytes: file.size,
          status: 'uploading',
          statusDetail: 'Uploading…',
          progress: 0,
          uploadedAt: stamp,
          updatedAt: stamp,
          extractedText: null,
          textExtracted: false,
          downloadUrl: null,
          source: 'upload',
        };
        dispatch({ type: 'document/add', document: record });

        try {
          const { downloadUrl } = await uploadFile(file, (progress) => {
            dispatch({ type: 'document/patch', id, patch: { progress } });
          });

          dispatch({
            type: 'document/patch',
            id,
            patch: { status: 'parsing', statusDetail: 'Reading document…', downloadUrl, progress: 100 },
          });

          const parsed = await parseDocument(file);
          dispatch({
            type: 'document/patch',
            id,
            patch: {
              extractedText: parsed.text,
              textExtracted: parsed.textExtracted,
              format: parsed.format,
            },
          });

          if (!dataRef.current.settings.autoAnalyzeUploads) {
            dispatch({
              type: 'document/patch',
              id,
              patch: { status: 'unanalyzed', statusDetail: 'Waiting for analysis' },
            });
            continue;
          }

          await analyseExisting(id, {
            extractedText: parsed.text,
            textExtracted: parsed.textExtracted,
            format: parsed.format,
          });
        } catch (error) {
          const message =
            error instanceof ParseError || error instanceof AIServiceError
              ? error.message
              : 'Something went wrong while processing this file.';
          dispatch({
            type: 'document/patch',
            id,
            patch: {
              status: 'failed',
              statusDetail: 'Processing failed',
              error: message,
              progress: undefined,
            },
          });
          notify({
            tone: 'error',
            title: `Couldn't finish ${file.name}`,
            description: 'The document is still here — you can retry the analysis.',
          });
        }
      }

      if (accepted.length > 0 && dataRef.current.settings.autoGenerateTopicInsights) {
        await generateInsightsRef.current?.(topicId);
      }

      return { accepted: accepted.length, rejected };
    },
    [analyseExisting, notify],
  );

  const runAnalysis = useCallback(
    async (documentId: string) => {
      try {
        await analyseExisting(documentId);
        notify({ tone: 'success', title: 'Analysis complete' });
      } catch {
        notify({
          tone: 'error',
          title: "We couldn't analyse this document",
          description: 'The document is still available. You can retry the analysis.',
        });
      }
    },
    [analyseExisting, notify],
  );

  const renameDocument = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'document/patch', id, patch: { name: trimmed, format: formatOf(trimmed) } });
  }, []);

  const moveDocument = useCallback((id: string, topicId: string) => {
    dispatch({ type: 'document/move', id, topicId });
  }, []);

  const deleteDocument = useCallback((id: string) => {
    dispatch({ type: 'document/delete', id });
  }, []);

  /* --- Recommendations ---------------------------------------------------- */
  const setRecommendationStatus = useCallback((id: string, status: RecommendationStatus) => {
    dispatch({ type: 'recommendation/patch', id, patch: { status } });
  }, []);

  /* --- Topic insights ------------------------------------------------------ */
  // Indirection so the upload pipeline can trigger insights declared below it.
  const generateInsightsRef = useRef<((topicId: string) => Promise<void>) | null>(null);

  const generateInsights = useCallback(async (topicId: string) => {
    const current = dataRef.current;
    const topic = topicById(current, topicId);
    if (!topic) return;

    setInsightsPending((p) => ({ ...p, [topicId]: true }));
    setInsightsError((e) => ({ ...e, [topicId]: null }));

    const documents = documentsForTopic(current, topicId);
    const docIds = new Set(documents.map((d) => d.id));

    try {
      const result = await analyzeTopic({
        topic,
        documents,
        analyses: current.analyses.filter((a) => docIds.has(a.documentId)),
        openRecommendations: current.recommendations.filter(
          (r) => docIds.has(r.documentId) && r.status === 'open',
        ),
      });
      dispatch({
        type: 'insights/set',
        topicId,
        insights: result.insights.map((insight) => ({
          ...insight,
          id: uid('ins'),
          status: 'open' as const,
          createdAt: result.generatedAt,
        })),
      });
    } catch (error) {
      setInsightsError((e) => ({
        ...e,
        [topicId]:
          error instanceof AIServiceError
            ? error.message
            : 'Topic insights could not be generated.',
      }));
    } finally {
      setInsightsPending((p) => ({ ...p, [topicId]: false }));
    }
  }, []);

  generateInsightsRef.current = generateInsights;

  const dismissInsight = useCallback((id: string) => {
    dispatch({ type: 'insight/patch', id, patch: { status: 'dismissed' } });
  }, []);

  /* --- Assistant ----------------------------------------------------------- */
  const sendAssistantMessage = useCallback(
    async (topicId: string, question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const current = dataRef.current;
      const topic = topicById(current, topicId);
      if (!topic) return;

      const userMessage: ChatMessage = {
        id: uid('msg'),
        topicId,
        role: 'user',
        content: trimmed,
        state: 'complete',
        createdAt: nowISO(),
      };
      const placeholderId = uid('msg');
      dispatch({ type: 'message/add', message: userMessage });
      dispatch({
        type: 'message/add',
        message: {
          id: placeholderId,
          topicId,
          role: 'assistant',
          content: '',
          state: 'thinking',
          createdAt: nowISO(),
        },
      });
      setAssistantPending((p) => ({ ...p, [topicId]: true }));

      const documents = documentsForTopic(current, topicId);
      const docIds = new Set(documents.map((d) => d.id));

      try {
        const reply = await askTopicAssistant({
          topic,
          documents,
          analyses: current.analyses.filter((a) => docIds.has(a.documentId)),
          recommendations: current.recommendations.filter((r) => docIds.has(r.documentId)),
          insights: current.insights.filter((i) => i.topicId === topicId),
          question: trimmed,
          history: current.messages.filter((m) => m.topicId === topicId).slice(-6),
        });
        dispatch({
          type: 'message/patch',
          id: placeholderId,
          patch: { content: reply.content, citations: reply.citations, state: 'complete' },
        });
      } catch (error) {
        dispatch({
          type: 'message/patch',
          id: placeholderId,
          patch: {
            state: 'error',
            content:
              error instanceof AIServiceError
                ? error.message
                : 'The assistant could not answer that just now.',
          },
        });
      } finally {
        setAssistantPending((p) => ({ ...p, [topicId]: false }));
      }
    },
    [],
  );

  const clearAssistant = useCallback((topicId: string) => {
    dispatch({ type: 'messages/clear', topicId });
  }, []);

  /* --- Profile / settings / data ------------------------------------------- */
  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    dispatch({ type: 'profile/patch', patch });
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    dispatch({ type: 'settings/patch', patch });
  }, []);

  const restoreDemoData = useCallback(() => {
    clearState();
    dispatch({ type: 'reset', data: createSeedData() });
  }, []);

  const deleteAllData = useCallback(() => {
    clearState();
    const stamp = nowISO();
    dispatch({
      type: 'reset',
      data: {
        ...EMPTY,
        profile: { ...EMPTY.profile, createdAt: stamp },
        settings: dataRef.current.settings,
      },
    });
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      data,
      ready,
      storageNotice,
      dismissStorageNotice: () => setStorageNotice(null),
      insightsPending,
      insightsError,
      assistantPending,
      createTopic,
      updateTopic,
      deleteTopic,
      setTopicArchived,
      uploadDocuments,
      runAnalysis,
      renameDocument,
      moveDocument,
      deleteDocument,
      setRecommendationStatus,
      generateInsights,
      dismissInsight,
      sendAssistantMessage,
      clearAssistant,
      updateProfile,
      updateSettings,
      restoreDemoData,
      deleteAllData,
    }),
    [
      data,
      ready,
      storageNotice,
      insightsPending,
      insightsError,
      assistantPending,
      createTopic,
      updateTopic,
      deleteTopic,
      setTopicArchived,
      uploadDocuments,
      runAnalysis,
      renameDocument,
      moveDocument,
      deleteDocument,
      setRecommendationStatus,
      generateInsights,
      dismissInsight,
      sendAssistantMessage,
      clearAssistant,
      updateProfile,
      updateSettings,
      restoreDemoData,
      deleteAllData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
