import styles from './HeroNetwork.module.css';

/**
 * Hero diagram: documents flow into a topic, the topic is understood, and
 * recommendations come back out.
 *
 * Everything moves through CSS animation only — no JS loop, no canvas — so it
 * stays cheap, and the global prefers-reduced-motion rule stops all of it.
 */

const DOC_Y = [116, 216, 316, 416];

// Document → topic. Shared by the stroke and the travelling dot.
const inbound = DOC_Y.map(
  (y) => `M 246 ${y} C 350 ${y}, 400 266, 496 266`,
);
const bridge = 'M 626 266 C 680 266, 700 266, 760 266';
const outbound = [176, 266, 356].map(
  (y) => `M 878 266 C 930 266, 950 ${y}, 996 ${y}`,
);

const STAGES = ['Documents', 'Topic', 'AI understanding', 'Recommendations'];

export function HeroNetwork() {
  return (
    <div className={styles.wrap}>
      <svg viewBox="0 62 1200 416" className={styles.svg} role="presentation" focusable="false" aria-hidden>
        <defs>
          <linearGradient id="dtLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--line-start)" />
            <stop offset="100%" stopColor="var(--line-end)" />
          </linearGradient>
          <linearGradient id="dtTopic" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--topic-start)" />
            <stop offset="100%" stopColor="var(--topic-end)" />
          </linearGradient>
          <filter id="dtGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* --- Connections ------------------------------------------------- */}
        <g className={styles.lines}>
          {inbound.map((d, i) => (
            <path key={`in-${i}`} d={d} className={styles.line} style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
          <path d={bridge} className={styles.line} style={{ animationDelay: '0.9s' }} />
          {outbound.map((d, i) => (
            <path
              key={`out-${i}`}
              d={d}
              className={styles.line}
              style={{ animationDelay: `${1.3 + i * 0.4}s` }}
            />
          ))}
        </g>

        {/* --- Travelling packets ------------------------------------------ */}
        <g className={styles.packets}>
          {inbound.map((d, i) => (
            <circle
              key={`pin-${i}`}
              r="3.4"
              className={styles.packet}
              style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 1.1}s` }}
            />
          ))}
          <circle
            r="3.4"
            className={styles.packet}
            style={{ offsetPath: `path("${bridge}")`, animationDelay: '1.6s' }}
          />
          {outbound.map((d, i) => (
            <circle
              key={`pout-${i}`}
              r="3.4"
              className={styles.packetOut}
              style={{ offsetPath: `path("${d}")`, animationDelay: `${2.1 + i * 0.7}s` }}
            />
          ))}
        </g>

        {/* --- Documents ---------------------------------------------------- */}
        <g className={styles.docs}>
          {DOC_Y.map((y, i) => (
            <g key={y} className={styles.doc} style={{ animationDelay: `${i * 0.16}s` }}>
              <rect x="126" y={y - 27} width="120" height="54" rx="10" className={styles.card} />
              <rect x="142" y={y - 13} width="52" height="5" rx="2.5" className={styles.cardLine} />
              <rect x="142" y={y - 2} width="82" height="5" rx="2.5" className={styles.cardLineFaint} />
              <rect x="142" y={y + 9} width="66" height="5" rx="2.5" className={styles.cardLineFaint} />
            </g>
          ))}
        </g>

        {/* --- Topic -------------------------------------------------------- */}
        <g className={styles.topicGroup}>
          <rect x="496" y="202" width="130" height="130" rx="30" className={styles.topicHalo} />
          <rect x="506" y="212" width="110" height="110" rx="26" className={styles.topic} />
          <g className={styles.topicMark}>
            <path
              d="M 540 246 h 16 M 540 266 h 16 M 540 286 h 16"
              strokeLinecap="round"
              strokeWidth="3.4"
            />
            <path
              d="M 556 246 C 572 246, 576 256, 580 266 M 556 266 h 24 M 556 286 C 572 286, 576 276, 580 266"
              strokeLinecap="round"
              strokeWidth="2.4"
              className={styles.topicMarkFaint}
            />
            <circle cx="583" cy="266" r="8" className={styles.topicDot} />
          </g>
        </g>

        {/* --- AI understanding --------------------------------------------- */}
        <g className={styles.aiGroup}>
          <circle cx="818" cy="266" r="58" className={styles.aiHalo} filter="url(#dtGlow)" />
          <circle cx="818" cy="266" r="44" className={styles.aiCore} />
          <path
            d="M 818 244 l 5.4 11.6 L 835 261 l -11.6 5.4 L 818 278 l -5.4 -11.6 L 801 261 l 11.6 -5.4 Z"
            className={styles.spark}
          />
          <circle cx="840" cy="240" r="3" className={styles.sparkDot} />
          <circle cx="798" cy="292" r="2.4" className={styles.sparkDot} style={{ animationDelay: '0.7s' }} />
        </g>

        {/* --- Recommendations ----------------------------------------------- */}
        <g className={styles.recs}>
          {[176, 266, 356].map((y, i) => (
            <g key={y} className={styles.rec} style={{ animationDelay: `${0.9 + i * 0.2}s` }}>
              <rect x="996" y={y - 26} width="122" height="52" rx="10" className={styles.recCard} />
              <circle cx="1016" cy={y} r="6" className={styles.recDot} />
              <rect x="1030" y={y - 8} width="58" height="5" rx="2.5" className={styles.cardLine} />
              <rect x="1030" y={y + 3} width="74" height="5" rx="2.5" className={styles.cardLineFaint} />
            </g>
          ))}
        </g>

      </svg>

      {/* The flow stated in text, so it is readable at any width and by
          assistive technology — the drawing above is purely decorative. */}
      <ol className={styles.flow}>
        {STAGES.map((stage) => (
          <li key={stage}>{stage}</li>
        ))}
      </ol>
    </div>
  );
}
