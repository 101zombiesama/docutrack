import type {
  AppData,
  AppSettings,
  ChatMessage,
  DocumentAnalysis,
  DocumentRecord,
  Recommendation,
  Topic,
  TopicInsight,
  UserProfile,
} from '../types';
import { nowISO } from '../utils';

export type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'reset'; data: AppData }
  | { type: 'settings/patch'; patch: Partial<AppSettings> }
  | { type: 'profile/patch'; patch: Partial<UserProfile> }
  | { type: 'topic/add'; topic: Topic }
  | { type: 'topic/patch'; id: string; patch: Partial<Topic> }
  | { type: 'topic/delete'; id: string }
  | { type: 'document/add'; document: DocumentRecord }
  | { type: 'document/patch'; id: string; patch: Partial<DocumentRecord> }
  | { type: 'document/delete'; id: string }
  | { type: 'document/move'; id: string; topicId: string }
  | { type: 'analysis/set'; analysis: DocumentAnalysis; recommendations: Recommendation[] }
  | { type: 'recommendation/patch'; id: string; patch: Partial<Recommendation> }
  | { type: 'insights/set'; topicId: string; insights: TopicInsight[] }
  | { type: 'insight/patch'; id: string; patch: Partial<TopicInsight> }
  | { type: 'message/add'; message: ChatMessage }
  | { type: 'message/patch'; id: string; patch: Partial<ChatMessage> }
  | { type: 'messages/clear'; topicId: string };

/** Bumps a topic's updatedAt so "last updated" always reflects real activity. */
function touchTopic(state: AppData, topicId: string | undefined): Topic[] {
  if (!topicId) return state.topics;
  return state.topics.map((t) => (t.id === topicId ? { ...t, updatedAt: nowISO() } : t));
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'hydrate':
    case 'reset':
      return action.data;

    case 'settings/patch':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'profile/patch':
      return { ...state, profile: { ...state.profile, ...action.patch } };

    case 'topic/add':
      return { ...state, topics: [action.topic, ...state.topics] };

    case 'topic/patch':
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.id ? { ...t, ...action.patch, updatedAt: nowISO() } : t,
        ),
      };

    case 'topic/delete': {
      const docIds = new Set(
        state.documents.filter((d) => d.topicId === action.id).map((d) => d.id),
      );
      return {
        ...state,
        topics: state.topics.filter((t) => t.id !== action.id),
        documents: state.documents.filter((d) => d.topicId !== action.id),
        analyses: state.analyses.filter((a) => !docIds.has(a.documentId)),
        recommendations: state.recommendations.filter((r) => !docIds.has(r.documentId)),
        insights: state.insights.filter((i) => i.topicId !== action.id),
        messages: state.messages.filter((m) => m.topicId !== action.id),
      };
    }

    case 'document/add':
      return {
        ...state,
        documents: [action.document, ...state.documents],
        topics: touchTopic(state, action.document.topicId),
      };

    case 'document/patch': {
      const target = state.documents.find((d) => d.id === action.id);
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.id ? { ...d, ...action.patch, updatedAt: nowISO() } : d,
        ),
        topics: touchTopic(state, target?.topicId),
      };
    }

    case 'document/delete': {
      const target = state.documents.find((d) => d.id === action.id);
      return {
        ...state,
        documents: state.documents.filter((d) => d.id !== action.id),
        analyses: state.analyses.filter((a) => a.documentId !== action.id),
        recommendations: state.recommendations.filter((r) => r.documentId !== action.id),
        insights: state.insights.map((i) => ({
          ...i,
          relatedDocumentIds: i.relatedDocumentIds.filter((id) => id !== action.id),
        })),
        topics: touchTopic(state, target?.topicId),
      };
    }

    case 'document/move': {
      const target = state.documents.find((d) => d.id === action.id);
      if (!target) return state;
      const stamp = nowISO();
      return {
        ...state,
        documents: state.documents.map((d) =>
          d.id === action.id ? { ...d, topicId: action.topicId, updatedAt: stamp } : d,
        ),
        analyses: state.analyses.map((a) =>
          a.documentId === action.id ? { ...a, topicId: action.topicId } : a,
        ),
        recommendations: state.recommendations.map((r) =>
          r.documentId === action.id ? { ...r, topicId: action.topicId } : r,
        ),
        // Insights are topic-scoped conclusions; a move invalidates them on both sides.
        insights: state.insights.filter(
          (i) => i.topicId !== target.topicId && i.topicId !== action.topicId,
        ),
        topics: state.topics.map((t) =>
          t.id === target.topicId || t.id === action.topicId ? { ...t, updatedAt: stamp } : t,
        ),
      };
    }

    case 'analysis/set': {
      const { analysis, recommendations } = action;
      const target = state.documents.find((d) => d.id === analysis.documentId);
      return {
        ...state,
        analyses: [
          ...state.analyses.filter((a) => a.documentId !== analysis.documentId),
          analysis,
        ],
        // A fresh analysis replaces the previous suggestions for that document.
        recommendations: [
          ...state.recommendations.filter((r) => r.documentId !== analysis.documentId),
          ...recommendations,
        ],
        topics: touchTopic(state, target?.topicId),
      };
    }

    case 'recommendation/patch':
      return {
        ...state,
        recommendations: state.recommendations.map((r) =>
          r.id === action.id ? { ...r, ...action.patch, updatedAt: nowISO() } : r,
        ),
      };

    case 'insights/set':
      return {
        ...state,
        insights: [...state.insights.filter((i) => i.topicId !== action.topicId), ...action.insights],
      };

    case 'insight/patch':
      return {
        ...state,
        insights: state.insights.map((i) => (i.id === action.id ? { ...i, ...action.patch } : i)),
      };

    case 'message/add':
      return { ...state, messages: [...state.messages, action.message] };

    case 'message/patch':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      };

    case 'messages/clear':
      return { ...state, messages: state.messages.filter((m) => m.topicId !== action.topicId) };

    default:
      return state;
  }
}
