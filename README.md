# Docutrack

An AI document and work management frontend built around **Topics**.

A Topic is one thing you are trying to accomplish — a job application, a
redesign, a tax year. Documents live inside it, and the AI reads them *as a
group*, in the context of the Topic's stated goal, rather than one file at a
time.

**Create Topic → Upload Documents → AI analyses → Review summaries and
recommendations → Improve documents over time.**

```bash
npm install
npm run dev     # http://localhost:3000
```

No backend, no account, no environment variables. It launches with a realistic
sample workspace you can edit, add to, or clear from Settings → Data & privacy.

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Hand-written CSS: a token layer in `src/app/globals.css` plus CSS Modules per component. No UI framework. |
| Icons | `lucide-react` |
| State | React Context + `useReducer` (`src/lib/store/`) |
| Persistence | `localStorage`, wrapped in `src/lib/storage.ts` |

---

## Architecture

```
src/
  app/
    page.tsx                  Public landing page
    (app)/                    Authenticated shell: sidebar, topbar, mobile nav
      dashboard/              Overview: metrics, recent topics, needs attention
      topics/                 Topic list + management
      topics/[topicId]/       Topic workspace — documents, insights, assistant
      documents/[documentId]/ Document detail: preview + AI analysis
      search/ profile/ settings/
  components/
    ui/                       Primitives: Button, Modal, ConfirmDialog, Menu,
                              Tabs, Segmented, Toggle, Toast, EmptyState, …
    app/                      Shell: Sidebar, Topbar, MobileNav, GlobalSearch
    topics/ documents/ ai/    Feature components
  lib/
    types.ts                  Domain model
    selectors.ts              All derived reads (counts are never stored)
    seed.ts                   Demonstration data
    storage.ts theme.ts utils.ts appearance.ts
    store/                    Reducer + provider (all mutations, all async work)
    services/
      parser.ts               Upload + text extraction
      ai/                     AI contract, mock provider, HTTP provider
```

**Business logic never lives in a component.** Pages read through `selectors.ts`
and mutate through the actions on `useApp()`; the pipeline that moves a document
from dropped file to analysed record lives entirely in
`src/lib/store/AppProvider.tsx`.

### Data model

`User · Topic · Document · DocumentAnalysis · Recommendation · TopicInsight ·
ChatMessage · AppSettings`

A Document belongs to a Topic; an Analysis belongs to a Document;
Recommendations reference their originating Document and carry status
(`open · resolved · dismissed · saved`). Nothing derivable is stored — a topic's
document count, recommendation count and "last updated" are all computed in
`selectors.ts`, so no two screens can disagree.

---

## Connecting a real backend

The AI layer is a swap, not a rewrite. `src/lib/services/ai/index.ts` resolves a
provider at build time:

```bash
NEXT_PUBLIC_AI_PROVIDER=http
NEXT_PUBLIC_AI_BASE_URL=https://your-api.example.com   # optional
```

`httpProvider.ts` then calls, with the exact shapes the mock returns:

```
POST /api/documents/analyze     analyzeDocument({ document, topicContext, preferences })
POST /api/topics/analyze        analyzeTopic({ topic, documents, analyses, openRecommendations })
POST /api/topics/:id/chat       askTopicAssistant({ topic, documents, …, question, history })
```

**No API keys belong in this codebase.** Those routes are expected to be
server-side endpoints that hold the model credentials themselves.

Real document parsing plugs in the same way: replace `parseDocument` in
`src/lib/services/parser.ts` (e.g. with a call to `POST /api/documents/parse`)
and keep the `ParseResult` shape. Everything downstream already handles
`textExtracted: false`.

Loading, processing, success, malformed-response, failure and retry are handled
for every AI call, and the UI stays usable when analysis fails — a failed
document keeps its place in the topic with a Retry action.

---

## What the mock AI actually does

It is a demonstration analyzer that runs locally, and it holds to two rules the
real product would also have to:

1. **Measured, not invented.** For formats the browser can genuinely read (TXT,
   MD, CSV) it extracts real statistics — word counts, detected sections,
   frequent terms, contact details, dates, quantified figures — and marks them
   *From document*. Cross-document insights compare actual vocabulary between
   files.
2. **It says when it doesn't know.** PDF/DOCX/XLSX/PPTX text cannot be read
   without a server-side parser, so those analyses are labelled as based on file
   name, type and topic context only, and their key information is marked
   *AI inferred*.

Every piece of information in the UI carries its provenance — **From document**,
**You wrote this**, or **AI inferred** — and recommendations are phrased as
suggestions. Nothing rewrites or modifies an uploaded file.

The mock fails ~5% of calls on purpose so the retry paths are real rather than
decorative. Any file with `fail` in its name always fails, which is handy for
demonstrating the failure state.

---

## Notes

- **Persistence.** Topics, documents, analyses, recommendation states, profile
  and settings survive a reload. Original file *contents* do not — object URLs
  are session-scoped, so the download action only works for files uploaded in
  the current session, and the UI says so.
- **Privacy.** Data is kept in this browser's `localStorage`. It is not
  encrypted and it is not sent anywhere. The Settings page states exactly this
  and claims nothing further.
- **Accessibility.** Semantic landmarks, labelled controls, keyboard-navigable
  menus/tabs/dialogs with focus trapping and restoration, visible focus rings,
  and status announcements for async work. Analysis and priority states always
  pair colour with an icon and a text label.
- **Motion.** Transitions are subtle in-app and more expressive on the landing
  page; all of it is disabled under `prefers-reduced-motion`.
- **Responsive.** Sidebar on desktop, compact bottom navigation on mobile; the
  document detail page collapses from two columns to one.
