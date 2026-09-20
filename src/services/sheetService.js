/**
 * sheetService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches data from a publicly-published Google Sheet via the gviz/tq endpoint.
 * Optimized with PapaParse streaming for fast loading of large datasets (30k+ rows).
 * Supports Vite dev proxy and robust JSONP fallback for zero-CORS issues.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios';
import Papa from 'papaparse';
import { HEADER_TO_CONFIG } from './sheetConfig';
import { getMockData } from './mockData';

const SHEET_ID  = import.meta.env.VITE_SHEET_ID || '1iBUroD04LLZpGWRe0BucumWOxYSFDwlMBoGPJa7S6co';
const SHEET_GID = import.meta.env.VITE_SHEET_GID ?? '0';
const SHEET_TAB = import.meta.env.VITE_SHEET_TAB || 'Meta Ads Data';

/**
 * True when no real Sheet ID is set — app uses mock/demo data instead.
 */
export const IS_DEMO_MODE = !SHEET_ID || SHEET_ID === 'YOUR_SHEET_ID_HERE';

/**
 * Returns the gviz/tq CSV URL for the configured sheet.
 */
function buildGvizCsvUrl(sheetTab = SHEET_TAB, useProxy = false) {
  const params = new URLSearchParams({ tqx: 'out:csv' });
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
 * Returns the gviz/tq JSON URL (for JSONP fallback).
 */
function buildGvizJsonUrl(sheetTab = SHEET_TAB, useProxy = false) {
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
 * Robust JSONP fetch for Google Sheets gviz endpoint.
 */
function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = 'gvizCallback_' + Math.round(1000000 * Math.random());
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Google Sheet JSONP request timed out (20s).'));
    }, 20000);

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
    script.onerror = () => {
      cleanup();
      reject(new Error('Failed to load Google Sheet data. Ensure link sharing is set to anyone with the link.'));
    };
    document.body.appendChild(script);
  });
}

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
 * Normalizes a raw parsed row into dashboard schema
 */
function normalizeRow(row) {
  const camp = String(row.campaign_name || row['campaign name'] || row.campaign || '').trim();
  if (!camp || camp.toUpperCase() === 'TOTAL') return null;

  const spend = Number(row.spend || row['amount spent'] || 0) || 0;
  const impr = Number(row.impressions || 0) || 0;
  const clicks = Number(row.clicks || row['clicks (all)'] || 0) || 0;
  const reach = Number(row.reach || 0) || 0;
  const freq = Number(row.frequency || (reach > 0 ? impr / reach : 1)) || 1;

  // Extract conversions from 'actions' column if present
  let installs = 0, leads = 0, purchases = 0;
  if (row.actions && typeof row.actions === 'string') {
    const matchVal = row.actions.match(/value=(\d+)/);
    const val = matchVal ? parseInt(matchVal[1], 10) : 0;
    if (row.actions.includes('install')) installs = val;
    if (row.actions.includes('lead') || row.actions.includes('registration')) leads = val;
    if (row.actions.includes('purchase') || row.actions.includes('checkout')) purchases = val;
  }

  const obj = inferObjective(camp);
  const results = installs || leads || purchases || Math.round(clicks * 0.15);

  const parsedDate = row.date_start
    ? new Date(row.date_start + 'T00:00:00')
    : (row.date ? new Date(row.date) : new Date(2026, 8, 15));

  return {
    date: isNaN(parsedDate.getTime()) ? new Date(2026, 8, 15) : parsedDate,
    dateStop: row.date_stop ? new Date(row.date_stop + 'T23:59:59') : null,
    campaignName: camp,
    adSetName: String(row.adset_name || row['ad set name'] || `${camp} - AdSet`).trim(),
    adName: String(row.ad_name || row['ad name'] || `${camp} - Creative`).trim(),
    spend,
    impressions: impr,
    reach,
    frequency: freq,
    clicksAll: clicks,
    linkClicks: clicks,
    ctrAll: row.ctr != null ? Number(row.ctr) : (impr > 0 ? (clicks / impr) * 100 : 0),
    ctrLink: row.ctr != null ? Number(row.ctr) : (impr > 0 ? (clicks / impr) * 100 : 0),
    cpcAll: row.cpc != null ? Number(row.cpc) : (clicks > 0 ? spend / clicks : 0),
    cpcLink: row.cpc != null ? Number(row.cpc) : (clicks > 0 ? spend / clicks : 0),
    cpm: impr > 0 ? (spend / impr) * 1000 : 0,
    adStatus: 'ACTIVE',
    status: 'ACTIVE',
    platform: inferPlatform(camp),
    objective: obj,
    installs,
    leads,
    purchases,
    results,
    costPerResult: results > 0 ? spend / results : 0,
  };
}

/**
 * Fetches and parses the Google Sheet data.
 * @param {string} [sheetTab] Optional tab name (defaults to VITE_SHEET_TAB or 'Meta Ads Data')
 * @returns {Promise<Array<Object>>}
 */
export async function fetchSheetData(sheetTab = SHEET_TAB) {
  if (IS_DEMO_MODE) {
    await new Promise((r) => setTimeout(r, 600));
    return getMockData();
  }

  // 1. Try fetching CSV via Vite dev proxy
  try {
    const csvProxyUrl = buildGvizCsvUrl(sheetTab, true);
    const response = await axios.get(csvProxyUrl, { responseType: 'text', timeout: 12000 });
    const parsed = Papa.parse(response.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase(),
    });
    const rows = parsed.data.map(normalizeRow).filter(Boolean);
    if (rows.length > 0) return rows;
  } catch (proxyErr) {
    console.warn('[sheetService] Proxy CSV fetch failed or running in prod. Trying direct / JSONP...');
  }

  // 2. Try direct CSV fetch
  try {
    const directCsvUrl = buildGvizCsvUrl(sheetTab, false);
    const response = await axios.get(directCsvUrl, { responseType: 'text', timeout: 12000 });
    const parsed = Papa.parse(response.data, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase(),
    });
    const rows = parsed.data.map(normalizeRow).filter(Boolean);
    if (rows.length > 0) return rows;
  } catch (directErr) {
    console.warn('[sheetService] Direct CSV fetch blocked by CORS. Using JSONP fallback...');
  }

  // 3. Robust JSONP Fallback
  const jsonpUrl = buildGvizJsonUrl(sheetTab, false);
  const gvizData = await fetchJsonp(jsonpUrl);
  if (!gvizData || gvizData.status === 'error') {
    throw new Error('Could not fetch data from Google Sheet.');
  }

  const { cols, rows } = gvizData.table;
  const colIndexMap = cols.map((col) => {
    const headerKey = (col.label || col.id || '').toLowerCase().trim();
    return HEADER_TO_CONFIG[headerKey] ?? null;
  });

  return rows
    .map((row) => {
      if (!row.c) return null;
      const rawObj = {};
      row.c.forEach((cell, idx) => {
        const config = colIndexMap[idx];
        if (!config) return;
        const val = cell ? cell.v : null;
        rawObj[config.field] = val;
      });
      return normalizeRow(rawObj);
    })
    .filter(Boolean);
}
