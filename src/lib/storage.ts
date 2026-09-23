/**
 * Persistence.
 *
 * localStorage is the storage mechanism available to a frontend-only build.
 * It is wrapped here so that swapping in an API or IndexedDB later touches one
 * file. Every access is guarded: private-mode browsers and disabled storage
 * throw, and the app has to keep working when they do.
 */

import type { AppData } from './types';
import { DEFAULT_SETTINGS } from './defaults';

export const STORAGE_KEY = 'docutrack.state.v1';

export interface LoadResult {
  data: AppData | null;
  error: string | null;
}

export function loadState(): LoadResult {
  if (typeof window === 'undefined') return { data: null, error: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: null, error: null };
    const parsed = JSON.parse(raw) as Partial<AppData>;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.topics)) {
      return { data: null, error: 'Saved data was unreadable, so the demo data was restored.' };
    }
    return { data: normalize(parsed), error: null };
  } catch {
    return { data: null, error: 'Saved data could not be read, so the demo data was restored.' };
  }
}

/** Repairs a persisted payload: fills gaps and resets states that can't survive a reload. */
function normalize(parsed: Partial<AppData>): AppData {
  const documents = (parsed.documents ?? []).map((doc) => {
    const inFlight =
      doc.status === 'uploading' ||
      doc.status === 'parsing' ||
      doc.status === 'analyzing' ||
      doc.status === 'recommending' ||
      doc.status === 'queued';
    return {
      ...doc,
      // Blob URLs do not survive a reload.
      downloadUrl: doc.source === 'upload' ? null : (doc.downloadUrl ?? null),
      // A page reload kills any in-flight pipeline; surface that honestly.
      status: inFlight ? ('unanalyzed' as const) : doc.status,
      statusDetail: inFlight ? 'Interrupted by a page reload' : doc.statusDetail,
      progress: inFlight ? undefined : doc.progress,
    };
  });

  return {
    profile: parsed.profile!,
    settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    topics: parsed.topics ?? [],
    documents,
    analyses: parsed.analyses ?? [],
    recommendations: parsed.recommendations ?? [],
    insights: parsed.insights ?? [],
    messages: parsed.messages ?? [],
    version: parsed.version ?? 1,
  };
}

export type SaveOutcome = { ok: true } | { ok: false; reason: string };

export function saveState(data: AppData): SaveOutcome {
  if (typeof window === 'undefined') return { ok: true };
  const serialisable: AppData = {
    ...data,
    // Blob URLs are session-scoped; storing them would only mislead on reload.
    documents: data.documents.map((d) => ({ ...d, downloadUrl: null })),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialisable));
    return { ok: true };
  } catch {
    // Most commonly a quota error from large extracted text. Retry lean.
    try {
      const lean: AppData = {
        ...serialisable,
        documents: serialisable.documents.map((d) =>
          d.source === 'upload' ? { ...d, extractedText: null } : d,
        ),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lean));
      return {
        ok: false,
        reason: 'Storage is nearly full, so extracted document text was not saved.',
      };
    } catch {
      return { ok: false, reason: 'Changes could not be saved to this browser’s storage.' };
    }
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
}

export function estimateStorageBytes(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return new Blob([window.localStorage.getItem(STORAGE_KEY) ?? '']).size;
  } catch {
    return 0;
  }
}
