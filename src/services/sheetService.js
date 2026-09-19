/**
 * sheetService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches data from a publicly-published Google Sheet via the gviz/tq endpoint.
 * Supports direct fetch via Vite proxy as well as JSONP fallback for zero-CORS issues.
 * Falls back to mock data automatically when VITE_SHEET_ID is not configured.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import { HEADER_TO_CONFIG } from './sheetConfig';
import { getMockData } from './mockData';

const SHEET_ID  = import.meta.env.VITE_SHEET_ID;
const SHEET_GID = import.meta.env.VITE_SHEET_GID ?? '0';
const SHEET_TAB = import.meta.env.VITE_SHEET_TAB || 'Meta Ads Data';

/**
 * True when no real Sheet ID is set — app uses mock/demo data instead.
 */
export const IS_DEMO_MODE = !SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID_HERE';

/**
 * Returns the gviz/tq URL for the configured sheet.
 */
function buildGvizUrl(sheetTab = SHEET_TAB, useProxy = false) {
  const params = new URLSearchParams({ tqx: 'out:json' });
  if (sheetTab) {
    params.set('sheet', sheetTab);
  } else if (SHEET_GID) {
    params.set('gid', SHEET_GID);
  }

  const base = useProxy
    ? `/api/sheet/d/${SHEET_ID}/gviz/tq`
    : `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`;

  return `${base}?${params.toString()}`;
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
 * Robust JSONP fetch for Google Sheets gviz endpoint.
 * Completely bypasses browser CORS restrictions in any environment.
 */
function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = 'gvizCallback_' + Math.round(1000000 * Math.random());
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheet JSONP request timed out (15s).'));
    }, 15000);

    function cleanup() {
      clearTimeout(timeoutId);
      delete window[callbackName];
      const script = document.getElementById(callbackName);
      if (script && script.parentNode) script.parentNode.removeChild(script);
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    const script = document.createElement('script');
    script.id = callbackName;
    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}tqx=responseHandler:${callbackName}`;
    script.onerror = (err) => {
      cleanup();
      reject(new Error('Failed to load Google Sheet data. Ensure the sheet has link sharing enabled.'));
    };
    document.body.appendChild(script);
  });
}

/**
 * Inactive/fallback metadata helpers
 */
function inferPlatform(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('ios')) return 'Instagram';
  if (n.includes('android')) return 'Facebook';
  if (n.includes('reel') || n.includes('shark') || n.includes('ig')) return 'Instagram';
  if (n.includes('network') || n.includes('net')) return 'Audience Network';
  return 'Facebook';
}

function inferObjective(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('install') || n.includes('app')) return 'APP_INSTALLS';
  if (n.includes('lead')) return 'LEAD_GENERATION';
  if (n.includes('checkout') || n.includes('purchase') || n.includes('conversion')) return 'CONVERSIONS';
  if (n.includes('traffic') || n.includes('lp')) return 'TRAFFIC';
  return 'BRAND_AWARENESS';
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
 * @param {string} [sheetTab] Optional tab name (defaults to VITE_SHEET_TAB or 'Meta Ads Data')
 * @returns {Promise<Array<Object>>} Array of row objects keyed by internal field names.
 */
export async function fetchSheetData(sheetTab = SHEET_TAB) {
  // ── Demo / test mode: return mock data instantly ──────────────────────────
  if (IS_DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 600));
    return getMockData();
  }

  let gvizData = null;

  // 1. First attempt: Vite dev proxy (bypasses CORS in dev)
  try {
    const proxyUrl = buildGvizUrl(sheetTab, true);
    const response = await axios.get(proxyUrl, { responseType: 'text', timeout: 8000 });
    const jsonText = stripJsonpWrapper(response.data);
    gvizData = JSON.parse(jsonText);
  } catch (proxyErr) {
    // 2. Second attempt: Direct URL or JSONP fallback
    try {
      const directUrl = buildGvizUrl(sheetTab, false);
      const response = await axios.get(directUrl, { responseType: 'text', timeout: 8000 });
      const jsonText = stripJsonpWrapper(response.data);
      gvizData = JSON.parse(jsonText);
    } catch (directErr) {
      console.warn('[sheetService] Direct fetch failed. Using JSONP fallback...');
      const jsonpUrl = buildGvizUrl(sheetTab, false);
      gvizData = await fetchJsonp(jsonpUrl);
    }
  }

  if (!gvizData || gvizData.status === 'error') {
    const errors = gvizData?.errors?.map((e) => e.detailed_message).join('; ') || 'Unknown sheet error';
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

      if (!obj.campaignName || obj.campaignName.toUpperCase() === 'TOTAL') {
        return null;
      }

      // Fill in default date if missing (e.g. from Summary tab)
      if (!obj.date) {
        obj.date = new Date(2026, 8, 15);
      }

      // Hierarchy defaults
      obj.adSetName = obj.adSetName || `${obj.campaignName} - AdSet`;
      obj.adName = obj.adName || `${obj.campaignName} - Creative`;

      // Normalize click and CTR fields
      const clicks = Number(obj.clicksAll ?? obj.linkClicks ?? 0);
      obj.clicksAll = clicks;
      obj.linkClicks = clicks;

      const impr = Number(obj.impressions ?? 0);
      const spend = Number(obj.spend ?? 0);

      obj.ctrAll = obj.ctrAll != null ? Number(obj.ctrAll) : (impr > 0 ? (clicks / impr) * 100 : 0);
      obj.ctrLink = obj.ctrLink != null ? Number(obj.ctrLink) : obj.ctrAll;

      obj.cpcAll = obj.cpcAll != null ? Number(obj.cpcAll) : (clicks > 0 ? spend / clicks : 0);
      obj.cpcLink = obj.cpcLink != null ? Number(obj.cpcLink) : obj.cpcAll;

      obj.cpm = obj.cpm != null ? Number(obj.cpm) : (impr > 0 ? (spend / impr) * 1000 : 0);

      // Status & metadata
      obj.adStatus = obj.adStatus || 'ACTIVE';
      obj.status = obj.status || 'ACTIVE';
      obj.platform = obj.platform || inferPlatform(obj.campaignName);
      obj.objective = obj.objective || inferObjective(obj.campaignName);

      // Derived conversions
      if (obj.results == null) {
        if (obj.objective === 'APP_INSTALLS') {
          obj.results = Math.round(clicks * 0.25);
          obj.installs = obj.results;
        } else if (obj.objective === 'LEAD_GENERATION') {
          obj.results = Math.round(clicks * 0.1);
          obj.leads = obj.results;
        } else if (obj.objective === 'CONVERSIONS') {
          obj.results = Math.round(clicks * 0.08);
          obj.purchases = obj.results;
        } else {
          obj.results = clicks;
        }
      } else {
        obj.results = Number(obj.results);
      }
      obj.costPerResult = obj.results > 0 ? spend / obj.results : (obj.costPerResult ?? 0);

      return obj;
    })
    .filter(Boolean);

  return parsed;
}
