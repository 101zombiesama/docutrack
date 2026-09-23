'use client';

import { useCallback, useRef, useState } from 'react';
import { UploadCloud, AlertTriangle, X } from 'lucide-react';
import { useApp } from '@/lib/store/AppProvider';
import { ACCEPT_ATTRIBUTE } from '@/lib/utils';
import { cx } from '@/lib/utils';
import styles from './UploadDropzone.module.css';

interface UploadDropzoneProps {
  topicId: string;
  /** Called once files have been handed to the pipeline. */
  onStarted?: (accepted: number) => void;
  compact?: boolean;
  className?: string;
}

export function UploadDropzone({ topicId, onStarted, compact, className }: UploadDropzoneProps) {
  const { uploadDocuments, data } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<Array<{ name: string; reason: string }>>([]);
  const dragDepth = useRef(0);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setRejected([]);
      const outcome = await uploadDocuments(topicId, Array.from(fileList));
      setRejected(outcome.rejected);
      if (outcome.accepted > 0) onStarted?.(outcome.accepted);
    },
    [onStarted, topicId, uploadDocuments],
  );

  return (
    <div className={cx(styles.wrap, className)}>
      <div
        className={cx(styles.zone, dragging && styles.dragging, compact && styles.compact)}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="srOnly"
          id={`upload-${topicId}`}
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <span className={styles.icon} aria-hidden>
          <UploadCloud size={compact ? 18 : 22} />
        </span>

        <div className={styles.copy}>
          <p className={styles.title}>
            Drag documents here, or{' '}
            <label htmlFor={`upload-${topicId}`} className={styles.browse}>
              browse your files
            </label>
          </p>
          <p className={styles.hint}>
            PDF, DOCX, TXT, MD, CSV, XLSX, PPTX · up to 25 MB each
            {data.settings.autoAnalyzeUploads
              ? ' · analysis starts automatically'
              : ' · automatic analysis is off in Settings'}
          </p>
        </div>
      </div>

      {rejected.length > 0 ? (
        <ul className={styles.rejected}>
          {rejected.map((item) => (
            <li key={item.name} className={styles.rejectedItem}>
              <AlertTriangle size={14} aria-hidden />
              <span>
                <strong>{item.name}</strong> — {item.reason}
              </span>
              <button
                type="button"
                onClick={() => setRejected((r) => r.filter((x) => x.name !== item.name))}
                aria-label={`Dismiss error for ${item.name}`}
              >
                <X size={13} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
