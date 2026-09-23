'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Topic, TopicAccent } from '@/lib/types';
import { ACCENT_KEYS, TOPIC_ACCENTS, TOPIC_ICON_KEYS, topicIcon } from '@/lib/appearance';
import { useApp } from '@/lib/store/AppProvider';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, inputClass, textareaClass } from '@/components/ui/Field';
import { cx } from '@/lib/utils';
import styles from './TopicFormDialog.module.css';

interface TopicFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing; absent when creating. */
  topic?: Topic;
  onCreated?: (topic: Topic) => void;
}

interface FormState {
  name: string;
  description: string;
  goal: string;
  icon: string;
  accent: TopicAccent;
  tags: string[];
}

const BLANK: FormState = {
  name: '',
  description: '',
  goal: '',
  icon: 'briefcase',
  accent: 'indigo',
  tags: [],
};

export function TopicFormDialog({ open, onClose, topic, onCreated }: TopicFormDialogProps) {
  const { createTopic, updateTopic } = useApp();
  const { notify } = useToast();
  const [form, setForm] = useState<FormState>(BLANK);
  const [tagDraft, setTagDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setTagDraft('');
    setForm(
      topic
        ? {
            name: topic.name,
            description: topic.description,
            goal: topic.goal,
            icon: topic.icon,
            accent: topic.accent,
            tags: topic.tags,
          }
        : BLANK,
    );
  }, [open, topic]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addTag() {
    const value = tagDraft.trim().replace(/,$/, '');
    if (!value) return;
    if (!form.tags.includes(value)) set('tags', [...form.tags, value]);
    setTagDraft('');
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Give the topic a name.');
      return;
    }

    if (topic) {
      updateTopic(topic.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        goal: form.goal.trim(),
        icon: form.icon,
        accent: form.accent,
        tags: form.tags,
      });
      notify({ tone: 'success', title: 'Topic updated' });
    } else {
      const created = createTopic(form);
      notify({
        tone: 'success',
        title: `“${created.name}” created`,
        description: 'Upload documents to it and analysis will use this topic as context.',
      });
      onCreated?.(created);
    }
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={topic ? 'Edit topic' : 'Create a topic'}
      description={
        topic
          ? 'Changes apply to future analysis. Existing analysis stays as it is until you re-run it.'
          : 'A topic is one thing you are trying to accomplish. Documents you add to it are analysed together.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="topic-form">
            {topic ? 'Save changes' : 'Create topic'}
          </Button>
        </>
      }
    >
      <form id="topic-form" className={styles.form} onSubmit={submit} noValidate>
        <Field
          label="Topic name"
          required
          error={error ?? undefined}
          hint="For example: Senior Software Engineer Application"
        >
          {(props) => (
            <input
              {...props}
              className={inputClass}
              value={form.name}
              onChange={(e) => {
                set('name', e.target.value);
                if (error) setError(null);
              }}
              placeholder="Software Job Application"
              maxLength={80}
            />
          )}
        </Field>

        <Field label="Description" hint="A sentence about what this topic holds.">
          {(props) => (
            <textarea
              {...props}
              className={textareaClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Documents related to my application for software engineering roles."
              rows={2}
              maxLength={300}
            />
          )}
        </Field>

        <div className={styles.goalField}>
          <Field
            label="Goal"
            hint="What you want to achieve. This is passed to the AI as context, so suggestions are aimed at your outcome rather than generic advice."
          >
            {(props) => (
              <textarea
                {...props}
                className={textareaClass}
                value={form.goal}
                onChange={(e) => set('goal', e.target.value)}
                placeholder="Create the strongest possible application for senior backend engineering positions."
                rows={2}
                maxLength={300}
              />
            )}
          </Field>
          <p className={styles.goalNote}>
            <Sparkles size={13} aria-hidden />
            Topics with a goal get noticeably more specific recommendations.
          </p>
        </div>

        <div className={styles.grid}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Icon</legend>
            <div className={styles.iconGrid}>
              {TOPIC_ICON_KEYS.map((key) => {
                const Icon = topicIcon(key);
                const selected = form.icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={cx(styles.iconOption, selected && styles.selected)}
                    onClick={() => set('icon', key)}
                    aria-pressed={selected}
                    aria-label={`Icon: ${key}`}
                  >
                    <Icon size={16} aria-hidden />
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Accent</legend>
            <div className={styles.accentRow}>
              {ACCENT_KEYS.map((key) => {
                const accent = TOPIC_ACCENTS[key];
                const selected = form.accent === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={cx(styles.accentOption, selected && styles.selected)}
                    style={{ background: accent.solid }}
                    onClick={() => set('accent', key)}
                    aria-pressed={selected}
                    aria-label={`Accent: ${accent.label}`}
                  />
                );
              })}
            </div>
          </fieldset>
        </div>

        <Field label="Tags" hint="Press Enter to add. Tags are searchable.">
          {(props) => (
            <div className={styles.tagField}>
              {form.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => set('tags', form.tags.filter((t) => t !== tag))}
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X size={12} aria-hidden />
                  </button>
                </span>
              ))}
              <input
                {...props}
                className={styles.tagInput}
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag();
                  } else if (e.key === 'Backspace' && !tagDraft && form.tags.length) {
                    set('tags', form.tags.slice(0, -1));
                  }
                }}
                onBlur={addTag}
                placeholder={form.tags.length ? '' : 'job search, engineering'}
              />
            </div>
          )}
        </Field>
      </form>
    </Modal>
  );
}
