/**
 * formatters.js
 * Utility functions for formatting values displayed in KPI cards and tables.
 */

/**
 * Formats a number as currency (INR by default).
 * Change the locale/currency below to match your account currency.
 */
export function formatCurrency(value, currency = 'INR') {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats a number as a percentage string (e.g., 3.45%).
 * @param {number} value - already a percentage (not a decimal)
 */
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Formats a plain number with locale-aware thousands separators.
 */
export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a ROAS value (e.g., 4.32x).
 */
export function formatRoas(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${Number(value).toFixed(2)}x`;
}

/**
 * Compresses large numbers: 1,250,000 → 1.25M, 12,500 → 12.5K
 */
export function formatCompact(value) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const n = Number(value);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return formatNumber(n, 0);
}

/**
 * Returns the sign and color class for a % change value.
 * `isPositiveGood` controls whether a positive change is "good" (green) or "bad" (red).
 * e.g. Spend increase is bad, ROAS increase is good.
 */
export function getChangeColor(change, isPositiveGood = true) {
  if (change === null || change === undefined || isNaN(change)) return 'neutral';
  if (change > 0) return isPositiveGood ? 'positive' : 'negative';
  if (change < 0) return isPositiveGood ? 'negative' : 'positive';
  return 'neutral';
}

/**
 * Formats a % change with a +/- prefix.
 */
export function formatChange(change) {
  if (change === null || change === undefined || isNaN(change)) return '—';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${Number(change).toFixed(1)}%`;
}
