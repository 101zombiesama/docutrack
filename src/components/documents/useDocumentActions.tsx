'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  ExternalLink,
  FolderInput,
  Pencil,
  RefreshCw,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { DocumentRecord } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { isProcessing } from '@/lib/selectors';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Field, inputClass, selectClass } from '@/components/ui/Field';
import type { MenuItem } from '@/components/ui/Menu';

/**
 * Document actions and the dialogs they need, in one place so the topic
 * workspace, dashboard and document page all behave identically.
 */
export function useDocumentActions() {
  const { data, renameDocument, moveDocument, deleteDocument, runAnalysis } = useApp();
  const { notify } = useToast();
  const router = useRouter();

  const [renameTarget, setRenameTarget] = useState<DocumentRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [moveTarget, setMoveTarget] = useState<DocumentRecord | null>(null);
  const [moveTopicId, setMoveTopicId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
  const [rerunTarget, setRerunTarget] = useState<DocumentRecord | null>(null);

  const startRename = useCallback((doc: DocumentRecord) => {
    setRenameTarget(doc);
    setRenameValue(doc.name);
  }, []);

  const startMove = useCallback((doc: DocumentRecord) => {
    setMoveTarget(doc);
    setMoveTopicId(doc.topicId);
  }, []);

  const requestDelete = useCallback(
    (doc: DocumentRecord) => {
      if (!data.settings.confirmBeforeDelete) {
        deleteDocument(doc.id);
        notify({ tone: 'success', title: `Deleted ${doc.name}` });
        return;
      }
      setDeleteTarget(doc);
    },
    [data.settings.confirmBeforeDelete, deleteDocument, notify],
  );

  const requestAnalysis = useCallback(
    (doc: DocumentRecord) => {
      // Re-running replaces the existing suggestions, so confirm when asked to.
      if (doc.status === 'ready' && data.settings.confirmBeforeRerun) {
        setRerunTarget(doc);
        return;
      }
      void runAnalysis(doc.id);
    },
    [data.settings.confirmBeforeRerun, runAnalysis],
  );

  const download = useCallback(
    (doc: DocumentRecord) => {
      if (!doc.downloadUrl) {
        notify({
          tone: 'info',
          title: 'Original file not available',
          description:
            'Only files uploaded in this browser session can be downloaded — file contents are not stored between reloads in this build.',
        });
        return;
      }
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = doc.name;
      link.click();
    },
    [notify],
  );

  const menuItemsFor = useCallback(
    (doc: DocumentRecord, options?: { includeOpen?: boolean }): MenuItem[] => {
      const busy = isProcessing(doc);
      return [
        ...(options?.includeOpen
          ? [
              {
                label: 'Open document',
                icon: ExternalLink,
                onSelect: () => router.push(`/documents/${doc.id}`),
              },
            ]
          : []),
        { label: 'Rename', icon: Pencil, onSelect: () => startRename(doc), disabled: busy },
        { label: 'Download', icon: Download, onSelect: () => download(doc) },
        { label: 'Move to topic…', icon: FolderInput, onSelect: () => startMove(doc), disabled: busy },
        {
          label: doc.status === 'ready' ? 'Re-run analysis' : 'Run analysis',
          icon: doc.status === 'failed' ? RefreshCw : Sparkles,
          onSelect: () => requestAnalysis(doc),
          disabled: busy,
        },
        {
          label: 'Delete',
          icon: Trash2,
          tone: 'danger' as const,
          separated: true,
          onSelect: () => requestDelete(doc),
          disabled: busy,
        },
      ];
    },
    [download, requestAnalysis, requestDelete, router, startMove, startRename],
  );

  const otherTopics = data.topics.filter((t) => t.id !== moveTarget?.topicId);

  const dialogs = (
    <>
      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename document"
        description="This changes the name in Docutrack. The original file is untouched."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (renameTarget && renameValue.trim()) {
                  renameDocument(renameTarget.id, renameValue);
                  notify({ tone: 'success', title: 'Document renamed' });
                }
                setRenameTarget(null);
              }}
              disabled={!renameValue.trim()}
            >
              Save
            </Button>
          </>
        }
      >
        <Field label="Document name" hint="Keeping the file extension keeps the type icon accurate.">
          {(props) => (
            <input
              {...props}
              className={inputClass}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        title="Move to another topic"
        description="Analysis stays with the document, but topic insights are cleared on both sides since they compare documents within a topic."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!moveTopicId || moveTopicId === moveTarget?.topicId}
              onClick={() => {
                if (moveTarget && moveTopicId) {
                  moveDocument(moveTarget.id, moveTopicId);
                  const topic = data.topics.find((t) => t.id === moveTopicId);
                  notify({
                    tone: 'success',
                    title: `Moved to ${topic?.name ?? 'topic'}`,
                    description: 'Re-run analysis to use the new topic as context.',
                  });
                }
                setMoveTarget(null);
              }}
            >
              Move document
            </Button>
          </>
        }
      >
        {otherTopics.length === 0 ? (
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
            There is no other topic to move this into yet. Create a second topic first.
          </p>
        ) : (
          <Field label="Destination topic">
            {(props) => (
              <select
                {...props}
                className={selectClass}
                value={moveTopicId}
                onChange={(e) => setMoveTopicId(e.target.value)}
              >
                <option value={moveTarget?.topicId ?? ''} disabled>
                  Choose a topic…
                </option>
                {otherTopics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                    {topic.archived ? ' (archived)' : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
      </Modal>

      <ConfirmDialog
        open={!!rerunTarget}
        title="Re-run analysis?"
        confirmLabel="Re-run analysis"
        message={
          <>
            The current summary and recommendations for <strong>{rerunTarget?.name}</strong> will be
            replaced with new ones. Recommendations you resolved or dismissed will not carry over.
          </>
        }
        onCancel={() => setRerunTarget(null)}
        onConfirm={() => {
          if (rerunTarget) void runAnalysis(rerunTarget.id);
          setRerunTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this document?"
        tone="danger"
        confirmLabel="Delete document"
        message={
          <>
            <strong>{deleteTarget?.name}</strong> and its analysis and recommendations will be
            removed from this topic. This can&rsquo;t be undone.
          </>
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteDocument(deleteTarget.id);
            notify({ tone: 'success', title: `Deleted ${deleteTarget.name}` });
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );

  return { menuItemsFor, dialogs, startRename, startMove, requestDelete, requestAnalysis, download };
}
