/**
 * Public AI surface. UI code imports from here and nothing else.
 *
 * Provider selection is a build-time switch: set NEXT_PUBLIC_AI_PROVIDER=http
 * (and optionally NEXT_PUBLIC_AI_BASE_URL) once real endpoints exist. No API
 * keys are read here — they belong on the server behind those endpoints.
 */

import { mockProvider } from './mockProvider';
import { createHttpProvider } from './httpProvider';
import type {
  AIProvider,
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  AnalyzeTopicInput,
  AnalyzeTopicResult,
  AssistantInput,
  AssistantResult,
} from './types';

function resolveProvider(): AIProvider {
  if (process.env.NEXT_PUBLIC_AI_PROVIDER === 'http') {
    return createHttpProvider(process.env.NEXT_PUBLIC_AI_BASE_URL ?? '');
  }
  return mockProvider;
}

const provider = resolveProvider();

export const aiProviderName = provider.name;
export const isMockAI = provider.name === 'mock';

export function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentResult> {
  return provider.analyzeDocument(input);
}

export function analyzeTopic(input: AnalyzeTopicInput): Promise<AnalyzeTopicResult> {
  return provider.analyzeTopic(input);
}

export function askTopicAssistant(input: AssistantInput): Promise<AssistantResult> {
  return provider.askTopicAssistant(input);
}

export { AIServiceError } from './types';
export type {
  AIProvider,
  AnalyzeDocumentInput,
  AnalyzeDocumentResult,
  AnalyzeTopicInput,
  AnalyzeTopicResult,
  AssistantInput,
  AssistantResult,
  TopicContext,
} from './types';
