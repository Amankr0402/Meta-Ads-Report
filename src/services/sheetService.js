/**
 * sheetService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches data from a publicly-published Google Sheet via the gviz/tq endpoint.
 * Falls back to mock data automatically when VITE_SHEET_ID is not configured.
 *
 * ENDPOINT FORMAT:
 *   https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq
 *     ?tqx=out:json
 *     &gid={GID}        (tab ID; 0 = first tab)
 *     &tq={QUERY}       (optional GQL query — currently unused, returns all rows)
 *
 * IMPORTANT: The sheet MUST be published to the web.
 *   File → Share → Publish to web → select tab → Publish
 *
 * RESPONSE FORMAT:
 *   The endpoint returns JSONP wrapped: google.visualization.Query.setResponse({...})
 *   The wrapper prefix looks like: slash-asterisk-O_o-asterisk-slash (stripped before JSON.parse)
 *   We strip the wrapper and parse the inner JSON.
 *
 * COLUMN MAPPING:
 *   Raw column labels from the sheet are matched against HEADER_TO_CONFIG
 *   (from sheetConfig.js) using case-insensitive, trimmed comparison.
 *   Unrecognized columns are silently ignored.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { HEADER_TO_CONFIG } from './sheetConfig';
import { getMockData } from './mockData';
import { fetchCsvData } from './csvDataService';

const SHEET_ID  = import.meta.env.VITE_SHEET_ID;
const SHEET_GID = import.meta.env.VITE_SHEET_GID ?? '0';

/**
 * True when no real Sheet ID is set — app uses mock/demo data instead.
 * Remove this once you configure VITE_SHEET_ID in .env.
 */
export const IS_DEMO_MODE = !SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID_HERE';

/**
 * Returns the gviz/tq URL for the configured sheet.
 */
function buildGvizUrl() {
  const params = new URLSearchParams({ tqx: 'out:json', gid: SHEET_GID });
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`;
}

/**
 * Strips the JSONP wrapper from the gviz response text.
 */
function stripJsonpWrapper(text) {
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Unexpected response format from Google Sheets gviz endpoint.');
  }
  return text.slice(start, end + 1);
}

/**
 * Parses a gviz JSON value cell into a JS primitive.
 * @param {object} cell - gviz cell object { v, f }
 * @param {'date'|'number'|'string'} type
 */
function parseCell(cell, type) {
  if (!cell || cell.v === null || cell.v === undefined || cell.v === '') {
    return type === 'number' ? 0 : null;
  }

  const raw = cell.v;

  switch (type) {
    case 'date': {
      if (typeof raw === 'string' && raw.startsWith('Date(')) {
        const parts = raw.slice(5, -1).split(',').map(Number);
        return new Date(parts[0], parts[1], parts[2]);
      }
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }
    case 'number': {
      const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/,/g, ''));
      return isNaN(n) ? 0 : n;
    }
    case 'string':
    default:
      return String(raw).trim();
  }
}

/**
 * Fetches and parses the Google Sheet data.
 * Returns mock data automatically if VITE_SHEET_ID is not configured.
 *
 * @returns {Promise<Array<Object>>} Array of row objects keyed by internal field names.
 */
export async function fetchSheetData() {
  // ── Demo / test mode: return mock data instantly ──────────────────────────
  if (IS_DEMO_MODE) {
    // Simulate a small network delay for realistic UX testing
    await new Promise((r) => setTimeout(r, 600));
    return getMockData();
  }

  // ── Live mode: fetch from Google Sheets gviz endpoint ────────────────────
  const url = buildGvizUrl();

  const response = await axios.get(url, {
    responseType: 'text',
    timeout: 15000,
  });

  const jsonText = stripJsonpWrapper(response.data);
  const gvizData = JSON.parse(jsonText);

  if (gvizData.status === 'error') {
    const errors = gvizData.errors?.map((e) => e.detailed_message).join('; ');
    throw new Error(`Google Sheets returned an error: ${errors}`);
  }

  const { cols, rows } = gvizData.table;

  const colIndexMap = cols.map((col) => {
    const headerKey = (col.label || col.id || '').toLowerCase().trim();
    return HEADER_TO_CONFIG[headerKey] ?? null;
  });

  const parsed = rows
    .map((row) => {
      if (!row.c) return null;
      const obj = {};
      row.c.forEach((cell, idx) => {
        const config = colIndexMap[idx];
        if (!config) return;
        obj[config.field] = parseCell(cell, config.type);
      });
      return obj;
    })
    .filter(Boolean)
    .filter((row) => row.date || row.campaignName);

  return parsed;
}
