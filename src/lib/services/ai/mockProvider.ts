/**
 * Mock AI provider.
 *
 * Produces analysis locally so the whole product works without a backend.
 * Two rules it holds to, because the real product would have to:
 *
 *  1. Anything measured from text the app actually read is marked `extracted`.
 *     Anything the model guessed is marked `inferred`. The UI shows the
 *     difference.
 *  2. When a file's text could not be read (PDF/DOCX in the browser), the
 *     analysis says so instead of inventing contents.
 */

import { nowISO, sleep, baseName, uid } from '../../utils';
import type { DocumentAnalysis, KeyInformationItem, Priority } from '../../types';
import { ARCHETYPES, GENERIC_ARCHETYPE, classify, type ArchetypeContext } from './archetypes';
import { analyzeText, missingTerms, type TextStats } from './textStats';
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

export const MOCK_MODEL = 'docutrack-demo-analyzer';

/** Small, deliberate failure rate so the retry path is real, not decorative. */
const FAILURE_RATE = 0.05;

function maybeFail(fileName: string, action: string) {
  // Escape hatch for demos/tests: any file named *fail* always fails.
  if (/fail/i.test(fileName) || Math.random() < FAILURE_RATE) {
    throw new AIServiceError(
      `The ${action} service didn't return a usable response.`,
      'upstream_unavailable',
      true,
    );
  }
}

function detailCount(detail: 'brief' | 'standard' | 'in-depth'): number {
  return detail === 'brief' ? 2 : detail === 'in-depth' ? 4 : 3;
}

/* -------------------------------------------------------------------------- */
/* Document analysis                                                          */
/* -------------------------------------------------------------------------- */

function buildKeyInformation(
  stats: TextStats | null,
  ctx: ArchetypeContext,
  expectedSections: string[],
): KeyInformationItem[] {
  const items: KeyInformationItem[] = [];
  const push = (label: string, value: string, provenance: KeyInformationItem['provenance']) => {
    if (value) items.push({ id: uid('ki'), label, value, provenance });
  };

  if (stats) {
    push('Length', `${stats.words.toLocaleString()} words · about ${stats.readingMinutes} min to read`, 'extracted');
    if (stats.headings.length) push('Sections found', stats.headings.slice(0, 6).join(' · '), 'extracted');
    if (stats.keywords.length)
      push('Most frequent terms', stats.keywords.slice(0, 6).map((k) => k.term).join(', '), 'extracted');
    if (stats.metrics.length) push('Figures mentioned', stats.metrics.slice(0, 6).join(', '), 'extracted');
    if (stats.emails.length) push('Contact details', stats.emails.join(', '), 'extracted');
    if (stats.urls.length) push('Links', stats.urls.slice(0, 3).join(' · '), 'extracted');
    if (stats.years.length) push('Dates referenced', stats.years.slice(0, 6).join(', '), 'extracted');
    if (stats.bullets) push('Structure', `${stats.bullets} bullet points across ${stats.paragraphs} blocks`, 'extracted');
  } else {
    push('File', `${ctx.format.toUpperCase()} — text extraction unavailable in this build`, 'extracted');
    if (expectedSections.length)
      push('Sections typical of this type', expectedSections.join(' · '), 'inferred');
  }

  if (ctx.topicGoal) push('Topic goal (you wrote this)', ctx.topicGoal, 'user');
  if (ctx.siblingTypes.length)
    push('Read alongside', ctx.siblingTypes.slice(0, 5).join(' · '), 'extracted');

  return items;
}

function buildRecommendations(
  ctx: ArchetypeContext,
  archetypeKey: string,
  limit: number,
  documentId: string,
  topicId: string,
) {
  const archetype = ARCHETYPES.find((a) => a.key === archetypeKey) ?? GENERIC_ARCHETYPE;
  const templates = [...archetype.recommendations];

  // Checks grounded in text we genuinely read take priority over generic ones.
  const grounded: typeof templates = [];
  if (ctx.stats) {
    const s = ctx.stats;
    if (s.words > 0 && s.words < 120) {
      grounded.push({
        title: 'This document is very short',
        explanation: () =>
          `Only ${s.words} words were read from this file, which may mean it is a stub or that content is still to be added.`,
        whyItMatters: () => 'A short document gives both you and the analysis little to work with.',
        suggestedAction: 'Expand the document, or replace it with the fuller version.',
        priority: 'medium' as Priority,
      });
    }
    if (s.headings.length === 0 && s.words > 250) {
      grounded.push({
        title: 'Add section headings',
        explanation: () => 'No headings were detected in the text that was read, so the document reads as one block.',
        whyItMatters: () => 'Headings are what make a document skimmable, and most readers skim first.',
        suggestedAction: 'Break the content into labelled sections.',
        priority: 'medium' as Priority,
      });
    }
    if (s.metrics.length === 0 && s.words > 200 && ['cv', 'portfolio', 'requirements'].includes(archetype.key)) {
      // The archetype's own "measurable" recommendation already covers this.
    }
  } else {
    grounded.push({
      title: 'Analysis is based on limited information',
      explanation: () =>
        `The text inside this ${ctx.format.toUpperCase()} could not be read in this build, so the analysis used the file name, file type and topic context only.`,
      whyItMatters: () =>
        'Treat the summary and suggestions below as a starting point rather than a reading of your actual content.',
      suggestedAction:
        'Upload a TXT or Markdown version to get analysis grounded in the real text, or connect a server-side parser.',
      priority: 'low' as Priority,
    });
  }

  return [...grounded, ...templates].slice(0, limit).map((t) => ({
    documentId,
    topicId,
    title: t.title,
    explanation: t.explanation(ctx),
    whyItMatters: t.whyItMatters(ctx),
    suggestedAction: t.suggestedAction,
    priority: t.priority,
    section: t.section,
  }));
}

async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentResult> {
  const { document, topicContext, preferences } = input;
  await sleep(900 + Math.random() * 900);
  maybeFail(document.name, 'analysis');

  const text = document.textExtracted ? document.extractedText : null;
  const stats = text && text.trim() ? analyzeText(text) : null;
  const useTopic = preferences.includeTopicContext && !!topicContext;

  const archetype = classify(document.name, document.format, text);
  const ctx: ArchetypeContext = {
    docName: document.name,
    baseName: baseName(document.name),
    format: document.format,
    topicName: useTopic ? (topicContext?.name ?? null) : null,
    topicGoal: useTopic ? (topicContext?.goal || null) : null,
    topicDescription: useTopic ? (topicContext?.description ?? null) : null,
    hasText: !!stats,
    stats,
    siblingTypes: useTopic
      ? (topicContext?.siblings ?? []).map((s) => s.documentType ?? s.name).filter(Boolean)
      : [],
    detailed: preferences.summaryStyle === 'detailed',
  };

  const notes: string[] = [];
  if (!stats) {
    notes.push(
      `Text inside this ${document.format.toUpperCase()} was not read — this build has no server-side parser. The summary and suggestions are inferred from the file name, type and topic context.`,
    );
  }
  if (!useTopic) {
    notes.push('Topic context was excluded from this analysis (see Settings → AI preferences).');
  }

  const analysis: Omit<DocumentAnalysis, 'id'> = {
    documentId: document.id,
    topicId: document.topicId,
    documentType: archetype.documentType,
    summary: archetype.summary(ctx),
    description: archetype.description(ctx),
    inferredGoal: archetype.inferredGoal(ctx),
    keyInformation: buildKeyInformation(stats, ctx, archetype.expectedSections),
    usedTopicContext: useTopic,
    basedOn: stats ? 'document-text' : 'file-metadata',
    confidence: stats ? (archetype.key === 'generic' ? 'medium' : 'high') : 'low',
    notes,
    model: MOCK_MODEL,
    analyzedAt: nowISO(),
  };

  return {
    analysis,
    recommendations: buildRecommendations(
      ctx,
      archetype.key,
      detailCount(preferences.recommendationDetail),
      document.id,
      document.topicId,
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Topic analysis                                                             */
/* -------------------------------------------------------------------------- */

/** Document types a topic of a given shape usually needs. */
const EXPECTED_BY_SHAPE: Record<string, string[]> = {
  application: ['CV / Résumé', 'Job Description', 'Cover Letter', 'Portfolio'],
  product: ['Requirements Document', 'User Research', 'Design Brief'],
  finance: ['Financial Record'],
};

function topicShape(types: string[]): keyof typeof EXPECTED_BY_SHAPE | null {
  if (types.some((t) => t === 'CV / Résumé' || t === 'Job Description' || t === 'Cover Letter')) return 'application';
  if (types.some((t) => t === 'Requirements Document' || t === 'User Research' || t === 'Design Brief')) return 'product';
  if (types.some((t) => t === 'Financial Record')) return 'finance';
  return null;
}

async function analyzeTopic(input: AnalyzeTopicInput): Promise<AnalyzeTopicResult> {
  const { topic, documents, analyses, openRecommendations } = input;
  await sleep(1100 + Math.random() * 900);
  maybeFail(topic.name, 'topic analysis');

  const ready = documents.filter((d) => d.status === 'ready');
  const analysisFor = (id: string) => analyses.find((a) => a.documentId === id);
  const typeOf = (id: string) => analysisFor(id)?.documentType ?? 'Document';
  const types = ready.map((d) => typeOf(d.id));
  const insights: AnalyzeTopicResult['insights'] = [];

  if (ready.length === 0) {
    return {
      insights: [
        {
          topicId: topic.id,
          kind: 'next-step',
          title: 'Add a document to get topic-level insight',
          body: 'Topic insights compare documents against each other, so they need at least one analysed document to work from.',
          suggestedAction: 'Upload a document to this topic.',
          relatedDocumentIds: [],
          priority: 'medium',
        },
      ],
      generatedAt: nowISO(),
    };
  }

  /* --- Cross-document term comparison, only where real text exists -------- */
  const withText = ready.filter((d) => d.textExtracted && d.extractedText);
  if (withText.length >= 2) {
    const [a, b] = withText;
    const statsA = analyzeText(a.extractedText!);
    const gaps = missingTerms(statsA.keywords, b.extractedText!, 4);
    if (gaps.length) {
      insights.push({
        topicId: topic.id,
        kind: 'alignment',
        title: `Terms in ${a.name} that don't appear in ${b.name}`,
        body: `${gaps.map((g) => `“${g}”`).join(', ')} ${gaps.length === 1 ? 'appears' : 'appear'} repeatedly in ${a.name} but ${gaps.length === 1 ? 'was' : 'were'} not found in ${b.name}. That may be fine — or it may be a gap worth closing.`,
        suggestedAction: `Check whether ${b.name} should reflect any of these.`,
        relatedDocumentIds: [a.id, b.id],
        priority: 'medium',
      });
    }
  } else if (ready.length >= 2) {
    const [a, b] = ready;
    insights.push({
      topicId: topic.id,
      kind: 'alignment',
      title: `Check that ${typeOf(a.id)} and ${typeOf(b.id)} tell the same story`,
      body: `This topic holds a ${typeOf(a.id).toLowerCase()} and a ${typeOf(b.id).toLowerCase()}. Text inside these files could not be read in this build, so this is a prompt rather than a finding: documents of these two types usually need to emphasise the same things.`,
      suggestedAction: `Read ${a.name} and ${b.name} side by side and align the emphasis.`,
      relatedDocumentIds: [a.id, b.id],
      priority: 'medium',
    });
  }

  /* --- Missing document types ------------------------------------------- */
  const shape = topicShape(types);
  if (shape) {
    const missing = EXPECTED_BY_SHAPE[shape].filter((t) => !types.includes(t));
    if (missing.length) {
      insights.push({
        topicId: topic.id,
        kind: 'gap',
        title: `${missing.length === 1 ? 'One document type is' : `${missing.length} document types are`} missing from this topic`,
        body: `Topics like this one usually also contain: ${missing.join(', ')}. Nothing matching those types was found here.`,
        suggestedAction: `Upload ${missing[0].toLowerCase()} if you have one.`,
        relatedDocumentIds: [],
        priority: missing.length > 2 ? 'high' : 'medium',
      });
    }
  }

  /* --- Duplicate / overlapping documents --------------------------------- */
  const byType = new Map<string, string[]>();
  for (const d of ready) {
    const t = typeOf(d.id);
    byType.set(t, [...(byType.get(t) ?? []), d.id]);
  }
  for (const [type, ids] of byType) {
    if (ids.length > 1 && type !== 'Document') {
      insights.push({
        topicId: topic.id,
        kind: 'overlap',
        title: `${ids.length} documents look like a ${type.toLowerCase()}`,
        body: `${ids.map((id) => ready.find((d) => d.id === id)?.name).join(', ')} were all classified as ${type.toLowerCase()}. Multiple versions can mean one is out of date.`,
        suggestedAction: 'Confirm which is current, and archive or rename the others.',
        relatedDocumentIds: ids,
        priority: 'low',
      });
      break;
    }
  }

  /* --- Unanalysed / failed documents ------------------------------------- */
  const unfinished = documents.filter((d) => d.status === 'failed' || d.status === 'unanalyzed');
  if (unfinished.length) {
    insights.push({
      topicId: topic.id,
      kind: 'gap',
      title: `${unfinished.length} document${unfinished.length === 1 ? '' : 's'} in this topic ${unfinished.length === 1 ? 'has' : 'have'} no analysis`,
      body: `${unfinished.map((d) => d.name).join(', ')} ${unfinished.length === 1 ? 'is' : 'are'} not included in anything on this page, so insights here are based on a partial picture.`,
      suggestedAction: 'Run analysis on those documents.',
      relatedDocumentIds: unfinished.map((d) => d.id),
      priority: 'medium',
    });
  }

  /* --- Next step from open recommendations ------------------------------- */
  const high = openRecommendations.filter((r) => r.priority === 'high');
  if (high.length) {
    insights.push({
      topicId: topic.id,
      kind: 'next-step',
      title: `Start with ${high.length} high-priority suggestion${high.length === 1 ? '' : 's'}`,
      body: `Across this topic, the suggestion with the most leverage right now is “${high[0].title}” on ${ready.find((d) => d.id === high[0].documentId)?.name ?? 'a document'}.`,
      suggestedAction: 'Open that document and work through its recommendations.',
      relatedDocumentIds: [high[0].documentId],
      priority: 'high',
    });
  } else if (topic.goal) {
    insights.push({
      topicId: topic.id,
      kind: 'next-step',
      title: 'No high-priority suggestions are outstanding',
      body: `Measured against your stated goal — “${topic.goal}” — nothing in this topic is currently flagged as high priority.`,
      relatedDocumentIds: [],
      priority: 'low',
    });
  }

  if (!topic.goal) {
    insights.push({
      topicId: topic.id,
      kind: 'next-step',
      title: 'Add a goal to sharpen these insights',
      body: 'This topic has no stated goal, so suggestions are based on document types alone rather than on what you are trying to achieve.',
      suggestedAction: 'Edit the topic and describe the outcome you want.',
      relatedDocumentIds: [],
      priority: 'medium',
    });
  }

  return { insights: insights.slice(0, 5), generatedAt: nowISO() };
}

/* -------------------------------------------------------------------------- */
/* Topic assistant                                                            */
/* -------------------------------------------------------------------------- */

type Intent =
  | 'summarize'
  | 'weaknesses'
  | 'compare'
  | 'missing'
  | 'coverage'
  | 'priorities'
  | 'relevance'
  | 'general';

function detectIntent(q: string): Intent {
  const s = q.toLowerCase();
  if (/(compare|versus|\bvs\b|against|difference)/.test(s)) return 'compare';
  if (/(missing|don'?t have|lack|should i add|what.*need)/.test(s)) return 'missing';
  if (/(cover|requirement|match|qualif|meet)/.test(s)) return 'coverage';
  if (/(weak|problem|issue|risk|gap|wrong)/.test(s)) return 'weaknesses';
  if (/(priorit|most important|first|biggest win|highest)/.test(s)) return 'priorities';
  if (/(relevant|best|strongest|which project)/.test(s)) return 'relevance';
  if (/(summar|overview|what.*in this topic|tell me about|recap)/.test(s)) return 'summarize';
  return 'general';
}

async function askTopicAssistant(input: AssistantInput): Promise<AssistantResult> {
  const { topic, documents, analyses, recommendations, question } = input;
  await sleep(750 + Math.random() * 850);
  maybeFail(question, 'assistant');

  const ready = documents.filter((d) => d.status === 'ready');
  const analysisFor = (id: string) => analyses.find((a) => a.documentId === id);
  const open = recommendations.filter((r) => r.status === 'open');
  const cite = (docs: typeof ready) =>
    docs.map((d) => ({ documentId: d.id, documentName: d.name }));

  const nameOf = (d: (typeof ready)[number]) => d.name;
  const typeOf = (d: (typeof ready)[number]) => analysisFor(d.id)?.documentType ?? 'Document';

  if (ready.length === 0) {
    return {
      content:
        `**This topic has no analysed documents yet.**\n\nOnce you upload something and analysis finishes, I can summarise it, compare documents against each other and suggest what to improve.\n\nEverything I produce is a suggestion based on the documents in this topic — worth checking before you act on it.`,
      citations: [],
    };
  }

  const intent = detectIntent(question);
  const lines: string[] = [];
  let cited = ready;

  switch (intent) {
    case 'summarize': {
      lines.push(`**${topic.name}** holds ${ready.length} analysed document${ready.length === 1 ? '' : 's'}.`);
      if (topic.goal) lines.push(`Your stated goal: *${topic.goal}*`);
      lines.push('');
      for (const d of ready.slice(0, 6)) {
        const a = analysisFor(d.id);
        lines.push(`- **${nameOf(d)}** — ${typeOf(d)}. ${a?.summary ?? 'No summary available.'}`);
      }
      if (open.length) {
        lines.push('');
        lines.push(`There ${open.length === 1 ? 'is' : 'are'} ${open.length} open suggestion${open.length === 1 ? '' : 's'} across these documents.`);
      }
      break;
    }

    case 'weaknesses':
    case 'priorities': {
      const ranked = [...open].sort(
        (a, b) => rank(b.priority) - rank(a.priority) || a.title.localeCompare(b.title),
      );
      if (ranked.length === 0) {
        lines.push('**Nothing is currently flagged.** Every suggestion in this topic has been resolved or dismissed.');
        lines.push('');
        lines.push('You can re-run analysis on a document if you have changed it since it was last looked at.');
        break;
      }
      lines.push(
        intent === 'priorities'
          ? '**Highest-leverage improvements right now:**'
          : '**The weakest points I can see, based on the current analysis:**',
      );
      lines.push('');
      for (const r of ranked.slice(0, 5)) {
        const doc = ready.find((d) => d.id === r.documentId);
        lines.push(`- **${r.title}** *(${r.priority} priority — ${doc?.name ?? 'document'})*`);
        lines.push(`  ${r.explanation}`);
      }
      cited = ready.filter((d) => ranked.some((r) => r.documentId === d.id));
      break;
    }

    case 'compare': {
      const picked = pickTwo(ready, question, (d) => `${nameOf(d)} ${typeOf(d)}`);
      if (!picked) {
        lines.push('I need at least two analysed documents in this topic to compare.');
        break;
      }
      const [a, b] = picked;
      lines.push(`**${nameOf(a)}** *(${typeOf(a)})* compared with **${nameOf(b)}** *(${typeOf(b)})*`);
      lines.push('');
      if (a.textExtracted && b.textExtracted && a.extractedText && b.extractedText) {
        const sa = analyzeText(a.extractedText);
        const sb = analyzeText(b.extractedText);
        const onlyA = missingTerms(sa.keywords, b.extractedText, 5);
        const onlyB = missingTerms(sb.keywords, a.extractedText, 5);
        const shared = sa.keywords.filter((k) => b.extractedText!.toLowerCase().includes(k.term)).slice(0, 5);
        lines.push(`- **Shared emphasis:** ${shared.length ? shared.map((k) => k.term).join(', ') : 'no strongly repeated terms in common'}`);
        lines.push(`- **Only in ${nameOf(a)}:** ${onlyA.length ? onlyA.join(', ') : '—'}`);
        lines.push(`- **Only in ${nameOf(b)}:** ${onlyB.length ? onlyB.join(', ') : '—'}`);
        lines.push('');
        lines.push(
          onlyB.length
            ? `Terms that appear in ${nameOf(b)} but not in ${nameOf(a)} are usually the place to start — where your experience genuinely covers them, say so in the same words.`
            : 'The two documents use broadly similar vocabulary.',
        );
      } else {
        lines.push(
          `Text inside ${!a.textExtracted ? nameOf(a) : nameOf(b)} could not be read in this build, so I can't compare the wording directly.`,
        );
        lines.push('');
        lines.push(`What I can compare is the analysis of each:`);
        lines.push(`- **${nameOf(a)}** — ${analysisFor(a.id)?.summary ?? '—'}`);
        lines.push(`- **${nameOf(b)}** — ${analysisFor(b.id)?.summary ?? '—'}`);
        lines.push('');
        lines.push(
          `A ${typeOf(a).toLowerCase()} and a ${typeOf(b).toLowerCase()} in the same topic usually need to emphasise the same two or three things. Read them side by side and check that they do.`,
        );
      }
      cited = [a, b];
      break;
    }

    case 'coverage': {
      const reference =
        ready.find((d) => typeOf(d) === 'Job Description') ??
        ready.find((d) => typeOf(d) === 'Requirements Document');
      const subject = ready.find((d) => d.id !== reference?.id);
      if (!reference || !subject) {
        lines.push(
          'To check coverage I need a reference document (a job description or requirements document) and something to check against it. This topic doesn’t have both yet.',
        );
        break;
      }
      lines.push(`**Checking ${nameOf(subject)} against ${nameOf(reference)}**`);
      lines.push('');
      if (reference.textExtracted && reference.extractedText && subject.extractedText) {
        const sr = analyzeText(reference.extractedText);
        const covered = sr.keywords.filter((k) => subject.extractedText!.toLowerCase().includes(k.term));
        const gaps = sr.keywords.filter((k) => !subject.extractedText!.toLowerCase().includes(k.term));
        lines.push(`- **Appears in both:** ${covered.length ? covered.map((k) => k.term).join(', ') : '—'}`);
        lines.push(`- **In ${nameOf(reference)} only:** ${gaps.length ? gaps.slice(0, 6).map((k) => k.term).join(', ') : '—'}`);
        lines.push('');
        lines.push(
          'This is a word-level check, not a judgement of whether you meet the requirement. Only add a term where your experience genuinely supports it.',
        );
      } else {
        lines.push(
          `I couldn't read the text of ${!reference.textExtracted ? nameOf(reference) : nameOf(subject)} in this build, so I can't check requirement-by-requirement.`,
        );
        lines.push('');
        lines.push(`From the analysis: ${analysisFor(reference.id)?.summary ?? '—'}`);
      }
      cited = [reference, subject];
      break;
    }

    case 'missing': {
      const types = ready.map(typeOf);
      const shape = topicShape(types);
      const missing = shape ? EXPECTED_BY_SHAPE[shape].filter((t) => !types.includes(t)) : [];
      if (missing.length) {
        lines.push(`**Document types this topic doesn't have yet:**`);
        lines.push('');
        for (const m of missing) lines.push(`- ${m}`);
        lines.push('');
        lines.push(`It currently holds: ${types.join(', ')}.`);
      } else {
        lines.push(`**Nothing obvious is missing.** This topic holds ${types.join(', ')}.`);
        lines.push('');
        lines.push('This is based on what topics of this shape usually contain — your situation may need something different.');
      }
      break;
    }

    case 'relevance': {
      const scored = ready
        .map((d) => ({
          doc: d,
          score:
            (topic.goal ? overlapScore(topic.goal, `${d.name} ${analysisFor(d.id)?.summary ?? ''}`) : 0) +
            overlapScore(question, `${d.name} ${analysisFor(d.id)?.summary ?? ''}`),
        }))
        .sort((a, b) => b.score - a.score);
      lines.push('**Most relevant documents in this topic**');
      if (topic.goal) lines.push(`*Ranked against your goal: ${topic.goal}*`);
      lines.push('');
      for (const { doc } of scored.slice(0, 4)) {
        lines.push(`- **${nameOf(doc)}** — ${analysisFor(doc.id)?.summary ?? typeOf(doc)}`);
      }
      lines.push('');
      lines.push('Relevance here is estimated from document summaries and your topic goal, not from a deep read of each file.');
      cited = scored.slice(0, 4).map((s) => s.doc);
      break;
    }

    default: {
      lines.push(`Here's what I can see in **${topic.name}**:`);
      lines.push('');
      lines.push(`- ${ready.length} analysed document${ready.length === 1 ? '' : 's'}: ${ready.map(nameOf).join(', ')}`);
      if (topic.goal) lines.push(`- Your goal: *${topic.goal}*`);
      lines.push(`- ${open.length} open suggestion${open.length === 1 ? '' : 's'}`);
      lines.push('');
      lines.push('Try asking me to summarise the topic, compare two documents, find what’s missing, or list the highest-priority improvements.');
    }
  }

  lines.push('');
  lines.push('*Generated from the documents in this topic — worth verifying before you rely on it.*');

  return { content: lines.join('\n'), citations: cite(cited.slice(0, 4)) };
}

function rank(p: Priority): number {
  return p === 'high' ? 3 : p === 'medium' ? 2 : 1;
}

function overlapScore(a: string, b: string): number {
  const at = new Set(a.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  const bt = (b.toLowerCase().match(/[a-z]{4,}/g) ?? []) as string[];
  return bt.filter((t) => at.has(t)).length;
}

/** Choose the two documents a "compare X and Y" question is most likely about. */
function pickTwo<T>(items: T[], question: string, label: (item: T) => string): [T, T] | null {
  if (items.length < 2) return null;
  const scored = items
    .map((item) => ({ item, score: overlapScore(question, label(item)) }))
    .sort((a, b) => b.score - a.score);
  return [scored[0].item, scored[1].item];
}

export const mockProvider: AIProvider = {
  name: 'mock',
  analyzeDocument,
  analyzeTopic,
  askTopicAssistant,
};
