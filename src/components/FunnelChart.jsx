/**
 * FunnelChart.jsx
 * Funnel visualization: Impressions → Clicks → Leads/Results → Purchases
 * Implemented as a series of proportional horizontal bars.
 */

import styles from '../styles/Charts.module.css';
import { formatCompact, formatPercent } from '../utils/formatters';

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];

export function FunnelChart({ kpis }) {
  const steps = [
    { label: 'Impressions',  value: kpis.impressions,  color: FUNNEL_COLORS[0] },
    { label: 'Link Clicks',  value: kpis.linkClicks,   color: FUNNEL_COLORS[1] },
    {
      label: kpis.leads > 0 ? 'Leads' : 'Results',
      value: kpis.leads > 0 ? kpis.leads : kpis.results,
      color: FUNNEL_COLORS[2],
    },
    { label: 'Purchases',    value: kpis.purchases,    color: FUNNEL_COLORS[3] },
  ].filter((s) => s.value > 0);

  const maxVal = steps[0]?.value ?? 1;

  const convRate = (current, previous) => {
    if (!previous || previous === 0) return null;
    return (current / previous) * 100;
  };

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>Funnel View</div>
          <div className={styles.chartSubtitle}>Impressions → Clicks → Leads → Purchases</div>
        </div>
      </div>

      {steps.length === 0 ? (
        <div className={styles.chartEmpty}>No data for selected period</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {steps.map((step, idx) => {
            const prevValue = idx > 0 ? steps[idx - 1].value : null;
            const rate = convRate(step.value, prevValue);
            const widthPct = maxVal > 0 ? (step.value / maxVal) * 100 : 0;

            return (
              <div key={step.label} className={styles.funnelStep}>
                <span className={styles.funnelLabel}>{step.label}</span>

                <div className={styles.funnelBarTrack}>
                  <div
                    className={styles.funnelBarFill}
                    style={{ width: `${widthPct}%`, background: step.color }}
                  />
                </div>

                <span className={styles.funnelValue}>{formatCompact(step.value)}</span>

                {rate !== null && (
                  <span className={styles.funnelRate} style={{ color: 'var(--text-muted)' }}>
                    {formatPercent(rate, 1)} CVR
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
