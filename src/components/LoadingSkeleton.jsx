/**
 * LoadingSkeleton.jsx
 * Animated placeholder skeletons shown while data is loading.
 * Matches the dimensions of KPI cards, charts, and tables.
 */

import styles from '../styles/KpiCard.module.css';

/** Single skeleton KPI card */
function KpiSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-3)',
    }}>
      <div className={`skeleton ${styles.skelLabel}`} />
      <div className={`skeleton ${styles.skelValue}`} />
      <div className={`skeleton ${styles.skelChange}`} />
    </div>
  );
}

/** Row of KPI skeletons */
export function KpiRowSkeleton({ count = 8 }) {
  return (
    <div className="grid-kpi">
      {Array.from({ length: count }).map((_, i) => (
        <KpiSkeleton key={i} />
      ))}
    </div>
  );
}

/** Generic chart area skeleton */
export function ChartSkeleton({ height = 300 }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--space-5)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
    }}>
      <div className="skeleton" style={{ height: 16, width: '40%', borderRadius: 6 }} />
      <div className="skeleton" style={{ height, borderRadius: 8 }} />
    </div>
  );
}

/** Table skeleton */
export function TableSkeleton({ rows = 6 }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-3)' }}>
        <div className="skeleton" style={{ height: 16, width: '30%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 32, width: 200, borderRadius: 6, marginLeft: 'auto' }} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '12px var(--space-5)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: 'var(--space-4)' }}>
          <div className="skeleton" style={{ height: 14, flex: 2, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, flex: 1, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, flex: 1, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 14, flex: 1, borderRadius: 4 }} />
        </div>
      ))}
    </div>
  );
}
