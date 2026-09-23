/**
 * HTTP provider — the seam a real backend plugs into.
 *
 * Not active by default (no backend exists yet). It is kept here so that
 * switching from mock to production is a configuration change rather than a
 * rewrite: the request/response shapes are the same ones the mock produces.
 *
 * Credentials are never held in the browser. These routes are expected to be
 * server-side endpoints that hold the model API key themselves.
 */

import {
  AIServiceError,
  type AIProvider,
  type AnalyzeDocumentInput,
  type AnalyzeDocumentResult,
  type AnalyzeTopicInput,
  type AnalyzeTopicResult,
  type AssistantInput,
  type AssistantResult,
} from './types';

async function post<TBody, TResult>(path: string, body: TBody): Promise<TResult> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AIServiceError('Could not reach the analysis service.', 'network', true);
  }

  if (!response.ok) {
    throw new AIServiceError(
      `The analysis service responded with ${response.status}.`,
      'http_error',
      response.status >= 500 || response.status === 429,
    );
  }

  try {
    return (await response.json()) as TResult;
  } catch {
    // Partial or malformed payloads are treated as retryable, not as a crash.
    throw new AIServiceError('The analysis service returned a malformed response.', 'bad_payload', true);
  }
}

export function createHttpProvider(baseUrl = ''): AIProvider {
  return {
    name: 'http',
    analyzeDocument: (input: AnalyzeDocumentInput) =>
      post<AnalyzeDocumentInput, AnalyzeDocumentResult>(`${baseUrl}/api/documents/analyze`, input),
    analyzeTopic: (input: AnalyzeTopicInput) =>
      post<AnalyzeTopicInput, AnalyzeTopicResult>(`${baseUrl}/api/topics/analyze`, input),
    askTopicAssistant: (input: AssistantInput) =>
      post<AssistantInput, AssistantResult>(`${baseUrl}/api/topics/${input.topic.id}/chat`, input),
  };
}
