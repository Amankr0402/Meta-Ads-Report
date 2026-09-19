/**
 * FilterContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global filter state for the entire dashboard.
 *
 * FILTER SHAPE:
 *   {
 *     preset:      string,       // date preset key ('last30', 'custom', etc.)
 *     dateFrom:    Date|null,    // custom range start
 *     dateTo:      Date|null,    // custom range end
 *     campaigns:   string[],     // selected campaign names ([] = all)
 *     adSets:      string[],     // selected ad set names ([] = all)
 *     platforms:   string[],     // e.g. ['Facebook', 'Instagram']
 *     objectives:  string[],     // e.g. ['LEAD_GENERATION']
 *     statuses:    string[],     // e.g. ['ACTIVE']
 *   }
 *
 * Filters are persisted to localStorage and rehydrated on load.
 * All components read filters via useFilters() hook.
 * All filter changes go through dispatch() — no prop drilling.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { getPresetRange } from '../utils/dateHelpers';

const FilterContext = createContext(null);

const STORAGE_KEY = 'meta-ads-filters-v2';

// ── Default filter state: 1 September to 16 September 2026 ─────────────────
const DEFAULT_FILTERS = {
  preset: 'sepReport',
  dateFrom: new Date(2026, 8, 1, 0, 0, 0),
  dateTo: new Date(2026, 8, 16, 23, 59, 59),
  campaigns: [],
  adSets: [],
  platforms: [],
  objectives: [],
  statuses: [],
};

// ── Serialise / Deserialise Date objects for localStorage ───────────────────
function serialiseFilters(filters) {
  return JSON.stringify({
    ...filters,
    dateFrom: filters.dateFrom?.toISOString() ?? null,
    dateTo: filters.dateTo?.toISOString() ?? null,
  });
}

function deserialiseFilters(json) {
  try {
    const obj = JSON.parse(json);
    return {
      ...DEFAULT_FILTERS,
      ...obj,
      dateFrom: obj.dateFrom ? new Date(obj.dateFrom) : null,
      dateTo: obj.dateTo ? new Date(obj.dateTo) : null,
    };
  } catch {
    return DEFAULT_FILTERS;
  }
}

// ── Reducer ─────────────────────────────────────────────────────────────────
function filterReducer(state, action) {
  switch (action.type) {
    case 'SET_PRESET': {
      const range = getPresetRange(action.payload);
      return {
        ...state,
        preset: action.payload,
        dateFrom: range.from,
        dateTo: range.to,
      };
    }
    case 'SET_CUSTOM_RANGE':
      return { ...state, preset: 'custom', dateFrom: action.payload.from, dateTo: action.payload.to };
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload, adSets: [] }; // reset adSets when campaigns change
    case 'SET_AD_SETS':
      return { ...state, adSets: action.payload };
    case 'SET_PLATFORMS':
      return { ...state, platforms: action.payload };
    case 'SET_OBJECTIVES':
      return { ...state, objectives: action.payload };
    case 'SET_STATUSES':
      return { ...state, statuses: action.payload };
    case 'RESET_FILTERS': {
      const range = getPresetRange(DEFAULT_FILTERS.preset);
      return { ...DEFAULT_FILTERS, dateFrom: range.from, dateTo: range.to };
    }
    default:
      return state;
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function FilterProvider({ children }) {
  const [filters, dispatch] = useReducer(filterReducer, null, () => {
    // Rehydrate from localStorage on first render
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return deserialiseFilters(stored);
    // Default: apply last-30-days range
    const range = getPresetRange(DEFAULT_FILTERS.preset);
    return { ...DEFAULT_FILTERS, dateFrom: range.from, dateTo: range.to };
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serialiseFilters(filters));
  }, [filters]);

  const value = useMemo(() => ({ filters, dispatch }), [filters]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

/** Hook to read current filters and dispatch filter actions */
export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
}
