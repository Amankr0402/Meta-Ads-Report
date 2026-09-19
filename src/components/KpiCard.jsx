/**
 * KpiCard.jsx
 * Reusable KPI metric card.
 *
 * Props:
 *   label       {string}    — metric label
 *   value       {number}    — formatted display value (raw number)
 *   format      {string}    — 'currency' | 'percent' | 'number' | 'roas' | 'compact'
 *   change      {number}    — % change vs previous period (can be null)
 *   icon        {ReactNode} — Lucide icon element
 *   isPositiveGood {bool}   — true = green when up, false = red when up (e.g. CPC)
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from '../styles/KpiCard.module.css';
import {
  formatCurrency, formatPercent, formatNumber,
  formatRoas, formatCompact, formatChange, getChangeColor,
} from '../utils/formatters';

function formatValue(value, format) {
  switch (format) {
    case 'currency': return formatCurrency(value);
    case 'percent':  return formatPercent(value);
    case 'roas':     return formatRoas(value);
    case 'compact':  return formatCompact(value);
    default:         return formatNumber(value);
  }
}

export function KpiCard({ label, value, format = 'number', change, icon, isPositiveGood = true }) {
  const colorClass = getChangeColor(change, isPositiveGood);

  const ChangeIcon =
    change === null || change === undefined || isNaN(change) ? Minus :
    change > 0 ? TrendingUp : TrendingDown;

  return (
    <div className={`${styles.card} fade-in`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && <div className={styles.iconWrapper}>{icon}</div>}
      </div>

      <div className={styles.value}>
        {formatValue(value, format)}
      </div>

      <div className={styles.footer}>
        {change !== null && change !== undefined && !isNaN(change) ? (
          <span className={`${styles.changeBadge} ${styles[colorClass]}`}>
            <ChangeIcon size={10} />
            {formatChange(change)}
          </span>
        ) : (
          <span className={`${styles.changeBadge} ${styles.neutral}`}>
            <Minus size={10} />
            —
          </span>
        )}
        <span className={styles.changeLabel}>vs prev period</span>
      </div>
    </div>
  );
}
