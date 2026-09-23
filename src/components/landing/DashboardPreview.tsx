import { Sparkles, FileText, Briefcase, Palette, Landmark, Search } from 'lucide-react';
import styles from './DashboardPreview.module.css';

/**
 * A faithful, static representation of the real dashboard. Decorative — the
 * live version is one click away, so this is hidden from assistive tech.
 */
export function DashboardPreview() {
  const topics = [
    { name: 'Senior Software Engineer Application', icon: Briefcase, docs: 5, recs: 6, accent: '#5a4fe0' },
    { name: 'Website Redesign', icon: Palette, docs: 5, recs: 4, accent: '#12897a' },
    { name: 'Personal Tax 2026', icon: Landmark, docs: 3, recs: 4, accent: '#b47411' },
  ];

  return (
    <div className={styles.frame} aria-hidden>
      <div className={styles.chrome}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.url}>docutrack · dashboard</span>
      </div>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span className={styles.brandMark} />
            Docutrack
          </div>
          <span className={styles.newButton}>+ New topic</span>
          <span className={`${styles.navItem} ${styles.navActive}`}>Dashboard</span>
          <span className={styles.navItem}>Topics</span>
          <span className={styles.navItem}>Search</span>
          <p className={styles.navLabel}>Recent topics</p>
          {topics.map((topic) => (
            <span key={topic.name} className={styles.navTopic}>
              <span className={styles.navTopicDot} style={{ background: topic.accent }} />
              {topic.name}
            </span>
          ))}
        </aside>

        <main className={styles.main}>
          <div className={styles.topbar}>
            <span className={styles.searchBox}>
              <Search size={11} />
              Search topics and documents
            </span>
          </div>

          <div className={styles.heading}>Good morning, Alex</div>

          <div className={styles.metrics}>
            {[
              { value: '3', label: 'Topics' },
              { value: '13', label: 'Documents' },
              { value: '11', label: 'Analysed' },
              { value: '14', label: 'Recommendations', accent: true },
            ].map((metric) => (
              <div key={metric.label} className={styles.metric}>
                <span className={metric.accent ? styles.metricValueAccent : styles.metricValue}>
                  {metric.value}
                </span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>

          <div className={styles.cards}>
            {topics.slice(0, 2).map((topic) => (
              <div key={topic.name} className={styles.card}>
                <div className={styles.cardHead}>
                  <span
                    className={styles.cardIcon}
                    style={{ background: `${topic.accent}1f`, color: topic.accent }}
                  >
                    <topic.icon size={12} />
                  </span>
                  <span className={styles.cardTitle}>{topic.name}</span>
                </div>
                <span className={styles.cardTypes}>CV · Job Description · Portfolio</span>
                <div className={styles.cardFoot}>
                  <span>{topic.docs} documents</span>
                  <span className={styles.cardBadge}>
                    <Sparkles size={9} />
                    {topic.recs}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.docRow}>
            <span className={styles.docIcon}>
              <FileText size={12} />
            </span>
            <span className={styles.docText}>
              <span className={styles.docName}>Senior_Engineer_CV.pdf</span>
              <span className={styles.docSummary}>
                Senior engineering CV positioned around backend systems and technical leadership.
              </span>
            </span>
            <span className={styles.docBadge}>3 recommendations</span>
          </div>
        </main>
      </div>
    </div>
  );
}
