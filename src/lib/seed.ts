/**
 * Demonstration data.
 *
 * Seeded once, then owned by the user — edits, deletions and new uploads all
 * persist over it. Timestamps are relative to first launch so "updated 2 hours
 * ago" is true rather than frozen.
 *
 * Consistency rule kept here, as everywhere else: only documents whose text the
 * app could genuinely read (.md, .txt, .csv) carry `textExtracted: true` and
 * `extracted` key information. Seeded PDFs and DOCX files are marked as
 * analysed from file metadata, matching what this build can actually do.
 */

import type {
  AppData,
  DocumentAnalysis,
  DocumentRecord,
  Recommendation,
  Topic,
  TopicInsight,
} from './types';
import { DEFAULT_SETTINGS } from './defaults';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

const INTERVIEW_NOTES = `# Interview prep — Northwind Systems

## Round 2: systems design (Thursday)
- Expect a design question on multi-region write paths.
- Revisit consistency trade-offs: quorum reads vs. leader pinning.
- Have the payment-ledger migration story ready: 40% p99 reduction, 18 months.

## Questions to ask
- How is the platform team split between product support and infrastructure?
- What does the on-call rotation look like in practice?
- Which parts of the Kubernetes migration are still in flight?

## Open follow-ups
- Ask the recruiter about the compensation band before round 3.
- Send the distributed-tracing write-up mentioned in round 1.

## Notes from round 1
Hiring manager emphasised distributed systems and Kubernetes twice.
Team is 9 engineers, moving from ECS to Kubernetes through 2026.
`;

const TAX_NOTES = `Tax notes 2026

Filing deadline: 31 January 2027
Accountant: Priya Raman (priya@ramanaccounting.example)

Income sources
- Primary employment (PAYE) - P60 received
- Freelance consulting - 4 invoices, all paid
- Dividend income from ISA - exempt

Expenses to claim
- Home office: 18% of floor area, 11 months
- Professional subscriptions: 2 memberships
- Equipment: laptop purchased March 2026, GBP 2,400
- Travel: 3 client visits, receipts in expenses spreadsheet

Outstanding
- Need the Q2 consulting invoice copy from the client portal
- Confirm whether the laptop should be claimed as capital allowance
`;

const CONTENT_INVENTORY = `page,url,type,owner,last_reviewed,keep
Home,/,landing,marketing,2026-05-02,yes
Product overview,/product,landing,marketing,2026-04-18,yes
Pricing,/pricing,landing,marketing,2026-06-01,yes
Docs home,/docs,documentation,engineering,2026-03-11,yes
API reference,/docs/api,documentation,engineering,2026-02-27,yes
Customer stories,/customers,marketing,marketing,2025-11-09,review
Careers,/careers,marketing,people,2026-01-15,yes
Legacy blog index,/blog-old,blog,marketing,2024-08-01,no
Webinar archive,/webinars,marketing,marketing,2025-06-20,review
`;

/* -------------------------------------------------------------------------- */
/* Topics                                                                     */
/* -------------------------------------------------------------------------- */

const topics: Topic[] = [
  {
    id: 'topic_application',
    name: 'Senior Software Engineer Application',
    description:
      'Everything for my application to the platform engineering role at Northwind Systems.',
    goal: 'Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.',
    icon: 'briefcase',
    accent: 'indigo',
    tags: ['job search', 'engineering', 'priority'],
    archived: false,
    createdAt: ago(18 * DAY),
    updatedAt: ago(2 * HOUR),
  },
  {
    id: 'topic_redesign',
    name: 'Website Redesign',
    description:
      'Discovery and requirements for rebuilding the marketing site ahead of the Q4 launch.',
    goal: 'Ship a redesigned marketing site that explains the product clearly and converts better than the current one.',
    icon: 'palette',
    accent: 'teal',
    tags: ['product', 'design', 'q4'],
    archived: false,
    createdAt: ago(32 * DAY),
    updatedAt: ago(2 * DAY),
  },
  {
    id: 'topic_tax',
    name: 'Personal Tax 2026',
    description: 'Records and working notes for the 2026 self-assessment return.',
    goal: 'Have every figure and supporting document ready before the January filing deadline.',
    icon: 'bank',
    accent: 'amber',
    tags: ['finance', 'annual'],
    archived: false,
    createdAt: ago(60 * DAY),
    updatedAt: ago(6 * DAY),
  },
  {
    id: 'topic_talk',
    name: 'Conference Talk — Scaling Ledgers',
    description: 'Abstract, slides and speaker notes for the 2025 platform conference talk.',
    goal: 'Deliver a 25-minute talk on ledger migration that a mixed audience can follow.',
    icon: 'idea',
    accent: 'violet',
    tags: ['speaking'],
    archived: true,
    createdAt: ago(210 * DAY),
    updatedAt: ago(150 * DAY),
  },
];

/* -------------------------------------------------------------------------- */
/* Documents                                                                  */
/* -------------------------------------------------------------------------- */

type SeedDoc = Omit<DocumentRecord, 'source'>;

const documents: DocumentRecord[] = (
  [
    {
      id: 'doc_cv',
      topicId: 'topic_application',
      name: 'Senior_Engineer_CV.pdf',
      format: 'pdf',
      sizeBytes: 284_160,
      status: 'ready',
      uploadedAt: ago(9 * DAY),
      updatedAt: ago(2 * HOUR),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_jd',
      topicId: 'topic_application',
      name: 'Job_Description_Northwind.pdf',
      format: 'pdf',
      sizeBytes: 118_400,
      status: 'ready',
      uploadedAt: ago(9 * DAY),
      updatedAt: ago(8 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_cover',
      topicId: 'topic_application',
      name: 'Cover_Letter.docx',
      format: 'docx',
      sizeBytes: 41_984,
      status: 'ready',
      uploadedAt: ago(5 * DAY),
      updatedAt: ago(5 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_portfolio',
      topicId: 'topic_application',
      name: 'Engineering_Portfolio.pdf',
      format: 'pdf',
      sizeBytes: 1_942_528,
      status: 'ready',
      uploadedAt: ago(4 * DAY),
      updatedAt: ago(4 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_interview',
      topicId: 'topic_application',
      name: 'Interview_Prep_Notes.md',
      format: 'md',
      sizeBytes: INTERVIEW_NOTES.length,
      status: 'ready',
      uploadedAt: ago(30 * HOUR),
      updatedAt: ago(28 * HOUR),
      extractedText: INTERVIEW_NOTES,
      textExtracted: true,
    },
    {
      id: 'doc_prd',
      topicId: 'topic_redesign',
      name: 'Product_Requirements.pdf',
      format: 'pdf',
      sizeBytes: 512_000,
      status: 'ready',
      uploadedAt: ago(20 * DAY),
      updatedAt: ago(2 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_research',
      topicId: 'topic_redesign',
      name: 'User_Research.pdf',
      format: 'pdf',
      sizeBytes: 768_000,
      status: 'ready',
      uploadedAt: ago(16 * DAY),
      updatedAt: ago(16 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_brief',
      topicId: 'topic_redesign',
      name: 'Design_Brief.docx',
      format: 'docx',
      sizeBytes: 66_560,
      status: 'ready',
      uploadedAt: ago(12 * DAY),
      updatedAt: ago(12 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_inventory',
      topicId: 'topic_redesign',
      name: 'Content_Inventory.csv',
      format: 'csv',
      sizeBytes: CONTENT_INVENTORY.length,
      status: 'unanalyzed',
      uploadedAt: ago(3 * DAY),
      updatedAt: ago(3 * DAY),
      extractedText: CONTENT_INVENTORY,
      textExtracted: true,
    },
    {
      id: 'doc_audit',
      topicId: 'topic_redesign',
      name: 'Legacy_Site_Audit.pdf',
      format: 'pdf',
      sizeBytes: 3_211_264,
      status: 'failed',
      statusDetail: 'Analysis failed',
      error: "The analysis service didn't return a usable response.",
      uploadedAt: ago(2 * DAY),
      updatedAt: ago(2 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_income',
      topicId: 'topic_tax',
      name: 'Income_Summary.pdf',
      format: 'pdf',
      sizeBytes: 204_800,
      status: 'ready',
      uploadedAt: ago(14 * DAY),
      updatedAt: ago(14 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_expenses',
      topicId: 'topic_tax',
      name: 'Expenses.xlsx',
      format: 'xlsx',
      sizeBytes: 98_304,
      status: 'ready',
      uploadedAt: ago(10 * DAY),
      updatedAt: ago(6 * DAY),
      extractedText: null,
      textExtracted: false,
    },
    {
      id: 'doc_taxnotes',
      topicId: 'topic_tax',
      name: 'Tax_Notes.txt',
      format: 'txt',
      sizeBytes: TAX_NOTES.length,
      status: 'ready',
      uploadedAt: ago(7 * DAY),
      updatedAt: ago(6 * DAY),
      extractedText: TAX_NOTES,
      textExtracted: true,
    },
    {
      id: 'doc_abstract',
      topicId: 'topic_talk',
      name: 'Talk_Abstract.txt',
      format: 'txt',
      sizeBytes: 1_180,
      status: 'ready',
      uploadedAt: ago(200 * DAY),
      updatedAt: ago(198 * DAY),
      extractedText:
        'Scaling Ledgers Without Downtime\n\nA 25-minute talk on migrating a payment ledger from a single-region Postgres cluster to a partitioned multi-region design, while keeping reconciliation exact. Covers the migration strategy, the two rollbacks along the way, and what we would do differently.\n\nAudience: backend and platform engineers. No prior ledger experience assumed.',
      textExtracted: true,
    },
    {
      id: 'doc_slides',
      topicId: 'topic_talk',
      name: 'Talk_Slides.pptx',
      format: 'pptx',
      sizeBytes: 4_718_592,
      status: 'ready',
      uploadedAt: ago(190 * DAY),
      updatedAt: ago(188 * DAY),
      extractedText: null,
      textExtracted: false,
    },
  ] as SeedDoc[]
).map((d) => ({ ...d, source: 'seed' as const }));

/* -------------------------------------------------------------------------- */
/* Analyses                                                                   */
/* -------------------------------------------------------------------------- */

const METADATA_NOTE = (fmt: string) =>
  `Text inside this ${fmt} was not read — this build has no server-side parser. The summary and suggestions are inferred from the file name, type and topic context.`;

const analyses: DocumentAnalysis[] = [
  {
    id: 'an_cv',
    documentId: 'doc_cv',
    topicId: 'topic_application',
    documentType: 'CV / Résumé',
    summary:
      'A senior engineering CV positioned around backend systems, distributed infrastructure and technical leadership, filed as the centrepiece of this application.',
    description:
      'A candidate-authored career summary. Its job is to make relevant experience quick to evaluate by a recruiter or hiring manager, usually within a first pass of under a minute.',
    inferredGoal:
      "Present the candidate's technical experience and qualifications convincingly in support of: Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.",
    keyInformation: [
      { id: 'ki_cv_1', label: 'File', value: 'PDF — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_cv_2', label: 'Sections typical of this type', value: 'Summary · Experience · Skills · Education · Contact', provenance: 'inferred' },
      { id: 'ki_cv_3', label: 'Topic goal (you wrote this)', value: 'Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.', provenance: 'user' },
      { id: 'ki_cv_4', label: 'Read alongside', value: 'Job Description · Cover Letter · Portfolio · Interview Notes', provenance: 'extracted' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PDF')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(2 * HOUR),
  },
  {
    id: 'an_jd',
    documentId: 'doc_jd',
    topicId: 'topic_application',
    documentType: 'Job Description',
    summary:
      'The role description for the Northwind Systems platform engineering position. In this topic it acts as the reference standard the other documents are measured against.',
    description:
      'An employer-authored document. In this topic it functions as the reference standard — the criteria your other documents are judged against.',
    inferredGoal:
      'Define what the employer is looking for, so candidates can judge fit and the employer can filter applications.',
    keyInformation: [
      { id: 'ki_jd_1', label: 'File', value: 'PDF — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_jd_2', label: 'Sections typical of this type', value: 'Responsibilities · Requirements · Nice to have · About the team', provenance: 'inferred' },
      { id: 'ki_jd_3', label: 'Role of this document in the topic', value: 'Reference standard — other documents are checked against it', provenance: 'inferred' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PDF')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(8 * DAY),
  },
  {
    id: 'an_cover',
    documentId: 'doc_cover',
    topicId: 'topic_application',
    documentType: 'Cover Letter',
    summary:
      'A cover letter written to accompany this application, connecting the candidate’s background to the specific role described in the job description.',
    description:
      'A short persuasive letter. Unlike a CV it argues a case rather than listing facts, and is usually read once, quickly, alongside the CV.',
    inferredGoal:
      'Make a focused case for the candidate in support of: Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.',
    keyInformation: [
      { id: 'ki_cl_1', label: 'File', value: 'DOCX — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_cl_2', label: 'Sections typical of this type', value: 'Opening · Fit · Motivation · Closing', provenance: 'inferred' },
      { id: 'ki_cl_3', label: 'Topic goal (you wrote this)', value: 'Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.', provenance: 'user' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('DOCX')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(5 * DAY),
  },
  {
    id: 'an_portfolio',
    documentId: 'doc_portfolio',
    topicId: 'topic_application',
    documentType: 'Portfolio',
    summary:
      'A collection of project write-ups and work samples evidencing practical engineering capability, filed alongside the CV in this application.',
    description:
      'Evidence-oriented material. Where a CV asserts capability, a portfolio demonstrates it through specific pieces of work.',
    inferredGoal:
      'Demonstrate practical capability with concrete work in support of: Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.',
    keyInformation: [
      { id: 'ki_pf_1', label: 'File', value: 'PDF — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_pf_2', label: 'Sections typical of this type', value: 'Projects · Context · Approach · Outcome', provenance: 'inferred' },
      { id: 'ki_pf_3', label: 'Read alongside', value: 'CV / Résumé · Job Description · Cover Letter', provenance: 'extracted' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PDF')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(4 * DAY),
  },
  {
    id: 'an_interview',
    documentId: 'doc_interview',
    topicId: 'topic_application',
    documentType: 'Interview Notes',
    summary:
      'Personal preparation notes for the Northwind interview rounds, covering a systems-design round, questions to ask, and open follow-ups.',
    description:
      'Working notes rather than a deliverable. Their value is in being current and specific enough to act on before the next conversation.',
    inferredGoal:
      'Prepare for upcoming conversations and retain what was learned in previous ones.',
    keyInformation: [
      { id: 'ki_in_1', label: 'Length', value: '183 words · about 1 min to read', provenance: 'extracted' },
      { id: 'ki_in_2', label: 'Sections found', value: 'Interview prep — Northwind Systems · Round 2: systems design (Thursday) · Questions to ask · Open follow-ups · Notes from round 1', provenance: 'extracted' },
      { id: 'ki_in_3', label: 'Most frequent terms', value: 'round, kubernetes, team, systems, ledger', provenance: 'extracted' },
      { id: 'ki_in_4', label: 'Figures mentioned', value: '40%, 18', provenance: 'extracted' },
      { id: 'ki_in_5', label: 'Structure', value: '12 bullet points across 6 blocks', provenance: 'extracted' },
      { id: 'ki_in_6', label: 'Topic goal (you wrote this)', value: 'Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.', provenance: 'user' },
    ],
    usedTopicContext: true,
    basedOn: 'document-text',
    confidence: 'high',
    notes: [],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(28 * HOUR),
  },
  {
    id: 'an_prd',
    documentId: 'doc_prd',
    topicId: 'topic_redesign',
    documentType: 'Requirements Document',
    summary:
      'A product requirements document defining the scope, goals and expected behaviour of the redesigned marketing site.',
    description:
      'A planning artefact that teams align around. Its value depends on being unambiguous and current.',
    inferredGoal:
      'Define what will be built, for whom, and how success will be judged, so that a team can execute without re-deciding.',
    keyInformation: [
      { id: 'ki_prd_1', label: 'File', value: 'PDF — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_prd_2', label: 'Sections typical of this type', value: 'Goals · Scope · Out of scope · Success metrics · Open questions', provenance: 'inferred' },
      { id: 'ki_prd_3', label: 'Topic goal (you wrote this)', value: 'Ship a redesigned marketing site that explains the product clearly and converts better than the current one.', provenance: 'user' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PDF')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(2 * DAY),
  },
  {
    id: 'an_research',
    documentId: 'doc_research',
    topicId: 'topic_redesign',
    documentType: 'User Research',
    summary:
      'Research findings describing how current visitors move through the marketing site and where they lose the thread.',
    description:
      'Evidence gathered from real users. It carries weight in decisions precisely because it is observational rather than assumed.',
    inferredGoal: 'Ground product decisions in observed user behaviour rather than assumption.',
    keyInformation: [
      { id: 'ki_ur_1', label: 'File', value: 'PDF — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_ur_2', label: 'Sections typical of this type', value: 'Method · Participants · Findings · Recommendations', provenance: 'inferred' },
      { id: 'ki_ur_3', label: 'Read alongside', value: 'Requirements Document · Design Brief', provenance: 'extracted' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PDF')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(16 * DAY),
  },
  {
    id: 'an_brief',
    documentId: 'doc_brief',
    topicId: 'topic_redesign',
    documentType: 'Design Brief',
    summary:
      'A design brief describing the direction, audience and constraints for the redesigned site.',
    description:
      'A framing document for design work. It is judged by whether a designer could act on it without a follow-up meeting.',
    inferredGoal: 'Give design work a clear direction, audience and set of constraints.',
    keyInformation: [
      { id: 'ki_db_1', label: 'File', value: 'DOCX — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_db_2', label: 'Sections typical of this type', value: 'Objective · Audience · Constraints · Deliverables', provenance: 'inferred' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('DOCX')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(12 * DAY),
  },
  {
    id: 'an_income',
    documentId: 'doc_income',
    topicId: 'topic_tax',
    documentType: 'Financial Record',
    summary: 'A summary of income for the 2026 tax year, filed for the self-assessment return.',
    description:
      'A record-keeping document. Accuracy and completeness matter more than presentation, and it may be needed as evidence later.',
    inferredGoal: 'Keep an accurate, complete record of financial activity for reporting or filing.',
    keyInformation: [
      { id: 'ki_inc_1', label: 'File', value: 'PDF — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_inc_2', label: 'Sections typical of this type', value: 'Summary · Line items · Totals', provenance: 'inferred' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PDF')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(14 * DAY),
  },
  {
    id: 'an_expenses',
    documentId: 'doc_expenses',
    topicId: 'topic_tax',
    documentType: 'Financial Record',
    summary: 'A spreadsheet of deductible expenses for the 2026 tax year.',
    description:
      'A record-keeping document. Accuracy and completeness matter more than presentation, and it may be needed as evidence later.',
    inferredGoal: 'Keep an accurate, complete record of financial activity for reporting or filing.',
    keyInformation: [
      { id: 'ki_exp_1', label: 'File', value: 'XLSX — text extraction unavailable in this build', provenance: 'extracted' },
      { id: 'ki_exp_2', label: 'Sections typical of this type', value: 'Summary · Line items · Totals', provenance: 'inferred' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('XLSX')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(6 * DAY),
  },
  {
    id: 'an_taxnotes',
    documentId: 'doc_taxnotes',
    topicId: 'topic_tax',
    documentType: 'Notes',
    summary:
      'Working notes for the 2026 return: income sources, expenses to claim, the filing deadline and two outstanding items.',
    description:
      'Informal material. Notes are most useful when they are periodically promoted into something more durable.',
    inferredGoal: 'Capture thinking and decisions quickly so nothing is lost.',
    keyInformation: [
      { id: 'ki_tn_1', label: 'Length', value: '132 words · about 1 min to read', provenance: 'extracted' },
      { id: 'ki_tn_2', label: 'Sections found', value: 'Income sources · Expenses to claim · Outstanding', provenance: 'extracted' },
      { id: 'ki_tn_3', label: 'Contact details', value: 'priya@ramanaccounting.example', provenance: 'extracted' },
      { id: 'ki_tn_4', label: 'Dates referenced', value: '2026, 2027', provenance: 'extracted' },
      { id: 'ki_tn_5', label: 'Figures mentioned', value: '18%, 2,400', provenance: 'extracted' },
    ],
    usedTopicContext: true,
    basedOn: 'document-text',
    confidence: 'high',
    notes: [],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(6 * DAY),
  },
  {
    id: 'an_abstract',
    documentId: 'doc_abstract',
    topicId: 'topic_talk',
    documentType: 'Notes',
    summary: 'The submitted abstract for a 25-minute conference talk on ledger migration.',
    description:
      'Informal material. Notes are most useful when they are periodically promoted into something more durable.',
    inferredGoal: 'Capture thinking and decisions quickly so nothing is lost.',
    keyInformation: [
      { id: 'ki_ab_1', label: 'Length', value: '61 words · about 1 min to read', provenance: 'extracted' },
      { id: 'ki_ab_2', label: 'Most frequent terms', value: 'ledger, talk, migration, region', provenance: 'extracted' },
    ],
    usedTopicContext: true,
    basedOn: 'document-text',
    confidence: 'high',
    notes: [],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(198 * DAY),
  },
  {
    id: 'an_slides',
    documentId: 'doc_slides',
    topicId: 'topic_talk',
    documentType: 'Presentation',
    summary: 'The slide deck delivered for the ledger-scaling talk.',
    description:
      'A document designed to be presented rather than read. It usually needs to work both with and without narration.',
    inferredGoal: 'Communicate a position to an audience in a time-limited setting.',
    keyInformation: [
      { id: 'ki_sl_1', label: 'File', value: 'PPTX — text extraction unavailable in this build', provenance: 'extracted' },
    ],
    usedTopicContext: true,
    basedOn: 'file-metadata',
    confidence: 'low',
    notes: [METADATA_NOTE('PPTX')],
    model: 'docutrack-demo-analyzer',
    analyzedAt: ago(188 * DAY),
  },
];

/* -------------------------------------------------------------------------- */
/* Recommendations                                                            */
/* -------------------------------------------------------------------------- */

type SeedRec = Omit<Recommendation, 'createdAt' | 'updatedAt'> & { age: number };

const recommendations: Recommendation[] = (
  [
    {
      id: 'rec_cv_1',
      documentId: 'doc_cv',
      topicId: 'topic_application',
      title: 'Make impact more measurable',
      explanation:
        'Experience entries in a CV of this kind commonly describe responsibilities rather than results, which makes the scale of the work hard to judge from a quick read.',
      whyItMatters:
        'Quantified impact makes experience far easier to evaluate quickly, which matters for the topic goal — “Prepare the strongest possible application for a senior backend engineering role, emphasising distributed systems experience.”',
      suggestedAction:
        'Where you can do so accurately, add measurable outcomes to the infrastructure and performance work — latency reduced, scale handled, cost saved, team size.',
      priority: 'high',
      section: 'Experience',
      status: 'open',
      age: 2 * HOUR,
    },
    {
      id: 'rec_cv_2',
      documentId: 'doc_cv',
      topicId: 'topic_application',
      title: 'Mirror vocabulary used in the role description',
      explanation:
        'A job description in this topic emphasises distributed systems and Kubernetes. Check that this CV uses the same terms where your experience genuinely covers them.',
      whyItMatters:
        'Both human reviewers and keyword screens look for the vocabulary used in the posting.',
      suggestedAction:
        'Where your experience genuinely covers a requirement, describe it using the same terms the posting uses.',
      priority: 'high',
      section: 'Skills',
      status: 'open',
      age: 2 * HOUR,
    },
    {
      id: 'rec_cv_3',
      documentId: 'doc_cv',
      topicId: 'topic_application',
      title: 'Lead with the most relevant experience',
      explanation:
        'Reviewers usually read the top third of a CV closely and skim the rest. Consider whether the first entries are the ones that best support the topic goal.',
      whyItMatters:
        'Ordering and emphasis decide what a reader takes away, even when every detail is accurate.',
      suggestedAction:
        'Move the most relevant role or project higher, and expand it by a bullet or two relative to older entries.',
      priority: 'medium',
      section: 'Experience',
      status: 'open',
      age: 2 * HOUR,
    },
    {
      id: 'rec_cv_4',
      documentId: 'doc_cv',
      topicId: 'topic_application',
      title: 'Tighten the opening summary',
      explanation:
        'The opening lines carry disproportionate weight. A short, specific positioning statement usually outperforms a general one.',
      whyItMatters: 'It sets the frame the rest of the document is read through.',
      suggestedAction:
        'Aim for two or three lines naming your specialism, the scale you have worked at, and what you are looking for next.',
      priority: 'low',
      section: 'Summary',
      status: 'resolved',
      age: 3 * DAY,
    },
    {
      id: 'rec_cover_1',
      documentId: 'doc_cover',
      topicId: 'topic_application',
      title: 'Tie each claim to evidence in the CV',
      explanation:
        'Claims land better when a reader can immediately verify them against the other documents in this topic.',
      whyItMatters:
        'A letter that is consistent with the CV reads as credible; one that diverges raises questions.',
      suggestedAction:
        'For each strength you assert, reference the role or project in the CV that demonstrates it.',
      priority: 'high',
      status: 'open',
      age: 5 * DAY,
    },
    {
      id: 'rec_cover_2',
      documentId: 'doc_cover',
      topicId: 'topic_application',
      title: 'Open with a specific hook rather than a formality',
      explanation:
        'Opening paragraphs that restate the job title spend the most valuable sentence of the letter on information the reader already has.',
      whyItMatters: 'The first sentence decides whether the rest is read attentively.',
      suggestedAction: 'Start with the single most relevant thing you have done for this kind of role.',
      priority: 'medium',
      section: 'Opening',
      status: 'open',
      age: 5 * DAY,
    },
    {
      id: 'rec_pf_1',
      documentId: 'doc_portfolio',
      topicId: 'topic_application',
      title: 'Surface the most relevant projects first',
      explanation:
        'Not every project helps with the topic goal. The order should reflect relevance to distributed-systems work rather than chronology.',
      whyItMatters: 'Readers rarely reach the end of a portfolio.',
      suggestedAction: 'Reorder so the two most relevant pieces open the document.',
      priority: 'high',
      section: 'Projects',
      status: 'open',
      age: 4 * DAY,
    },
    {
      id: 'rec_pf_2',
      documentId: 'doc_portfolio',
      topicId: 'topic_application',
      title: 'State your individual contribution',
      explanation: 'Team projects can leave a reader unsure which parts were yours.',
      whyItMatters: 'Ambiguity about ownership weakens otherwise strong evidence.',
      suggestedAction: 'Add a short "my role" note to any collaborative project.',
      priority: 'medium',
      status: 'dismissed',
      age: 4 * DAY,
    },
    {
      id: 'rec_jd_1',
      documentId: 'doc_jd',
      topicId: 'topic_application',
      title: 'Extract the requirements into a checklist',
      explanation:
        'Turning this posting into an explicit list makes it possible to check each requirement against the rest of the documents in this topic.',
      whyItMatters: 'Coverage gaps are much easier to see as a list than as prose.',
      suggestedAction:
        'List the must-have requirements, then mark which of your documents evidences each one.',
      priority: 'medium',
      section: 'Requirements',
      status: 'open',
      age: 8 * DAY,
    },
    {
      id: 'rec_in_1',
      documentId: 'doc_interview',
      topicId: 'topic_application',
      title: 'Turn open questions into follow-ups',
      explanation:
        'Two open follow-ups are listed in these notes — the compensation band and the distributed-tracing write-up — with no date attached to either.',
      whyItMatters:
        'Following up is usually the cheapest available progress towards the topic goal.',
      suggestedAction: 'Convert each open question into a dated follow-up item.',
      priority: 'medium',
      status: 'open',
      age: 28 * HOUR,
    },
    {
      id: 'rec_prd_1',
      documentId: 'doc_prd',
      topicId: 'topic_redesign',
      title: 'Define measurable success criteria',
      explanation:
        'Requirements documents commonly state goals qualitatively, which leaves no agreed way to judge whether the redesign worked.',
      whyItMatters: 'Without measurable criteria, scope debates cannot be settled with evidence.',
      suggestedAction: 'Add a target and a measurement method for each stated goal.',
      priority: 'high',
      section: 'Success metrics',
      status: 'open',
      age: 2 * DAY,
    },
    {
      id: 'rec_prd_2',
      documentId: 'doc_prd',
      topicId: 'topic_redesign',
      title: 'State what is explicitly out of scope',
      explanation:
        'Documents that list only inclusions leave the boundary open to interpretation.',
      whyItMatters: 'Most scope creep starts as an honest misunderstanding.',
      suggestedAction:
        'Add a short out-of-scope section naming the things you have decided not to do.',
      priority: 'medium',
      section: 'Scope',
      status: 'open',
      age: 2 * DAY,
    },
    {
      id: 'rec_ur_1',
      documentId: 'doc_research',
      topicId: 'topic_redesign',
      title: 'Separate observations from interpretations',
      explanation: 'What a user did and what the team concluded are different kinds of claim.',
      whyItMatters: 'Interpretations can be revisited later; observations should not change.',
      suggestedAction: 'Format observations and interpretations distinctly in the findings section.',
      priority: 'medium',
      section: 'Findings',
      status: 'open',
      age: 16 * DAY,
    },
    {
      id: 'rec_brief_1',
      documentId: 'doc_brief',
      topicId: 'topic_redesign',
      title: 'Name the constraints explicitly',
      explanation:
        'Briefs often describe ambition in detail and constraints only in passing.',
      whyItMatters: 'Constraints shape the work more than aspirations do.',
      suggestedAction: 'List the fixed points: timeline, platform, brand rules, technical limits.',
      priority: 'medium',
      section: 'Constraints',
      status: 'open',
      age: 12 * DAY,
    },
    {
      id: 'rec_tax_1',
      documentId: 'doc_taxnotes',
      topicId: 'topic_tax',
      title: 'Pull the actions to the top',
      explanation:
        'Two outstanding items sit at the end of these notes: a missing Q2 consulting invoice and an unresolved question about the laptop.',
      whyItMatters: 'A note only changes anything if the actions inside it get done.',
      suggestedAction: 'Move any action items into a short list at the top of the file.',
      priority: 'medium',
      section: 'Actions',
      status: 'open',
      age: 6 * DAY,
    },
    {
      id: 'rec_exp_1',
      documentId: 'doc_expenses',
      topicId: 'topic_tax',
      title: 'Check the record covers the full period',
      explanation:
        'Records assembled over time commonly have gaps at the start or end of a period.',
      whyItMatters: 'A missing month is easy to overlook and awkward to correct later.',
      suggestedAction: 'Confirm every month in the period is represented before filing.',
      priority: 'medium',
      status: 'open',
      age: 6 * DAY,
    },
    {
      id: 'rec_exp_2',
      documentId: 'doc_expenses',
      topicId: 'topic_tax',
      title: 'Review this with a qualified adviser',
      explanation:
        'This assistant can organise and summarise financial documents, but it does not provide tax or financial advice.',
      whyItMatters:
        'Filing decisions depend on rules and circumstances that are not visible here.',
      suggestedAction: 'Treat anything in this topic as preparation, not as advice.',
      priority: 'low',
      status: 'open',
      age: 6 * DAY,
    },
    {
      id: 'rec_inc_1',
      documentId: 'doc_income',
      topicId: 'topic_tax',
      title: 'Keep supporting evidence alongside totals',
      explanation: 'Totals without attached receipts or statements are harder to substantiate.',
      whyItMatters: 'Supporting evidence is what makes a figure defensible if questioned.',
      suggestedAction: 'Note where the backing document for each significant figure is stored.',
      priority: 'low',
      status: 'open',
      age: 14 * DAY,
    },
  ] as SeedRec[]
).map(({ age, ...rest }) => ({
  ...rest,
  createdAt: ago(age),
  updatedAt: ago(age),
}));

/* -------------------------------------------------------------------------- */
/* Topic insights                                                             */
/* -------------------------------------------------------------------------- */

const insights: TopicInsight[] = [
  {
    id: 'ins_app_1',
    topicId: 'topic_application',
    kind: 'alignment',
    title: 'The job description and your CV may be emphasising different things',
    body: 'Your interview notes record that the hiring manager raised distributed systems and Kubernetes twice. Your CV is filed as backend-infrastructure focused. Where your experience genuinely covers distributed systems and Kubernetes, that emphasis may be worth making more visible.',
    suggestedAction: 'Read the CV and job description side by side and align the emphasis.',
    relatedDocumentIds: ['doc_cv', 'doc_jd', 'doc_interview'],
    priority: 'high',
    status: 'open',
    createdAt: ago(2 * HOUR),
  },
  {
    id: 'ins_app_2',
    topicId: 'topic_application',
    kind: 'gap',
    title: 'Portfolio projects may not be referenced from the CV',
    body: 'This topic holds both a portfolio and a CV. Relevant projects that only appear in the portfolio are easy for a reviewer to miss, since the CV is usually read first.',
    suggestedAction: 'Reference one or two portfolio projects directly from the CV.',
    relatedDocumentIds: ['doc_cv', 'doc_portfolio'],
    priority: 'medium',
    status: 'open',
    createdAt: ago(2 * HOUR),
  },
  {
    id: 'ins_app_3',
    topicId: 'topic_application',
    kind: 'next-step',
    title: 'Start with 3 high-priority suggestions',
    body: 'Across this topic, the suggestion with the most leverage right now is “Make impact more measurable” on Senior_Engineer_CV.pdf.',
    suggestedAction: 'Open that document and work through its recommendations.',
    relatedDocumentIds: ['doc_cv'],
    priority: 'high',
    status: 'open',
    createdAt: ago(2 * HOUR),
  },
  {
    id: 'ins_redesign_1',
    topicId: 'topic_redesign',
    kind: 'gap',
    title: '2 documents in this topic have no analysis',
    body: 'Content_Inventory.csv and Legacy_Site_Audit.pdf are not included in anything on this page, so insights here are based on a partial picture.',
    suggestedAction: 'Run analysis on those documents.',
    relatedDocumentIds: ['doc_inventory', 'doc_audit'],
    priority: 'medium',
    status: 'open',
    createdAt: ago(2 * DAY),
  },
  {
    id: 'ins_redesign_2',
    topicId: 'topic_redesign',
    kind: 'alignment',
    title: 'Check that the requirements reflect the research findings',
    body: 'This topic holds a requirements document and a user research report. Requirements written before research findings land often keep assumptions the research has since contradicted.',
    suggestedAction: 'Re-read the findings section against the requirements goals.',
    relatedDocumentIds: ['doc_prd', 'doc_research'],
    priority: 'medium',
    status: 'open',
    createdAt: ago(2 * DAY),
  },
];

/* -------------------------------------------------------------------------- */
/* Assembled seed                                                             */
/* -------------------------------------------------------------------------- */

export function createSeedData(): AppData {
  return {
    profile: {
      id: 'user_local',
      fullName: 'Alex Mercer',
      email: 'alex.mercer@example.com',
      jobTitle: 'Senior Software Engineer',
      organization: 'Independent',
      bio: 'Backend engineer working on payment infrastructure and distributed systems. Currently interviewing for senior platform roles.',
      avatarUrl: null,
      createdAt: ago(60 * DAY),
    },
    settings: { ...DEFAULT_SETTINGS },
    topics,
    documents,
    analyses,
    recommendations,
    insights,
    messages: [],
    version: 1,
  };
}
