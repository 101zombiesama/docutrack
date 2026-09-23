/**
 * Lightweight, honest text analysis.
 *
 * Everything here is measured from text the app actually read. Nothing is
 * invented — when a document's text is unavailable these stats are simply
 * absent, and the analysis says so.
 */

const STOPWORDS = new Set(
  `a an the and or but if then than that this these those of in on at to for with from by as is are was were be been being it its it's i me my we our you your they their he she his her not no do does did have has had will would can could should may might must about into over under between during more most other some such only own same so too very s t just don now up out off again further once here there when where why how all any both each few`.split(
    /\s+/,
  ),
);

export interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  bullets: number;
  /** Lines that look like section headings (markdown or short title-case). */
  headings: string[];
  emails: string[];
  urls: string[];
  phones: string[];
  years: string[];
  /** Figures like "40%", "$1.2M", "3x" — used to judge quantified impact. */
  metrics: string[];
  keywords: Array<{ term: string; count: number }>;
  readingMinutes: number;
}

export function analyzeText(text: string): TextStats {
  const lines = text.split(/\r?\n/);
  const words = text.match(/[A-Za-z][A-Za-z'-]+/g) ?? [];
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 12);
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const bullets = lines.filter((l) => /^\s*([-*•‣–]|\d+[.)])\s+/.test(l)).length;

  const headings = lines
    .map((l) => l.trim())
    .filter(
      (l) =>
        (/^#{1,4}\s+\S/.test(l) && l.length < 90) ||
        (l.length > 2 && l.length < 60 && /^[A-Z0-9][A-Za-z0-9 &/,'()-]*$/.test(l) && l === l.toUpperCase()) ||
        /^[A-Z][A-Za-z ]{2,40}:$/.test(l),
    )
    .map((l) => l.replace(/^#{1,4}\s+/, '').replace(/:$/, '').trim())
    .slice(0, 12);

  const emails = unique(text.match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/g) ?? []);
  const urls = unique(text.match(/https?:\/\/[^\s)]+|www\.[^\s)]+/gi) ?? []);
  const phones = unique(text.match(/(\+?\d[\d ().-]{7,}\d)/g) ?? []).slice(0, 3);
  const years = unique(text.match(/\b(19|20)\d{2}\b/g) ?? []).slice(0, 12);
  const metrics = unique(
    text.match(/(\$\s?\d[\d,.]*\s?[kmb]?\b|\b\d[\d,.]*\s?%|\b\d+(\.\d+)?x\b)/gi) ?? [],
  ).slice(0, 12);

  const counts = new Map<string, number>();
  for (const w of words) {
    const term = w.toLowerCase();
    if (term.length < 4 || STOPWORDS.has(term)) continue;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  const keywords = [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .filter((k) => k.count > 1)
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 10);

  return {
    characters: text.length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    bullets,
    headings: unique(headings),
    emails,
    urls,
    phones,
    years,
    metrics,
    keywords,
    readingMinutes: Math.max(1, Math.round(words.length / 220)),
  };
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.map((i) => i.trim()))).filter(Boolean);
}

/** Terms present in A but missing from B — powers cross-document insights. */
export function missingTerms(
  a: Array<{ term: string; count: number }>,
  bText: string,
  limit = 5,
): string[] {
  const lower = bText.toLowerCase();
  return a
    .filter((k) => !lower.includes(k.term))
    .slice(0, limit)
    .map((k) => k.term);
}
