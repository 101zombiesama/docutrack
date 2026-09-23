import type { DocumentFormat } from './types';

/** Stable-ish unique id. crypto.randomUUID when available, else a fallback. */
export function uid(prefix = 'id'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

const RELATIVE_STEPS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.348, 'week'],
  [12, 'month'],
];

/** "2 hours ago" / "just now". Deterministic enough for SSR-free rendering. */
export function formatRelative(iso: string | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  let diff = (Date.now() - then) / 1000;
  if (diff < 45) return 'just now';
  if (diff < 0) return 'just now';

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  for (const [size, unit] of RELATIVE_STEPS) {
    if (Math.abs(diff) < size) {
      return rtf.format(-Math.round(diff), unit);
    }
    diff /= size;
  }
  return rtf.format(-Math.round(diff), 'year');
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function pluralize(count: number, single: string, plural?: string): string {
  return `${count} ${count === 1 ? single : plural ?? `${single}s`}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

const EXTENSION_MAP: Record<string, DocumentFormat> = {
  pdf: 'pdf',
  docx: 'docx',
  doc: 'doc',
  txt: 'txt',
  text: 'txt',
  md: 'md',
  markdown: 'md',
  mdx: 'md',
  xlsx: 'xlsx',
  xls: 'xlsx',
  csv: 'csv',
  pptx: 'pptx',
  ppt: 'pptx',
  rtf: 'rtf',
};

export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSION_MAP);

export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',');

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function extensionOf(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx + 1).toLowerCase();
}

export function formatOf(fileName: string): DocumentFormat {
  return EXTENSION_MAP[extensionOf(fileName)] ?? 'other';
}

export function isSupportedFile(fileName: string): boolean {
  return extensionOf(fileName) in EXTENSION_MAP;
}

/** Formats whose text we can genuinely read in the browser today. */
export function isTextReadable(format: DocumentFormat): boolean {
  return format === 'txt' || format === 'md' || format === 'csv';
}

export function baseName(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? fileName : fileName.slice(0, idx);
}

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function byUpdatedDesc<T extends { updatedAt: string }>(a: T, b: T): number {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

/** Case-insensitive "does haystack contain needle" used by every search box. */
export function matches(haystack: string | undefined, needle: string): boolean {
  if (!needle) return true;
  return (haystack ?? '').toLowerCase().includes(needle.toLowerCase());
}

/** Deterministic pseudo-random in [0,1) from a string — keeps mocks stable. */
export function hashFloat(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}
