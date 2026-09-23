/**
 * Document parsing abstraction.
 *
 * Today this runs entirely in the browser: plain-text formats are genuinely
 * read, binary formats (PDF/DOCX/XLSX/PPTX) are not. Rather than inventing
 * their contents, the parser reports `textExtracted: false` and the UI tells
 * the user the analysis was based on file metadata only.
 *
 * Swapping in a real backend means replacing `parseDocument` with a call to
 * something like `POST /api/documents/parse` — the return shape stays the same.
 */

import { formatOf, isTextReadable, sleep, MAX_FILE_BYTES, isSupportedFile } from '../utils';
import type { DocumentFormat } from '../types';

export interface ParseResult {
  text: string | null;
  textExtracted: boolean;
  format: DocumentFormat;
  sizeBytes: number;
  /** Explains why text is missing, when it is. */
  note?: string;
}

export class ParseError extends Error {
  readonly retryable: boolean;
  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'ParseError';
    this.retryable = retryable;
  }
}

export interface ValidationResult {
  ok: boolean;
  reason?: string;
}

export function validateFile(file: File): ValidationResult {
  if (!isSupportedFile(file.name)) {
    return {
      ok: false,
      reason: `${file.name.split('.').pop()?.toUpperCase() || 'This file type'} isn't supported. Try PDF, DOCX, TXT, MD, CSV, XLSX or PPTX.`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: 'File is larger than the 25 MB limit.' };
  }
  if (file.size === 0) {
    return { ok: false, reason: 'This file is empty.' };
  }
  return { ok: true };
}

const MAX_TEXT_CHARS = 60_000;

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new ParseError('The file could not be read.'));
    reader.readAsText(file);
  });
}

export async function parseDocument(file: File): Promise<ParseResult> {
  const format = formatOf(file.name);
  // Simulated round-trip so the "Reading document…" state is observable.
  await sleep(500 + Math.random() * 500);

  if (isTextReadable(format)) {
    const raw = await readAsText(file);
    const text = raw.slice(0, MAX_TEXT_CHARS);
    return {
      text,
      textExtracted: text.trim().length > 0,
      format,
      sizeBytes: file.size,
      note:
        text.trim().length === 0
          ? 'The file contained no readable text.'
          : raw.length > MAX_TEXT_CHARS
            ? 'Only the first 60,000 characters were read.'
            : undefined,
    };
  }

  return {
    text: null,
    textExtracted: false,
    format,
    sizeBytes: file.size,
    note: `Text extraction for ${format.toUpperCase()} files needs a server-side parser, which isn't connected in this build. Analysis below is based on the file name, type and topic context only.`,
  };
}

/** Upload transport. Mocked with progress ticks; swap for a real uploader. */
export async function uploadFile(
  file: File,
  onProgress: (percent: number) => void,
  signal?: { cancelled: boolean },
): Promise<{ downloadUrl: string | null }> {
  const steps = 8;
  for (let i = 1; i <= steps; i += 1) {
    if (signal?.cancelled) throw new ParseError('Upload cancelled.', false);
    await sleep(90 + Math.random() * 120);
    onProgress(Math.round((i / steps) * 100));
  }
  let downloadUrl: string | null = null;
  try {
    // Object URLs live for the session only; enough for a working download button.
    downloadUrl = URL.createObjectURL(file);
  } catch {
    downloadUrl = null;
  }
  return { downloadUrl };
}
