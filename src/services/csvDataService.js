/**
 * csvDataService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads the local CSV file at /public/ads-data.csv (served by Vite as a
 * static asset) and parses it into the same row format that sheetService.js
 * produces.
 *
 * HOW TO USE:
 *   1. Export your Meta Ads data from Google Sheets as CSV
 *      (File → Download → Comma Separated Values)
 *   2. Save / copy the file to:  d:\Meta Ads Report\public\ads-data.csv
 *   3. Refresh the dashboard — your real data will appear immediately.
 *
 * COLUMN NAME MATCHING:
 *   Column headers are matched case-insensitively and with common variants
 *   (e.g. "Amount Spent (INR)" → spend, "Link Clicks" → linkClicks).
 *   If a column in your CSV isn't recognized, it is silently ignored.
 *   To add a custom mapping, add an entry to EXTRA_ALIASES below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Papa from 'papaparse';

/**
 * EXTRA_ALIASES — add extra header → field mappings here if your CSV uses
 * different column names than the defaults in sheetConfig.js.
 *
 * Format:  'exact csv header (lowercase)': 'internalFieldName'
 */
const EXTRA_ALIASES = {
  'amount spent (inr)':          'spend',
  'amount spent':                'spend',
  'link clicks':                 'linkClicks',
  'clicks (all)':                'clicksAll',
  'ctr (all)':                   'ctrAll',
  'ctr (link click-through rate)': 'ctrLink',
  'ctr (link)':                  'ctrLink',
  'cpc (all)':                   'cpcAll',
  'cpc (cost per link click)':   'cpcLink',
  'cpc (link)':                  'cpcLink',
  'cost per result':             'costPerResult',
  'cost per lead':               'costPerLead',
  'purchase roas (return on ad spend)': 'roas',
  'website purchase roas':       'roas',
  'roas':                        'roas',
  'purchases':                   'purchases',
  'purchase value':              'purchaseValue',
  'results':                     'results',
  'leads':                       'leads',
  'impressions':                 'impressions',
  'reach':                       'reach',
  'frequency':                   'frequency',
  'cpm (cost per 1,000 impressions)': 'cpm',
  'cpm':                         'cpm',
  'campaign name':               'campaignName',
  'ad set name':                 'adSetName',
  'ad name':                     'adName',
  'reporting starts':            'date',
  'date':                        'date',
  'day':                         'date',
  'status':                      'adStatus',
  'delivery':                    'adStatus',
  'ad set budget':               'budget',
  'daily budget':                'budget',
  'budget':                      'budget',
  'budget type':                 'budgetType',
  'objective':                   'objective',
  'platform':                    'platform',
  'placement':                   'placement',
  'age':                         'age',
  'gender':                      'gender',
  'video plays':                 'videoViews',
  'video views':                 'videoViews',
  '3-second video plays':        'videoViews',
  'post engagements':            'engagement',
  'post reactions, comments and shares': 'engagement',
};

/** Number fields — will be coerced to float */
const NUMBER_FIELDS = new Set([
  'spend','budget','impressions','reach','frequency',
  'clicksAll','linkClicks','ctrAll','ctrLink',
  'cpcAll','cpcLink','cpm','leads','costPerLead',
  'results','costPerResult','purchases','purchaseValue','roas',
  'videoViews','videoWatch25','videoWatch50','videoWatch75','videoWatch100',
  'engagement',
]);

/** Date fields — try to parse as Date objects */
const DATE_FIELDS = new Set(['date']);

function coerceValue(field, raw) {
  if (raw === null || raw === undefined || raw === '' || raw === '-' || raw === 'N/A') {
    return NUMBER_FIELDS.has(field) ? 0 : null;
  }
  if (NUMBER_FIELDS.has(field)) {
    const n = parseFloat(String(raw).replace(/[₹$,\s%]/g, ''));
    return isNaN(n) ? 0 : n;
  }
  if (DATE_FIELDS.has(field)) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }
  return String(raw).trim();
}

/**
 * Fetches /ads-data.csv and parses it into dashboard row objects.
 * Returns null if the file is not found (404).
 */
export async function fetchCsvData() {
  let text;
  try {
    const res = await fetch('/ads-data.csv');
    if (!res.ok) return null;        // file not uploaded yet → use generated mock
    text = await res.text();
  } catch {
    return null;
  }

  const { data, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (errors.length) {
    console.warn('[csvDataService] CSV parse warnings:', errors.slice(0, 3));
  }

  if (!data?.length) return null;

  // Map headers → internal fields using EXTRA_ALIASES
  const headers = Object.keys(data[0]);
  const headerMap = {};     // csvHeader → internalField
  for (const h of headers) {
    const alias = EXTRA_ALIASES[h.toLowerCase().trim()];
    if (alias) headerMap[h] = alias;
  }

  const rows = data.map((rawRow) => {
    const row = {};
    for (const [csvHeader, field] of Object.entries(headerMap)) {
      row[field] = coerceValue(field, rawRow[csvHeader]);
    }
    return row;
  }).filter((r) => r.campaignName || r.date);   // skip blank rows

  return rows;
}
