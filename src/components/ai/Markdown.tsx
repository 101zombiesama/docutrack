import { Fragment } from 'react';
import styles from './Markdown.module.css';

/**
 * Minimal renderer for assistant replies: paragraphs, bullets, **bold** and
 * *italic*. Deliberately tiny — the assistant only ever emits these, and
 * anything unrecognised renders as plain text rather than raw HTML.
 */
export function Markdown({ content }: { content: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let bullets: string[] = [];

  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul className={styles.list} key={key}>
        {bullets.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      bullets.push(trimmed.slice(2));
      return;
    }
    flushBullets(`list-${index}`);
    if (!trimmed) return;
    // Continuation lines under a bullet are indented in the source.
    if (line.startsWith('  ') && blocks.length) {
      blocks.push(
        <p className={styles.continuation} key={`cont-${index}`}>
          {inline(trimmed)}
        </p>,
      );
      return;
    }
    blocks.push(
      <p className={styles.paragraph} key={`p-${index}`}>
        {inline(trimmed)}
      </p>,
    );
  });
  flushBullets('list-end');

  return <div className={styles.markdown}>{blocks}</div>;
}

/** Handles **bold** and *italic* without introducing an HTML parser. */
function inline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
