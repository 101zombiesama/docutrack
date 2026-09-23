'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SendHorizontal, Loader2, Trash2, AlertTriangle, FileText } from 'lucide-react';
import type { Topic } from '@/lib/types';
import { useApp } from '@/lib/store/AppProvider';
import { messagesForTopic } from '@/lib/selectors';
import { Markdown } from '@/components/ai/Markdown';
import { AIPanel } from '@/components/ai/AIPanel';
import { Button } from '@/components/ui/Button';
import styles from './TopicAssistant.module.css';

const SUGGESTIONS = [
  'Summarise everything in this topic.',
  'What are the biggest weaknesses here?',
  'What documents am I missing?',
  'Give me the highest-priority improvements.',
];

export function TopicAssistant({ topic }: { topic: Topic }) {
  const { data, sendAssistantMessage, clearAssistant, assistantPending } = useApp();
  const messages = messagesForTopic(data, topic.id);
  const pending = !!assistantPending[topic.id];
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Keep the newest reply in view without yanking the whole page.
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, pending]);

  function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    setDraft('');
    void sendAssistantMessage(topic.id, trimmed);
  }

  return (
    <AIPanel
      title="Topic assistant"
      subtitle={`Answers using the ${data.documents.filter((d) => d.topicId === topic.id).length} document${
        data.documents.filter((d) => d.topicId === topic.id).length === 1 ? '' : 's'
      } in this topic`}
      actions={
        messages.length > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearAssistant(topic.id)}
            aria-label="Clear conversation"
          >
            <Trash2 size={14} aria-hidden />
            Clear
          </Button>
        ) : null
      }
      footnote="Answers are generated from the documents in this topic and may be incomplete or wrong — check anything you plan to act on."
    >
      <div className={styles.conversation} ref={listRef} role="log" aria-label="Assistant conversation">
        {messages.length === 0 ? (
          <div className={styles.intro}>
            <p className={styles.introText}>
              Ask about the documents in <strong>{topic.name}</strong> — comparisons, gaps, or what to
              improve first.
            </p>
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className={styles.suggestion}
                  onClick={() => submit(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) =>
            message.role === 'user' ? (
              <div key={message.id} className={styles.userRow}>
                <p className={styles.userBubble}>{message.content}</p>
              </div>
            ) : (
              <div key={message.id} className={styles.assistantRow}>
                {message.state === 'thinking' ? (
                  <p className={styles.thinking}>
                    <Loader2 size={14} className={styles.spin} aria-hidden />
                    Reading this topic&rsquo;s documents…
                  </p>
                ) : message.state === 'error' ? (
                  <div className={styles.errorBubble} role="alert">
                    <AlertTriangle size={14} aria-hidden />
                    <span>
                      {message.content} You can ask again — nothing in your topic was changed.
                    </span>
                  </div>
                ) : (
                  <div className={styles.assistantBubble}>
                    <Markdown content={message.content} />
                    {message.citations?.length ? (
                      <p className={styles.citations}>
                        <FileText size={11} aria-hidden />
                        {message.citations.map((citation) => (
                          <Link
                            key={citation.documentId}
                            href={`/documents/${citation.documentId}`}
                            className={styles.citation}
                          >
                            {citation.documentName}
                          </Link>
                        ))}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ),
          )
        )}
      </div>

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <label htmlFor={`assistant-${topic.id}`} className="srOnly">
          Ask the topic assistant
        </label>
        <textarea
          id={`assistant-${topic.id}`}
          ref={inputRef}
          className={styles.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(draft);
            }
          }}
          placeholder="Ask about these documents…"
          rows={1}
          disabled={pending}
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          iconOnly
          aria-label="Send question"
          disabled={!draft.trim() || pending}
          loading={pending}
        >
          {pending ? null : <SendHorizontal size={15} aria-hidden />}
        </Button>
      </form>
    </AIPanel>
  );
}
