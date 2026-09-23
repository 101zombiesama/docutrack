/**
 * Document archetypes used by the mock provider.
 *
 * An archetype is a pattern the model recognises ("this looks like a CV") plus
 * the framing it uses to describe such a document and the kinds of improvement
 * it typically suggests. Everything produced from an archetype is phrased as a
 * suggestion and surfaced in the UI as AI-inferred, never as fact extracted
 * from the user's file.
 */

import type { Priority } from '../../types';
import type { TextStats } from './textStats';

export interface ArchetypeContext {
  docName: string;
  baseName: string;
  format: string;
  topicName: string | null;
  topicGoal: string | null;
  topicDescription: string | null;
  hasText: boolean;
  stats: TextStats | null;
  siblingTypes: string[];
  detailed: boolean;
}

export interface RecommendationTemplate {
  title: string;
  explanation: (c: ArchetypeContext) => string;
  whyItMatters: (c: ArchetypeContext) => string;
  suggestedAction: string;
  priority: Priority;
  section?: string;
}

export interface Archetype {
  key: string;
  /** AI-detected category shown in the UI. */
  documentType: string;
  keywords: string[];
  formats?: string[];
  summary: (c: ArchetypeContext) => string;
  description: (c: ArchetypeContext) => string;
  inferredGoal: (c: ArchetypeContext) => string;
  /** Labels the model expects to find; filled from real text when available. */
  expectedSections: string[];
  recommendations: RecommendationTemplate[];
}

const towards = (c: ArchetypeContext) =>
  c.topicGoal
    ? `the topic goal — “${c.topicGoal}”`
    : c.topicName
      ? `the goals of the “${c.topicName}” topic`
      : 'what this document is trying to achieve';

const inTopic = (c: ArchetypeContext) =>
  c.topicName ? ` within the “${c.topicName}” topic` : '';

export const ARCHETYPES: Archetype[] = [
  {
    key: 'cv',
    documentType: 'CV / Résumé',
    keywords: ['cv', 'resume', 'résumé', 'curriculum'],
    summary: (c) =>
      `A professional CV presenting career history, skills and achievements${inTopic(c)}.${
        c.detailed
          ? ' It appears structured around experience entries with supporting sections for skills and education, which is the conventional shape recruiters scan first.'
          : ''
      }`,
    description: () =>
      'A candidate-authored career summary. Its job is to make relevant experience quick to evaluate by a recruiter or hiring manager, usually within a first pass of under a minute.',
    inferredGoal: (c) =>
      c.topicGoal
        ? `Present the candidate's experience and qualifications convincingly in support of: ${c.topicGoal}`
        : 'Present the candidate’s technical experience and qualifications to potential employers.',
    expectedSections: ['Summary', 'Experience', 'Skills', 'Education', 'Contact'],
    recommendations: [
      {
        title: 'Make impact more measurable',
        explanation: (c) =>
          c.stats && c.stats.metrics.length === 0
            ? 'No numeric outcomes (percentages, volumes, timings or currency figures) were found in the text that was read. Experience bullets appear to describe responsibilities rather than results.'
            : 'Several experience bullets read as responsibilities rather than outcomes, so the scale of the work is hard to judge.',
        whyItMatters: (c) =>
          `Quantified impact makes experience far easier to evaluate quickly, which matters for ${towards(c)}.`,
        suggestedAction:
          'Where you can do so accurately, add measurable outcomes — latency reduced, scale handled, cost saved, team size, delivery time.',
        priority: 'high',
        section: 'Experience',
      },
      {
        title: 'Lead with the most relevant experience',
        explanation: (c) =>
          `Reviewers usually read the top third of a CV closely and skim the rest. Consider whether the first entries are the ones that best support ${towards(c)}.`,
        whyItMatters: () =>
          'Ordering and emphasis decide what a reader takes away, even when every detail is accurate.',
        suggestedAction:
          'Move the most relevant role or project higher, and expand it by a bullet or two relative to older entries.',
        priority: 'medium',
        section: 'Experience',
      },
      {
        title: 'Mirror vocabulary used in the role description',
        explanation: (c) =>
          c.siblingTypes.includes('Job Description')
            ? 'A job description in this topic uses terminology that does not appear to be echoed consistently in this CV.'
            : 'Terminology in this CV may not match the language used by the roles you are targeting.',
        whyItMatters: () =>
          'Both human reviewers and keyword screens look for the vocabulary used in the posting.',
        suggestedAction:
          'Where your experience genuinely covers a requirement, describe it using the same terms the posting uses.',
        priority: 'high',
        section: 'Skills',
      },
      {
        title: 'Tighten the opening summary',
        explanation: () =>
          'The opening lines carry disproportionate weight. A short, specific positioning statement usually outperforms a general one.',
        whyItMatters: () =>
          'It sets the frame the rest of the document is read through.',
        suggestedAction:
          'Aim for two or three lines naming your specialism, the scale you have worked at, and what you are looking for next.',
        priority: 'low',
        section: 'Summary',
      },
    ],
  },
  {
    key: 'cover-letter',
    documentType: 'Cover Letter',
    keywords: ['cover letter', 'cover_letter', 'coverletter', 'motivation letter'],
    summary: (c) =>
      `A cover letter written to accompany an application${inTopic(c)}, connecting the candidate's background to a specific role.`,
    description: () =>
      'A short persuasive letter. Unlike a CV it argues a case rather than listing facts, and is usually read once, quickly, alongside the CV.',
    inferredGoal: (c) =>
      c.topicGoal
        ? `Make a focused case for the candidate in support of: ${c.topicGoal}`
        : 'Explain why this candidate is a strong fit for this specific role and organisation.',
    expectedSections: ['Opening', 'Fit', 'Motivation', 'Closing'],
    recommendations: [
      {
        title: 'Open with a specific hook rather than a formality',
        explanation: () =>
          'Opening paragraphs that restate the job title spend the most valuable sentence of the letter on information the reader already has.',
        whyItMatters: () =>
          'The first sentence decides whether the rest is read attentively.',
        suggestedAction:
          'Start with the single most relevant thing you have done for this kind of role.',
        priority: 'medium',
        section: 'Opening',
      },
      {
        title: 'Tie each claim to evidence in the CV',
        explanation: (c) =>
          `Claims land better when a reader can immediately verify them against the other documents${inTopic(c)}.`,
        whyItMatters: () =>
          'A letter that is consistent with the CV reads as credible; one that diverges raises questions.',
        suggestedAction:
          'For each strength you assert, reference the role or project in the CV that demonstrates it.',
        priority: 'high',
      },
      {
        title: 'Keep it to one page',
        explanation: (c) =>
          c.stats && c.stats.words > 500
            ? `The text read is roughly ${c.stats.words} words, which is longer than the typical one-page letter.`
            : 'Cover letters are most effective at around 250–400 words.',
        whyItMatters: () => 'Length competes directly with the attention the CV needs.',
        suggestedAction: 'Cut background that the CV already covers and keep the argument.',
        priority: 'low',
      },
    ],
  },
  {
    key: 'job-description',
    documentType: 'Job Description',
    keywords: ['job description', 'job_description', 'jd', 'role description', 'job spec', 'posting', 'vacancy'],
    summary: (c) =>
      `A role description setting out responsibilities, requirements and expectations for a position${inTopic(c)}.`,
    description: () =>
      'An employer-authored document. In this topic it functions as the reference standard — the criteria your other documents are judged against.',
    inferredGoal: () =>
      'Define what the employer is looking for, so candidates can judge fit and the employer can filter applications.',
    expectedSections: ['Responsibilities', 'Requirements', 'Nice to have', 'About the team'],
    recommendations: [
      {
        title: 'Extract the requirements into a checklist',
        explanation: (c) =>
          `Turning this posting into an explicit list makes it possible to check each requirement against the rest of the documents${inTopic(c)}.`,
        whyItMatters: () =>
          'Coverage gaps are much easier to see as a list than as prose.',
        suggestedAction:
          'List the must-have requirements, then mark which of your documents evidences each one.',
        priority: 'medium',
        section: 'Requirements',
      },
      {
        title: 'Note the emphasis, not just the keywords',
        explanation: () =>
          'Postings usually repeat the two or three things that actually matter most; the rest is boilerplate.',
        whyItMatters: () =>
          'Aligning to the emphasis is more effective than matching every listed technology.',
        suggestedAction:
          'Identify the repeated themes and make sure they are prominent in your CV and letter.',
        priority: 'low',
      },
    ],
  },
  {
    key: 'portfolio',
    documentType: 'Portfolio',
    keywords: ['portfolio', 'case study', 'work samples', 'projects'],
    summary: (c) =>
      `A collection of project write-ups and work samples evidencing practical capability${inTopic(c)}.`,
    description: () =>
      'Evidence-oriented material. Where a CV asserts capability, a portfolio demonstrates it through specific pieces of work.',
    inferredGoal: (c) =>
      c.topicGoal
        ? `Demonstrate practical capability with concrete work in support of: ${c.topicGoal}`
        : 'Demonstrate capability through concrete examples of delivered work.',
    expectedSections: ['Projects', 'Context', 'Approach', 'Outcome'],
    recommendations: [
      {
        title: 'Give each project a one-line outcome',
        explanation: () =>
          'Project write-ups often describe what was built without stating what changed as a result.',
        whyItMatters: (c) =>
          `Outcomes are what make a project relevant to ${towards(c)}.`,
        suggestedAction:
          'Add a single closing line per project: what improved, for whom, by how much.',
        priority: 'medium',
        section: 'Projects',
      },
      {
        title: 'Surface the most relevant projects first',
        explanation: (c) =>
          `Not every project helps with ${towards(c)}. The order should reflect relevance rather than chronology.`,
        whyItMatters: () => 'Readers rarely reach the end of a portfolio.',
        suggestedAction: 'Reorder so the two most relevant pieces open the document.',
        priority: 'high',
        section: 'Projects',
      },
      {
        title: 'State your individual contribution',
        explanation: () =>
          'Team projects can leave a reader unsure which parts were yours.',
        whyItMatters: () => 'Ambiguity about ownership weakens otherwise strong evidence.',
        suggestedAction: 'Add a short "my role" note to any collaborative project.',
        priority: 'medium',
      },
    ],
  },
  {
    key: 'interview-notes',
    documentType: 'Interview Notes',
    keywords: ['interview', 'notes', 'prep', 'questions'],
    summary: (c) =>
      `Personal notes capturing interview preparation, questions and observations${inTopic(c)}.`,
    description: () =>
      'Working notes rather than a deliverable. Their value is in being current and specific enough to act on before the next conversation.',
    inferredGoal: () =>
      'Prepare for upcoming conversations and retain what was learned in previous ones.',
    expectedSections: ['Questions to ask', 'Answers to prepare', 'Follow-ups'],
    recommendations: [
      {
        title: 'Separate facts from impressions',
        explanation: () =>
          'Notes mix things you were told with things you inferred, and the difference matters later.',
        whyItMatters: () => 'Acting on a remembered impression as if it were a stated fact is a common error.',
        suggestedAction: 'Mark which lines came directly from the conversation.',
        priority: 'low',
      },
      {
        title: 'Turn open questions into follow-ups',
        explanation: () => 'Unanswered questions tend to stay unanswered unless they become actions.',
        whyItMatters: (c) => `Following up is usually the cheapest available progress towards ${towards(c)}.`,
        suggestedAction: 'Convert each open question into a dated follow-up item.',
        priority: 'medium',
      },
    ],
  },
  {
    key: 'company-research',
    documentType: 'Research Notes',
    keywords: ['research', 'company', 'market', 'competitor', 'background'],
    summary: (c) =>
      `Background research gathered to inform decisions${inTopic(c)}.`,
    description: () =>
      'Reference material assembled by the user. It informs other documents rather than being delivered to anyone directly.',
    inferredGoal: () => 'Build enough context to make informed, specific decisions.',
    expectedSections: ['Overview', 'Findings', 'Sources'],
    recommendations: [
      {
        title: 'Record sources alongside findings',
        explanation: (c) =>
          c.stats && c.stats.urls.length === 0
            ? 'No links were found in the text that was read, so findings cannot easily be traced back.'
            : 'Some findings appear without an attached source.',
        whyItMatters: () => 'Unsourced notes are hard to verify or update later.',
        suggestedAction: 'Attach a link or reference to each substantive finding.',
        priority: 'medium',
        section: 'Findings',
      },
      {
        title: 'Summarise the “so what”',
        explanation: () => 'Research is most useful when it ends with implications rather than facts.',
        whyItMatters: (c) => `It connects what you learned to ${towards(c)}.`,
        suggestedAction: 'Add three bullets stating what this research changes about your approach.',
        priority: 'low',
      },
    ],
  },
  {
    key: 'requirements',
    documentType: 'Requirements Document',
    keywords: ['requirement', 'prd', 'spec', 'scope', 'brief.*product'],
    summary: (c) =>
      `A product requirements document defining scope, goals and expected behaviour${inTopic(c)}.`,
    description: () =>
      'A planning artefact that teams align around. Its value depends on being unambiguous and current.',
    inferredGoal: () =>
      'Define what will be built, for whom, and how success will be judged, so that a team can execute without re-deciding.',
    expectedSections: ['Goals', 'Scope', 'Out of scope', 'Success metrics', 'Open questions'],
    recommendations: [
      {
        title: 'Define measurable success criteria',
        explanation: (c) =>
          c.stats && c.stats.metrics.length === 0
            ? 'No numeric targets were found in the text that was read, so it is unclear how success would be judged.'
            : 'Success criteria appear qualitative in places.',
        whyItMatters: () => 'Without measurable criteria, scope debates cannot be settled with evidence.',
        suggestedAction: 'Add a target and a measurement method for each stated goal.',
        priority: 'high',
        section: 'Success metrics',
      },
      {
        title: 'State what is explicitly out of scope',
        explanation: () => 'Documents that list only inclusions leave the boundary open to interpretation.',
        whyItMatters: () => 'Most scope creep starts as an honest misunderstanding.',
        suggestedAction: 'Add a short out-of-scope section naming the things you have decided not to do.',
        priority: 'medium',
        section: 'Scope',
      },
      {
        title: 'Track open questions with owners',
        explanation: () => 'Unresolved questions in a requirements document tend to surface during build.',
        whyItMatters: () => 'An owner and a date turn a risk into a task.',
        suggestedAction: 'Give each open question a named owner and a decision date.',
        priority: 'low',
        section: 'Open questions',
      },
    ],
  },
  {
    key: 'user-research',
    documentType: 'User Research',
    keywords: ['user research', 'usability', 'interviews', 'survey', 'findings'],
    summary: (c) => `Research findings describing observed user behaviour and needs${inTopic(c)}.`,
    description: () =>
      'Evidence gathered from real users. It carries weight in decisions precisely because it is observational rather than assumed.',
    inferredGoal: () => 'Ground product decisions in observed user behaviour rather than assumption.',
    expectedSections: ['Method', 'Participants', 'Findings', 'Recommendations'],
    recommendations: [
      {
        title: 'State sample size and method near the top',
        explanation: () => 'Readers weigh findings differently depending on how they were gathered.',
        whyItMatters: () => 'Findings quoted without method tend to get over-applied.',
        suggestedAction: 'Add a short method line: how many participants, recruited how, studied how.',
        priority: 'medium',
        section: 'Method',
      },
      {
        title: 'Separate observations from interpretations',
        explanation: () => 'What a user did and what the team concluded are different kinds of claim.',
        whyItMatters: () => 'Interpretations can be revisited later; observations should not change.',
        suggestedAction: 'Format observations and interpretations distinctly in the findings section.',
        priority: 'high',
        section: 'Findings',
      },
    ],
  },
  {
    key: 'design-brief',
    documentType: 'Design Brief',
    keywords: ['design brief', 'brief', 'creative', 'brand', 'style guide'],
    summary: (c) => `A design brief describing direction, constraints and intended outcome${inTopic(c)}.`,
    description: () =>
      'A framing document for design work. It is judged by whether a designer could act on it without a follow-up meeting.',
    inferredGoal: () => 'Give design work a clear direction, audience and set of constraints.',
    expectedSections: ['Objective', 'Audience', 'Constraints', 'Deliverables'],
    recommendations: [
      {
        title: 'Name the constraints explicitly',
        explanation: () => 'Briefs often describe ambition in detail and constraints only in passing.',
        whyItMatters: () => 'Constraints shape the work more than aspirations do.',
        suggestedAction: 'List the fixed points: timeline, platform, brand rules, technical limits.',
        priority: 'medium',
        section: 'Constraints',
      },
      {
        title: 'Describe the audience concretely',
        explanation: () => 'A specific audience description produces more decisive design than a general one.',
        whyItMatters: (c) => `It keeps work aligned to ${towards(c)}.`,
        suggestedAction: 'Replace general audience language with one or two concrete user descriptions.',
        priority: 'low',
        section: 'Audience',
      },
    ],
  },
  {
    key: 'financial',
    documentType: 'Financial Record',
    keywords: ['income', 'expense', 'invoice', 'receipt', 'tax', 'statement', 'budget', 'payroll'],
    formats: ['xlsx', 'csv'],
    summary: (c) => `A financial record holding figures relevant to ${c.topicName ?? 'this topic'}.`,
    description: () =>
      'A record-keeping document. Accuracy and completeness matter more than presentation, and it may be needed as evidence later.',
    inferredGoal: () => 'Keep an accurate, complete record of financial activity for reporting or filing.',
    expectedSections: ['Summary', 'Line items', 'Totals'],
    recommendations: [
      {
        title: 'Check the record covers the full period',
        explanation: () => 'Records assembled over time commonly have gaps at the start or end of a period.',
        whyItMatters: () => 'A missing month is easy to overlook and awkward to correct later.',
        suggestedAction: 'Confirm every month in the period is represented before filing.',
        priority: 'medium',
      },
      {
        title: 'Keep supporting evidence alongside totals',
        explanation: () => 'Totals without attached receipts or statements are harder to substantiate.',
        whyItMatters: () => 'Supporting evidence is what makes a figure defensible if questioned.',
        suggestedAction: 'Note where the backing document for each significant figure is stored.',
        priority: 'low',
      },
      {
        title: 'Review this with a qualified adviser',
        explanation: () =>
          'This assistant can organise and summarise financial documents, but it does not provide tax or financial advice.',
        whyItMatters: () => 'Filing decisions depend on rules and circumstances that are not visible here.',
        suggestedAction: 'Treat anything in this topic as preparation, not as advice.',
        priority: 'low',
      },
    ],
  },
  {
    key: 'contract',
    documentType: 'Agreement / Contract',
    keywords: ['contract', 'agreement', 'terms', 'nda', 'offer letter'],
    summary: (c) => `A contractual document setting out terms between parties${inTopic(c)}.`,
    description: () =>
      'A binding or near-binding document. What matters is the specific wording of obligations, dates and termination terms.',
    inferredGoal: () => 'Record agreed terms between parties in a form both can rely on.',
    expectedSections: ['Parties', 'Term', 'Obligations', 'Termination'],
    recommendations: [
      {
        title: 'Note the key dates somewhere you will see them',
        explanation: () => 'Start dates, notice periods and renewal windows are easy to miss inside a long document.',
        whyItMatters: () => 'Missed notice windows are one of the most common and costly oversights.',
        suggestedAction: 'Record the dates in a calendar or in the topic description.',
        priority: 'medium',
        section: 'Term',
      },
      {
        title: 'Have a qualified person review anything binding',
        explanation: () => 'This assistant summarises documents; it does not give legal advice.',
        whyItMatters: () => 'Contract wording has consequences that a summary cannot capture.',
        suggestedAction: 'Ask a qualified reviewer before signing.',
        priority: 'low',
      },
    ],
  },
  {
    key: 'presentation',
    documentType: 'Presentation',
    keywords: ['deck', 'slides', 'presentation', 'pitch'],
    formats: ['pptx'],
    summary: (c) => `A slide deck prepared for presenting${inTopic(c)}.`,
    description: () =>
      'A document designed to be presented rather than read. It usually needs to work both with and without narration.',
    inferredGoal: () => 'Communicate a position to an audience in a time-limited setting.',
    expectedSections: ['Opening', 'Body', 'Ask'],
    recommendations: [
      {
        title: 'Make the ask explicit',
        explanation: () => 'Decks often end on a summary rather than on what the presenter wants to happen next.',
        whyItMatters: (c) => `A clear ask is what converts attention into progress towards ${towards(c)}.`,
        suggestedAction: 'Add a closing slide naming the decision or action you need.',
        priority: 'medium',
      },
      {
        title: 'Check it reads without you in the room',
        explanation: () => 'Decks are frequently forwarded and read cold.',
        whyItMatters: () => 'A slide that needs narration loses its meaning the moment it is shared.',
        suggestedAction: 'Add short speaker notes or make headlines self-contained.',
        priority: 'low',
      },
    ],
  },
  {
    key: 'notes',
    documentType: 'Notes',
    keywords: ['notes', 'minutes', 'meeting', 'todo', 'ideas', 'scratch'],
    formats: ['txt', 'md'],
    summary: (c) => `Working notes captured${inTopic(c)}.`,
    description: () =>
      'Informal material. Notes are most useful when they are periodically promoted into something more durable.',
    inferredGoal: () => 'Capture thinking and decisions quickly so nothing is lost.',
    expectedSections: ['Notes', 'Actions'],
    recommendations: [
      {
        title: 'Pull the actions to the top',
        explanation: () => 'Actions buried in running notes are frequently missed.',
        whyItMatters: () => 'A note only changes anything if the actions inside it get done.',
        suggestedAction: 'Move any action items into a short list at the top of the file.',
        priority: 'medium',
        section: 'Actions',
      },
      {
        title: 'Add dates to entries',
        explanation: (c) =>
          c.stats && c.stats.years.length === 0
            ? 'No dates were found in the text that was read.'
            : 'Some entries appear undated.',
        whyItMatters: () => 'Undated notes become hard to trust once the situation moves on.',
        suggestedAction: 'Date each entry as you add it.',
        priority: 'low',
      },
    ],
  },
];

export const GENERIC_ARCHETYPE: Archetype = {
  key: 'generic',
  documentType: 'Document',
  keywords: [],
  summary: (c) =>
    `A document filed${inTopic(c)}${
      c.hasText ? ', covering the material read from the file' : '. Its contents could not be read in this build'
    }.`,
  description: () =>
    'The document type could not be confidently identified from the file name or contents available here.',
  inferredGoal: (c) =>
    c.topicGoal
      ? `Support the topic goal: ${c.topicGoal}`
      : 'Support the work this topic is organised around.',
  expectedSections: [],
  recommendations: [
    {
      title: 'Give the file a more descriptive name',
      explanation: () =>
        'The file name is the strongest signal available when a document’s contents cannot be read. A descriptive name improves classification and makes the document easier to find.',
      whyItMatters: () => 'Naming is also how you will find this again in six months.',
      suggestedAction: 'Rename to describe what the document is, e.g. “Q3_Supplier_Contract.pdf”.',
      priority: 'medium',
    },
    {
      title: 'Add a goal to this topic',
      explanation: (c) =>
        c.topicGoal
          ? 'The topic goal was used as context for this analysis.'
          : 'This topic has no stated goal, so recommendations here are generic rather than targeted.',
      whyItMatters: () => 'A stated goal is the main thing that makes suggestions specific to your situation.',
      suggestedAction: 'Open the topic, choose Edit, and describe what you are trying to accomplish.',
      priority: 'low',
    },
  ],
};

/** Pick the archetype whose signals best match this file. */
export function classify(fileName: string, format: string, text: string | null): Archetype {
  const haystack = `${fileName.toLowerCase().replace(/[_-]+/g, ' ')} ${(text ?? '').slice(0, 1200).toLowerCase()}`;
  let best: { archetype: Archetype; score: number } | null = null;

  for (const archetype of ARCHETYPES) {
    let score = 0;
    for (const kw of archetype.keywords) {
      if (new RegExp(`\\b${kw}`, 'i').test(haystack)) score += kw.includes(' ') ? 3 : 2;
    }
    if (archetype.formats?.includes(format)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { archetype, score };
  }

  return best?.archetype ?? GENERIC_ARCHETYPE;
}
