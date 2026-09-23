'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Monitor,
  Download,
  RotateCcw,
  Trash2,
  Database,
  Info,
} from 'lucide-react';
import type { DetailLevel, SummaryStyle, ThemePreference, ViewMode } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { LANGUAGES } from '@/lib/defaults';
import { estimateStorageBytes } from '@/lib/storage';
import { aiProviderName, isMockAI } from '@/lib/services/ai';
import { PageHeader } from '@/components/app/PageHeader';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { selectClass } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { formatBytes } from '@/lib/utils';
import styles from './settings.module.css';

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'ai', label: 'AI preferences' },
  { id: 'documents', label: 'Documents' },
  { id: 'data', label: 'Data & privacy' },
];

export function SettingsView() {
  const { data, updateSettings, restoreDemoData, deleteAllData } = useApp();
  const { notify } = useToast();
  const router = useRouter();
  const settings = data.settings;

  const [storageBytes, setStorageBytes] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setStorageBytes(estimateStorageBytes());
  }, [data]);

  function exportData() {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `docutrack-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify({ tone: 'success', title: 'Export downloaded' });
    } catch {
      notify({ tone: 'error', title: 'Export failed', description: 'The file could not be created.' });
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Preferences are saved in this browser." />

      <div className={styles.layout}>
        <nav className={styles.sectionNav} aria-label="Settings sections">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} className={styles.sectionLink}>
              {section.label}
            </a>
          ))}
        </nav>

        <div className={styles.sections}>
          {/* --- General --------------------------------------------------- */}
          <section className={styles.card} id="general" aria-labelledby="general-heading">
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle} id="general-heading">
                General
              </h2>
              <p className={styles.cardDescription}>How the interface looks and behaves.</p>
            </header>

            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.rowText}>
                  <p className={styles.rowLabel}>Theme</p>
                  <p className={styles.rowHint}>System follows your device setting.</p>
                </div>
                <Segmented
                  label="Theme"
                  size="sm"
                  value={settings.theme}
                  onChange={(theme: ThemePreference) => updateSettings({ theme })}
                  options={[
                    { value: 'light', label: 'Light', icon: <Sun size={14} /> },
                    { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
                    { value: 'system', label: 'System', icon: <Monitor size={14} /> },
                  ]}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.rowText}>
                  <p className={styles.rowLabel}>Language</p>
                  <p className={styles.rowHint}>
                    Interface text is English in this build; this records your preference.
                  </p>
                </div>
                <select
                  className={`${selectClass} ${styles.inlineSelect}`}
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  aria-label="Language"
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.row}>
                <div className={styles.rowText}>
                  <p className={styles.rowLabel}>Default topic view</p>
                  <p className={styles.rowHint}>How the Topics page opens.</p>
                </div>
                <Segmented
                  label="Default topic view"
                  size="sm"
                  value={settings.defaultTopicView}
                  onChange={(defaultTopicView: ViewMode) => updateSettings({ defaultTopicView })}
                  options={[
                    { value: 'grid', label: 'Grid' },
                    { value: 'list', label: 'List' },
                  ]}
                />
              </div>

              <Toggle
                label="Compact density"
                description="Reduce type size and spacing to fit more on screen."
                checked={settings.compactDensity}
                onChange={(compactDensity) => updateSettings({ compactDensity })}
              />
            </div>
          </section>

          {/* --- AI -------------------------------------------------------- */}
          <section className={styles.card} id="ai" aria-labelledby="ai-heading">
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle} id="ai-heading">
                AI preferences
              </h2>
              <p className={styles.cardDescription}>
                How documents are analysed and how much detail you get back.
              </p>
            </header>

            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.rowText}>
                  <p className={styles.rowLabel}>Summary length</p>
                  <p className={styles.rowHint}>Applies the next time a document is analysed.</p>
                </div>
                <Segmented
                  label="Summary length"
                  size="sm"
                  value={settings.summaryStyle}
                  onChange={(summaryStyle: SummaryStyle) => updateSettings({ summaryStyle })}
                  options={[
                    { value: 'concise', label: 'Concise' },
                    { value: 'detailed', label: 'Detailed' },
                  ]}
                />
              </div>

              <div className={styles.row}>
                <div className={styles.rowText}>
                  <p className={styles.rowLabel}>Recommendation detail</p>
                  <p className={styles.rowHint}>
                    Controls how many suggestions each analysis produces.
                  </p>
                </div>
                <Segmented
                  label="Recommendation detail"
                  size="sm"
                  value={settings.recommendationDetail}
                  onChange={(recommendationDetail: DetailLevel) =>
                    updateSettings({ recommendationDetail })
                  }
                  options={[
                    { value: 'brief', label: 'Brief' },
                    { value: 'standard', label: 'Standard' },
                    { value: 'in-depth', label: 'In-depth' },
                  ]}
                />
              </div>

              <Toggle
                label="Analyse uploads automatically"
                description="When off, documents upload and wait until you run analysis yourself."
                checked={settings.autoAnalyzeUploads}
                onChange={(autoAnalyzeUploads) => updateSettings({ autoAnalyzeUploads })}
              />

              <Toggle
                label="Include topic context in analysis"
                description="Sends the topic name, description and goal with each document so suggestions relate to what you are trying to achieve. Turning this off makes analysis generic."
                checked={settings.includeTopicContext}
                onChange={(includeTopicContext) => updateSettings({ includeTopicContext })}
              />

              <Toggle
                label="Generate topic insights after uploading"
                description="Re-runs the cross-document comparison for a topic once new uploads finish."
                checked={settings.autoGenerateTopicInsights}
                onChange={(autoGenerateTopicInsights) => updateSettings({ autoGenerateTopicInsights })}
              />
            </div>

            <p className={styles.note}>
              <Info size={14} aria-hidden />
              {isMockAI
                ? 'This build runs a local demonstration analyzer — no document leaves your browser and no external AI service is called. Analysis is illustrative and should be checked.'
                : `Analysis is served by the “${aiProviderName}” provider configured for this build.`}
            </p>
          </section>

          {/* --- Documents -------------------------------------------------- */}
          <section className={styles.card} id="documents" aria-labelledby="documents-heading">
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle} id="documents-heading">
                Documents
              </h2>
              <p className={styles.cardDescription}>Upload behaviour and confirmations.</p>
            </header>

            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.rowText}>
                  <p className={styles.rowLabel}>Default document view</p>
                  <p className={styles.rowHint}>How documents are listed inside a topic.</p>
                </div>
                <Segmented
                  label="Default document view"
                  size="sm"
                  value={settings.defaultDocumentView}
                  onChange={(defaultDocumentView: ViewMode) => updateSettings({ defaultDocumentView })}
                  options={[
                    { value: 'list', label: 'List' },
                    { value: 'grid', label: 'Grid' },
                  ]}
                />
              </div>

              <Toggle
                label="Confirm before deleting"
                description="Ask before a document or topic is removed."
                checked={settings.confirmBeforeDelete}
                onChange={(confirmBeforeDelete) => updateSettings({ confirmBeforeDelete })}
              />

              <Toggle
                label="Confirm before re-running analysis"
                description="Re-running replaces the current summary and recommendations for that document."
                checked={settings.confirmBeforeRerun}
                onChange={(confirmBeforeRerun) => updateSettings({ confirmBeforeRerun })}
              />
            </div>
          </section>

          {/* --- Data ------------------------------------------------------- */}
          <section className={styles.card} id="data" aria-labelledby="data-heading">
            <header className={styles.cardHead}>
              <h2 className={styles.cardTitle} id="data-heading">
                Data & privacy
              </h2>
              <p className={styles.cardDescription}>Where your information lives and how to remove it.</p>
            </header>

            <div className={styles.storage}>
              <span className={styles.storageIcon} aria-hidden>
                <Database size={16} />
              </span>
              <div>
                <p className={styles.rowLabel}>
                  {formatBytes(storageBytes)} stored in this browser
                </p>
                <p className={styles.rowHint}>
                  {data.topics.length} topics · {data.documents.length} documents ·{' '}
                  {data.recommendations.length} recommendations
                </p>
              </div>
            </div>

            <div className={styles.factBox}>
              <p>
                Everything you see in Docutrack is kept in this browser&rsquo;s local storage. There is
                no account, no server and no sync: clearing site data, using a different browser or
                opening a private window means starting fresh.
              </p>
              <p>
                Local storage is not encrypted, and anyone with access to this device and browser
                profile can read it. Uploaded file contents are not retained after a reload — only
                the metadata, extracted text and analysis are.
              </p>
            </div>

            <div className={styles.dataActions}>
              <Button variant="secondary" onClick={exportData}>
                <Download size={15} aria-hidden />
                Export data as JSON
              </Button>
              <Button variant="secondary" onClick={() => setResetOpen(true)}>
                <RotateCcw size={15} aria-hidden />
                Restore demonstration data
              </Button>
              <Button variant="danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 size={15} aria-hidden />
                Delete all data
              </Button>
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={resetOpen}
        title="Restore demonstration data?"
        confirmLabel="Restore demo data"
        tone="danger"
        message={
          <>
            Your current topics, documents, recommendations and profile will be replaced with the
            original sample workspace. This can&rsquo;t be undone — export first if you want a copy.
          </>
        }
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          restoreDemoData();
          setResetOpen(false);
          notify({ tone: 'success', title: 'Demonstration data restored' });
          router.push('/dashboard');
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete all data?"
        confirmLabel="Delete everything"
        tone="danger"
        message={
          <>
            Every topic, document, analysis, recommendation and profile detail will be removed from
            this browser. Your settings are kept. This can&rsquo;t be undone.
          </>
        }
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteAllData();
          setDeleteOpen(false);
          notify({ tone: 'success', title: 'All data deleted' });
          router.push('/dashboard');
        }}
      />
    </>
  );
}
