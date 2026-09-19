/**
 * dateHelpers.js
 * Preset date range calculators and period comparison utilities.
 * Uses plain JS Date — no external dependencies needed.
 */

import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, subMonths, format } from 'date-fns';

/**
 * Date range presets available in the FilterBar.
 */
export const DATE_PRESETS = [
  { key: 'sepReport',  label: '1 Sep – 16 Sep (Report)' },
  { key: 'today',      label: 'Today' },
  { key: 'yesterday',  label: 'Yesterday' },
  { key: 'last7',      label: 'Last 7 Days' },
  { key: 'last14',     label: 'Last 14 Days' },
  { key: 'last30',     label: 'Last 30 Days' },
  { key: 'thisMonth',  label: 'This Month' },
  { key: 'lastMonth',  label: 'Last Month' },
  { key: 'custom',     label: 'Custom Range' },
  { key: 'all',        label: 'All Time' },
];

/**
 * Returns { from: Date, to: Date } for a given preset key.
 * @param {string} preset
 * @returns {{ from: Date, to: Date }}
 */
export function getPresetRange(preset) {
  const now = new Date();
  const today = startOfDay(now);

  switch (preset) {
    case 'sepReport':
      return { from: new Date(2026, 8, 1, 0, 0, 0), to: endOfDay(new Date(2026, 8, 16)) };

    case 'today':
      return { from: today, to: endOfDay(now) };

    case 'yesterday': {
      const yesterday = subDays(today, 1);
      return { from: yesterday, to: endOfDay(yesterday) };
    }

    case 'last7':
      return { from: subDays(today, 6), to: endOfDay(now) };

    case 'last14':
      return { from: subDays(today, 13), to: endOfDay(now) };

    case 'last30':
      return { from: subDays(today, 29), to: endOfDay(now) };

    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfDay(now) };

    case 'lastMonth': {
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }

    case 'all':
    case 'custom':
    default:
      return { from: null, to: null };
  }
}

/**
 * Given a current period { from, to }, returns the previous equivalent period
 * (same number of days, immediately before).
 * Used for % change KPI calculations.
 */
export function getPreviousPeriod({ from, to }) {
  if (!from || !to) return { from: null, to: null };
  const diffMs = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1); // day before current from
  const prevFrom = new Date(prevTo.getTime() - diffMs);
  return { from: prevFrom, to: prevTo };
}

/**
 * Formats a Date for display in the UI.
 * @param {Date|null} date
 * @returns {string}
 */
export function formatDateDisplay(date) {
  if (!date) return '';
  return format(date, 'dd MMM yyyy');
}

/**
 * Checks if a Date row value falls within [from, to] range.
 * Handles null from/to as "no filter".
 */
export function isInDateRange(rowDate, from, to) {
  if (!rowDate) return false;
  if (!from && !to) return true;
  if (from && rowDate < from) return false;
  if (to && rowDate > to) return false;
  return true;
}
