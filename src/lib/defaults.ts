import type { AppSettings } from './types';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  defaultTopicView: 'grid',
  defaultDocumentView: 'list',
  compactDensity: false,

  summaryStyle: 'concise',
  recommendationDetail: 'standard',
  autoAnalyzeUploads: true,
  includeTopicContext: true,
  autoGenerateTopicInsights: false,

  confirmBeforeDelete: true,
  confirmBeforeRerun: false,
};

export const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
];
