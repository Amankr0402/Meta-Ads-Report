/**
 * useFilteredData.js
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for filtered data.
 *
 * Every chart and table component calls this hook.
 * Filter logic lives here only — never duplicated in individual components.
 *
 * RETURNS:
 *   {
 *     filteredData:      Array<Object>,  // rows matching all active filters
 *     previousData:      Array<Object>,  // rows for the previous equivalent period
 *     kpis:              Object,         // aggregated KPIs for filteredData
 *     previousKpis:      Object,         // aggregated KPIs for previousData
 *     kpiChanges:        Object,         // % change current vs previous
 *     filterOptions:     Object,         // unique values for each filter dropdown
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { useFilters } from '../context/FilterContext';
import { isInDateRange, getPreviousPeriod } from '../utils/dateHelpers';
import { computeKpis, computePeriodChange } from '../utils/aggregators';

/**
 * @param {Array<Object>|null} rawData - All rows from useSheetData
 */
export function useFilteredData(rawData) {
  const { filters } = useFilters();

  // ── Compute filter options from raw data ────────────────────────────────
  const filterOptions = useMemo(() => {
    if (!rawData) return { campaigns: [], adSets: [], platforms: [], objectives: [], statuses: [] };
    return {
      campaigns:  [...new Set(rawData.map((r) => r.campaignName).filter(Boolean))].sort(),
      adSets:     [...new Set(rawData.map((r) => r.adSetName).filter(Boolean))].sort(),
      platforms:  [...new Set(rawData.map((r) => r.platform).filter(Boolean))].sort(),
      objectives: [...new Set(rawData.map((r) => r.objective).filter(Boolean))].sort(),
      statuses:   [...new Set(rawData.map((r) => r.adStatus).filter(Boolean))].sort(),
    };
  }, [rawData]);

  // ── Dependent ad-set options (filtered by selected campaigns) ───────────
  const dependentAdSets = useMemo(() => {
    if (!rawData) return [];
    const source = filters.campaigns.length > 0
      ? rawData.filter((r) => filters.campaigns.includes(r.campaignName))
      : rawData;
    return [...new Set(source.map((r) => r.adSetName).filter(Boolean))].sort();
  }, [rawData, filters.campaigns]);

  // ── Apply all filters to get current-period data ────────────────────────
  const filteredData = useMemo(() => {
    if (!rawData) return [];

    return rawData.filter((row) => {
      // Date range
      if (!isInDateRange(row.date, filters.dateFrom, filters.dateTo)) return false;

      // Campaign
      if (filters.campaigns.length > 0 && !filters.campaigns.includes(row.campaignName)) return false;

      // Ad Set (only filter if specific ad sets are selected)
      if (filters.adSets.length > 0 && !filters.adSets.includes(row.adSetName)) return false;

      // Platform
      if (filters.platforms.length > 0 && !filters.platforms.includes(row.platform)) return false;

      // Objective
      if (filters.objectives.length > 0 && !filters.objectives.includes(row.objective)) return false;

      // Status
      if (filters.statuses.length > 0 && !filters.statuses.includes(row.adStatus)) return false;

      return true;
    });
  }, [rawData, filters]);

  // ── Compute previous period data (same filters except date range) ────────
  const previousData = useMemo(() => {
    if (!rawData || !filters.dateFrom || !filters.dateTo) return [];
    const { from: prevFrom, to: prevTo } = getPreviousPeriod({ from: filters.dateFrom, to: filters.dateTo });

    return rawData.filter((row) => {
      if (!isInDateRange(row.date, prevFrom, prevTo)) return false;
      if (filters.campaigns.length > 0 && !filters.campaigns.includes(row.campaignName)) return false;
      if (filters.adSets.length > 0 && !filters.adSets.includes(row.adSetName)) return false;
      if (filters.platforms.length > 0 && !filters.platforms.includes(row.platform)) return false;
      if (filters.objectives.length > 0 && !filters.objectives.includes(row.objective)) return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(row.adStatus)) return false;
      return true;
    });
  }, [rawData, filters]);

  // ── KPI aggregations ────────────────────────────────────────────────────
  const kpis = useMemo(() => computeKpis(filteredData), [filteredData]);
  const previousKpis = useMemo(() => computeKpis(previousData), [previousData]);
  const kpiChanges = useMemo(() => computePeriodChange(kpis, previousKpis), [kpis, previousKpis]);

  return {
    filteredData,
    previousData,
    kpis,
    previousKpis,
    kpiChanges,
    filterOptions: { ...filterOptions, adSets: dependentAdSets },
  };
}
