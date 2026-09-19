/**
 * PerformersList.jsx
 * Shows Top 5 / Bottom 5 performers ranked by a selected metric (ROAS or Cost per Result).
 * Props:
 *   filteredData {Array<Object>}
 */

import { useState, useMemo } from 'react';
import { groupAndAggregate } from '../utils/aggregators';
import { formatRoas, formatCurrency, formatCompact } from '../utils/formatters';
import styles from '../styles/Charts.module.css';

const METRICS = [
  { key: 'roas',          label: 'ROAS',            format: 'roas',     higherIsBetter: true  },
  { key: 'costPerResult', label: 'Cost per Result', format: 'currency', higherIsBetter: false },
  { key: 'costPerLead',   label: 'Cost per Lead',   format: 'currency', higherIsBetter: false },
  { key: 'ctrLink',       label: 'CTR (Link)',       format: 'percent',  higherIsBetter: true  },
];

function formatMetric(value, format) {
  if (!value || isNaN(value)) return '—';
  if (format === 'roas')     return formatRoas(value);
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent')  return `${value.toFixed(2)}%`;
  return formatCompact(value);
}

export function PerformersList({ filteredData }) {
  const [metricKey, setMetricKey]   = useState('roas');
  const [showBottom, setShowBottom] = useState(false);
  const [groupBy, setGroupBy]       = useState('campaignName');

  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const performers = useMemo(() => {
    if (!filteredData?.length) return [];
    const grouped = groupAndAggregate(filteredData, groupBy);

    // Only include rows where the metric has a meaningful value
    const valid = grouped.filter((r) => r[metricKey] > 0);

    if (metric.higherIsBetter) {
      valid.sort((a, b) => b[metricKey] - a[metricKey]);
    } else {
      valid.sort((a, b) => a[metricKey] - b[metricKey]);
    }

    return showBottom
      ? valid.slice(-5).reverse()
      : valid.slice(0, 5);
  }, [filteredData, metricKey, showBottom, groupBy, metric]);

  const maxVal = performers.length > 0
    ? Math.max(...performers.map((p) => p[metricKey] || 0))
    : 1;

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>
            {showBottom ? '⬇ Bottom 5' : '⬆ Top 5'} Performers
          </div>
          <div className={styles.chartSubtitle}>by {metric.label}</div>
        </div>
        <div className={styles.chartActions} style={{ flexWrap: 'wrap', gap: 4 }}>
          {/* Group by toggle */}
          <select
            style={{
              fontSize: 11, padding: '4px 8px',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
          >
            <option value="campaignName">Campaign</option>
            <option value="adSetName">Ad Set</option>
            <option value="adName">Ad</option>
          </select>

          {/* Metric toggle */}
          {METRICS.map((m) => (
            <button
              key={m.key}
              className={`${styles.chartToggleBtn} ${metricKey === m.key ? styles.active : ''}`}
              onClick={() => setMetricKey(m.key)}
            >
              {m.label}
            </button>
          ))}

          {/* Top / Bottom toggle */}
          <button
            className={`${styles.chartToggleBtn} ${showBottom ? styles.active : ''}`}
            onClick={() => setShowBottom((v) => !v)}
          >
            {showBottom ? 'Show Top' : 'Show Bottom'}
          </button>
        </div>
      </div>

      {performers.length === 0 ? (
        <div className={styles.chartEmpty}>No data available</div>
      ) : (
        <div>
          {performers.map((item, idx) => {
            const barWidth = maxVal > 0 ? ((item[metricKey] || 0) / maxVal) * 100 : 0;
            const rankClass = showBottom ? styles.rankBottom : styles.rankTop;
            const name = item[groupBy] || '(Unknown)';

            return (
              <div key={name} className={styles.performerItem}>
                <div className={`${styles.performerRank} ${rankClass}`}>
                  {showBottom ? performers.length - idx : idx + 1}
                </div>

                <div className={styles.performerName} title={name}>{name}</div>

                <div className={styles.performerBar}>
                  <div
                    className={styles.performerBarFill}
                    style={{
                      width: `${barWidth}%`,
                      background: showBottom ? '#ef4444' : 'var(--brand-gradient)',
                    }}
                  />
                </div>

                <div className={styles.performerValue}>
                  {formatMetric(item[metricKey], metric.format)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
