import Link from 'next/link';
import {
  ArrowRight,
  FolderKanban,
  FileSearch,
  Sparkles,
  Network,
  Upload,
  MessagesSquare,
  ShieldCheck,
  Eye,
  PenLine,
} from 'lucide-react';
import { Logo } from '@/components/app/Logo';
import { HeroNetwork } from '@/components/landing/HeroNetwork';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import styles from './landing.module.css';

const FEATURES = [
  {
    icon: FolderKanban,
    title: 'Organize by Topic',
    body: 'Group every document related to one project, goal, application, client or area of work. A topic is the thing you are trying to accomplish — the files are just what it takes to get there.',
  },
  {
    icon: FileSearch,
    title: 'Understand Every Document',
    body: 'Each upload gets a summary, a plain description of what the document is, the goal it appears to serve, and the key information worth knowing — with each part labelled by where it came from.',
  },
  {
    icon: Sparkles,
    title: 'Get AI Recommendations',
    body: 'Contextual suggestions for improving a document, written against what it is trying to achieve — with the reasoning, why it matters, and a concrete action you can take or ignore.',
  },
  {
    icon: Network,
    title: 'Everything in Context',
    body: 'Documents are read as part of the topic around them, not as isolated files. Gaps, overlaps and misalignments only show up when documents are compared with each other.',
  },
];

const STEPS = [
  {
    icon: FolderKanban,
    title: 'Create a topic',
    body: 'Name what you are working on and, if you like, state the goal. That goal becomes the yardstick every suggestion is measured against.',
  },
  {
    icon: Upload,
    title: 'Add your documents',
    body: 'Drag in a CV, a brief, a job description, research, notes. Each one moves through uploading, reading, understanding and recommending — visibly.',
  },
  {
    icon: Sparkles,
    title: 'Read what came back',
    body: 'A summary, the document’s apparent purpose, key information and prioritised suggestions you can resolve, save or dismiss.',
  },
  {
    icon: MessagesSquare,
    title: 'Ask across the topic',
    body: 'Compare two documents, find what is missing, or ask what to fix first. The assistant already knows which topic you are in.',
  },
];

const TRUST = [
  {
    icon: Eye,
    title: 'Labelled by source',
    body: 'Information read from your file, information you typed, and information the model inferred are marked differently everywhere they appear.',
  },
  {
    icon: PenLine,
    title: 'Your document stays yours',
    body: 'Recommendations are suggestions. Nothing rewrites, replaces or edits your original file — any change is one you choose to make.',
  },
  {
    icon: ShieldCheck,
    title: 'No overstated claims',
    body: 'Where analysis is based on a file name rather than its contents, the app says so. Where something is a guess, it is presented as one.',
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <a className="skipLink" href="#hero">
        Skip to content
      </a>

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navLogo} aria-label="Docutrack home">
            <Logo />
          </Link>
          <nav className={styles.navLinks} aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#trust">Trust</a>
          </nav>
          <Link href="/dashboard" className={styles.navCta}>
            Open dashboard
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </header>

      <main>
        {/* --- Hero ------------------------------------------------------- */}
        <section className={styles.hero} id="hero">
          <span className={styles.heroGlow} aria-hidden />
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>
              <Sparkles size={13} aria-hidden />
              An AI workspace for documents
            </p>
            <h1 className={styles.heroTitle}>
              Turn scattered documents into <span className={styles.gradient}>organized knowledge</span>.
            </h1>
            <p className={styles.heroBody}>
              Docutrack organizes your files around what you are trying to accomplish. Group them into
              Topics, and get AI-generated summaries, context and recommendations that read each
              document as part of the bigger picture — not as a file on its own.
            </p>
            <div className={styles.heroActions}>
              <Link href="/dashboard" className={styles.primaryCta}>
                Get started
                <ArrowRight size={17} aria-hidden />
              </Link>
              <Link href="/dashboard" className={styles.secondaryCta}>
                Open dashboard
              </Link>
            </div>
            <p className={styles.heroNote}>
              Works straight away with a sample workspace. No account, and nothing leaves your browser.
            </p>
          </div>

          <div className={styles.heroDiagram}>
            <HeroNetwork />
          </div>
        </section>

        {/* --- Product preview -------------------------------------------- */}
        <section className={styles.previewSection}>
          <div className={styles.previewCopy}>
            <h2 className={styles.sectionTitle}>Your work, in one place</h2>
            <p className={styles.sectionBody}>
              The dashboard answers the questions you actually open a tool to ask: what am I working
              on, what changed, what needs me, and where did I leave off.
            </p>
          </div>
          <div className={styles.previewFrame}>
            <DashboardPreview />
          </div>
        </section>

        {/* --- Features ---------------------------------------------------- */}
        <section className={styles.section} id="features">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>What it does</p>
            <h2 className={styles.sectionTitle}>Built around topics, not folders</h2>
            <p className={styles.sectionBody}>
              A folder holds files. A topic holds an intention — and that difference is what makes the
              analysis useful.
            </p>
          </div>
          <div className={styles.featureGrid}>
            {FEATURES.map((feature) => (
              <article key={feature.title} className={styles.feature}>
                <span className={styles.featureIcon} aria-hidden>
                  <feature.icon size={19} />
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureBody}>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* --- How it works -------------------------------------------------- */}
        <section className={styles.section} id="how">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>How it works</p>
            <h2 className={styles.sectionTitle}>Four steps, start to finish</h2>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.stepIcon} aria-hidden>
                  <step.icon size={17} />
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Trust ---------------------------------------------------------- */}
        <section className={styles.sectionAlt} id="trust">
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>Trust</p>
            <h2 className={styles.sectionTitle}>Assistance, not authority</h2>
            <p className={styles.sectionBody}>
              AI analysis is useful when you can tell what it knows and what it is guessing. Docutrack
              is built to make that difference visible.
            </p>
          </div>
          <div className={styles.trustGrid}>
            {TRUST.map((item) => (
              <article key={item.title} className={styles.trustItem}>
                <span className={styles.trustIcon} aria-hidden>
                  <item.icon size={17} />
                </span>
                <div>
                  <h3 className={styles.trustTitle}>{item.title}</h3>
                  <p className={styles.trustBody}>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* --- Closing CTA ----------------------------------------------------- */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Your documents, organized around what you&rsquo;re trying to accomplish.</h2>
          <p className={styles.ctaBody}>
            Open the dashboard and look around — it comes loaded with a realistic sample workspace you
            can edit, add to or clear out entirely.
          </p>
          <Link href="/dashboard" className={styles.primaryCta}>
            Open dashboard
            <ArrowRight size={17} aria-hidden />
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Logo />
            <p>Your documents, organized around what you&rsquo;re trying to accomplish.</p>
          </div>
          <nav className={styles.footerNav} aria-label="Footer">
            <div>
              <h3>Product</h3>
              <a href="#features">Features</a>
              <a href="#how">How it works</a>
              <a href="#trust">Trust</a>
            </div>
            <div>
              <h3>Application</h3>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/topics">Topics</Link>
              <Link href="/search">Search</Link>
            </div>
            <div>
              <h3>Account</h3>
              <Link href="/profile">Profile</Link>
              <Link href="/settings">Settings</Link>
            </div>
          </nav>
        </div>
        <div className={styles.footerBase}>
          <p>
            Docutrack is a frontend demonstration. Analysis runs locally in your browser and is
            illustrative — check anything you plan to act on.
          </p>
        </div>
      </footer>
    </div>
  );
}
