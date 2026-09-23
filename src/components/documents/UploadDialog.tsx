'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store/AppProvider';
import { Modal } from '@/components/ui/Modal';
import { Field, selectClass } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { UploadDropzone } from './UploadDropzone';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  /** Pre-selected topic; when omitted the user picks one. */
  topicId?: string;
}

export function UploadDialog({ open, onClose, topicId }: UploadDialogProps) {
  const { data } = useApp();
  const available = data.topics.filter((t) => !t.archived);
  const [selected, setSelected] = useState(topicId ?? available[0]?.id ?? '');

  useEffect(() => {
    if (open) setSelected(topicId ?? available[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the dialog opens
  }, [open, topicId]);

  const topic = data.topics.find((t) => t.id === selected);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload documents"
      description={
        topic?.goal
          ? `Analysis will use this topic's goal as context: “${topic.goal}”`
          : 'Documents are analysed in the context of the topic they belong to.'
      }
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!topicId ? (
          <Field label="Topic">
            {(props) => (
              <select
                {...props}
                className={selectClass}
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {available.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : null}

        {selected ? (
          <UploadDropzone topicId={selected} onStarted={onClose} />
        ) : (
          <p style={{ fontSize: 'var(--fs-base)', color: 'var(--text-secondary)' }}>
            Create a topic first — documents always live inside one.
          </p>
        )}
      </div>
    </Modal>
  );
}
