/**
 * sheetConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for Google Sheet column mapping.
 *
 * HOW TO UPDATE:
 *   If your sheet column headers change, only edit this file.
 *   - `sheetHeader`  : The exact text in your sheet's first row.
 *   - `field`        : The internal camelCase key used throughout the app.
 *   - `type`         : 'date' | 'number' | 'string' — controls parsing.
 *   - `label`        : Human-readable label shown in the UI.
 *
 * Column order in this array does NOT need to match the sheet order.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const COLUMN_MAP = [
  // ── Time ───────────────────────────────────────────────────────────────────
  { sheetHeader: 'Date',                    field: 'date',              type: 'date',   label: 'Date' },

  // ── Hierarchy ──────────────────────────────────────────────────────────────
  { sheetHeader: 'Campaign Name',           field: 'campaignName',      type: 'string', label: 'Campaign' },
  { sheetHeader: 'Ad Set Name',             field: 'adSetName',         type: 'string', label: 'Ad Set' },
  { sheetHeader: 'Ad Name',                 field: 'adName',            type: 'string', label: 'Ad' },

  // ── Spend ──────────────────────────────────────────────────────────────────
  { sheetHeader: 'Amount Spent',            field: 'spend',             type: 'number', label: 'Spend' },
  { sheetHeader: 'Budget',                  field: 'budget',            type: 'number', label: 'Budget' },   // optional

  // ── Reach & Frequency ─────────────────────────────────────────────────────
  { sheetHeader: 'Impressions',             field: 'impressions',       type: 'number', label: 'Impressions' },
  { sheetHeader: 'Reach',                   field: 'reach',             type: 'number', label: 'Reach' },
  { sheetHeader: 'Frequency',               field: 'frequency',         type: 'number', label: 'Frequency' },

  // ── Clicks ─────────────────────────────────────────────────────────────────
  { sheetHeader: 'Clicks (All)',             field: 'clicksAll',         type: 'number', label: 'Clicks (All)' },
  { sheetHeader: 'Link Clicks',             field: 'linkClicks',        type: 'number', label: 'Link Clicks' },

  // ── CTR ────────────────────────────────────────────────────────────────────
  { sheetHeader: 'CTR (All)',               field: 'ctrAll',            type: 'number', label: 'CTR (All)' },
  { sheetHeader: 'CTR (Link)',              field: 'ctrLink',           type: 'number', label: 'CTR (Link)' },

  // ── CPC ────────────────────────────────────────────────────────────────────
  { sheetHeader: 'CPC (All)',               field: 'cpcAll',            type: 'number', label: 'CPC (All)' },
  { sheetHeader: 'CPC (Link)',              field: 'cpcLink',           type: 'number', label: 'CPC (Link)' },

  // ── CPM ────────────────────────────────────────────────────────────────────
  { sheetHeader: 'CPM',                     field: 'cpm',               type: 'number', label: 'CPM' },

  // ── Conversions ────────────────────────────────────────────────────────────
  { sheetHeader: 'Leads',                   field: 'leads',             type: 'number', label: 'Leads' },
  { sheetHeader: 'Cost per Lead',           field: 'costPerLead',       type: 'number', label: 'Cost/Lead' },
  { sheetHeader: 'Results',                 field: 'results',           type: 'number', label: 'Results' },
  { sheetHeader: 'Cost per Result',         field: 'costPerResult',     type: 'number', label: 'Cost/Result' },

  // ── Purchases ──────────────────────────────────────────────────────────────
  { sheetHeader: 'Purchases',               field: 'purchases',         type: 'number', label: 'Purchases' },
  { sheetHeader: 'Purchase Value',          field: 'purchaseValue',     type: 'number', label: 'Purchase Value' },
  { sheetHeader: 'ROAS',                    field: 'roas',              type: 'number', label: 'ROAS' },

  // ── Video ──────────────────────────────────────────────────────────────────
  { sheetHeader: 'Video Views',             field: 'videoViews',        type: 'number', label: 'Video Views' },
  { sheetHeader: 'Video Watch % (25)',      field: 'videoWatch25',      type: 'number', label: 'Video 25%' },
  { sheetHeader: 'Video Watch % (50)',      field: 'videoWatch50',      type: 'number', label: 'Video 50%' },
  { sheetHeader: 'Video Watch % (75)',      field: 'videoWatch75',      type: 'number', label: 'Video 75%' },
  { sheetHeader: 'Video Watch % (100)',     field: 'videoWatch100',     type: 'number', label: 'Video 100%' },

  // ── Engagement ─────────────────────────────────────────────────────────────
  { sheetHeader: 'Engagement (Likes/Comments/Shares)', field: 'engagement', type: 'number', label: 'Engagement' },

  // ── Meta ───────────────────────────────────────────────────────────────────
  { sheetHeader: 'Ad Status',              field: 'adStatus',           type: 'string', label: 'Status' },
  { sheetHeader: 'Objective',              field: 'objective',          type: 'string', label: 'Objective' },
  { sheetHeader: 'Platform',              field: 'platform',            type: 'string', label: 'Platform' },

  // ── Demographics ───────────────────────────────────────────────────────────
  { sheetHeader: 'Age',                    field: 'age',                type: 'string', label: 'Age' },
  { sheetHeader: 'Gender',                 field: 'gender',             type: 'string', label: 'Gender' },
  { sheetHeader: 'Placement',              field: 'placement',          type: 'string', label: 'Placement' },
];

/**
 * Build a lookup map from sheetHeader → column config.
 * Used by sheetService.js to map raw column names to internal fields.
 */
export const HEADER_TO_CONFIG = Object.fromEntries(
  COLUMN_MAP.map((col) => [col.sheetHeader.toLowerCase().trim(), col])
);

/**
 * Build a lookup map from field → label for the UI.
 */
export const FIELD_LABELS = Object.fromEntries(
  COLUMN_MAP.map((col) => [col.field, col.label])
);
