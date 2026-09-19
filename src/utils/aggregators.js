/**
 * aggregators.js
 * Functions for computing KPIs and summaries from filtered row data.
 * All functions are pure — they take data arrays and return computed values.
 */

/**
 * Sums a numeric field across all rows.
 * @param {Array<Object>} data
 * @param {string} field - internal field name
 * @returns {number}
 */
export function sumField(data, field) {
  return data.reduce((acc, row) => acc + (Number(row[field]) || 0), 0);
}

/**
 * Averages a numeric field across rows with non-zero values.
 * Avoids inflating the average with empty rows.
 */
export function avgField(data, field) {
  const nonZero = data.filter((row) => Number(row[field]) > 0);
  if (nonZero.length === 0) return 0;
  return sumField(nonZero, field) / nonZero.length;
}

/**
 * Computes the full set of KPI values from a dataset.
 * These are the values shown in the KPI cards at the top of the dashboard.
 * @param {Array<Object>} data - filtered rows
 * @returns {Object} KPI object
 */
export function computeKpis(data) {
  if (!data || data.length === 0) {
    return {
      spend: 0, impressions: 0, reach: 0, clicksAll: 0, linkClicks: 0,
      ctrAll: 0, ctrLink: 0, cpcAll: 0, cpcLink: 0, cpm: 0,
      leads: 0, costPerLead: 0, results: 0, costPerResult: 0, installs: 0,
      purchases: 0, purchaseValue: 0, roas: 0, frequency: 0, engagement: 0,
    };
  }

  const spend         = sumField(data, 'spend');
  const impressions   = sumField(data, 'impressions');
  const reach         = sumField(data, 'reach');
  const clicksAll     = sumField(data, 'clicksAll');
  const linkClicks    = sumField(data, 'linkClicks');
  const leads         = sumField(data, 'leads');
  const results       = sumField(data, 'results');
  const installs      = sumField(data, 'installs');
  const purchases     = sumField(data, 'purchases');
  const purchaseValue = sumField(data, 'purchaseValue');
  const engagement    = sumField(data, 'engagement');

  // Derived metrics (recompute from sums to avoid averaging averages)
  const ctrAll      = impressions > 0 ? (clicksAll / impressions) * 100 : 0;
  const ctrLink     = impressions > 0 ? (linkClicks / impressions) * 100 : 0;
  const cpcAll      = clicksAll > 0   ? spend / clicksAll   : 0;
  const cpcLink     = linkClicks > 0  ? spend / linkClicks  : 0;
  const cpm         = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const costPerLead = leads > 0       ? spend / leads       : 0;
  const costPerResult = results > 0   ? spend / results     : 0;
  const roas        = spend > 0       ? purchaseValue / spend : 0;
  const frequency   = reach > 0       ? impressions / reach  : 0;

  return {
    spend, impressions, reach, clicksAll, linkClicks,
    ctrAll, ctrLink, cpcAll, cpcLink, cpm,
    leads, costPerLead, results, costPerResult, installs,
    purchases, purchaseValue, roas, frequency, engagement,
  };
}

/**
 * Computes % change between current and previous period KPI values.
 * Returns an object with the same keys, values being % change.
 * @param {Object} current - KPI values for current period
 * @param {Object} previous - KPI values for previous period
 * @returns {Object} same keys, values = % change (can be null if previous = 0)
 */
export function computePeriodChange(current, previous) {
  const changes = {};
  for (const key of Object.keys(current)) {
    const curr = current[key];
    const prev = previous[key];
    if (prev === 0 || prev === null || prev === undefined) {
      changes[key] = null; // can't compute change from zero
    } else {
      changes[key] = ((curr - prev) / Math.abs(prev)) * 100;
    }
  }
  return changes;
}

/**
 * Groups rows by a field and aggregates KPIs for each group.
 * Used for campaign/adSet/ad breakdown tables.
 * @param {Array<Object>} data
 * @param {string} groupField - e.g. 'campaignName'
 * @returns {Array<Object>} one aggregated row per group
 */
export function groupAndAggregate(data, groupField) {
  const groups = {};

  for (const row of data) {
    const key = row[groupField] || '(Unknown)';
    if (!groups[key]) {
      groups[key] = { [groupField]: key, _rows: [] };
    }
    groups[key]._rows.push(row);
  }

  return Object.values(groups).map(({ _rows, ...meta }) => {
    const kpis = computeKpis(_rows);
    return { ...meta, ...kpis, rowCount: _rows.length };
  });
}

/**
 * Aggregates data by date for trend charts.
 * Returns array sorted by date ascending.
 * @param {Array<Object>} data
 * @returns {Array<Object>} daily aggregated rows
 */
export function aggregateByDate(data) {
  const byDate = {};

  for (const row of data) {
    const d = row.date;
    if (!d) continue;
    const key = d instanceof Date ? d.toISOString().slice(0, 10) : String(d);
    if (!byDate[key]) {
      byDate[key] = { date: key, _rows: [] };
    }
    byDate[key]._rows.push(row);
  }

  return Object.values(byDate)
    .map(({ _rows, date }) => ({ date, ...computeKpis(_rows) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Computes the account-wide average for a field.
 * Used for conditional formatting in tables.
 */
export function accountAverage(data, field) {
  return avgField(data, field);
}
