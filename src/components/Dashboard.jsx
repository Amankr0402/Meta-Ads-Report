/**
 * Dashboard.jsx
 * Root layout component — assembles all sections.
 * Fetches raw data via useSheetData, derives filtered data via useFilteredData,
 * then passes data down to child charts/tables.
 */

import { useMemo } from 'react';
import {
  DollarSign, Eye, Users, MousePointerClick, TrendingUp,
  Target, ShoppingCart, Zap, BarChart2, RefreshCw, Download, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

import { useSheetData }    from '../hooks/useSheetData';
import { useFilteredData } from '../hooks/useFilteredData';
import { IS_DEMO_MODE }    from '../services/sheetService';
import { FilterBar }       from './FilterBar';
import { KpiCard }         from './KpiCard';
import { TrendChart }      from './TrendChart';
import { FunnelChart }     from './FunnelChart';
import { PlatformBreakdown }   from './PlatformBreakdown';
import { PlacementBreakdown }  from './PlacementBreakdown';
import { DemographicsHeatmap } from './DemographicsHeatmap';
import { PerformersList }      from './PerformersList';
import { DataTable }       from './DataTable';
import { ThemeToggle }     from './ThemeToggle';
import { ErrorBoundary }   from './ErrorBoundary';
import { KpiRowSkeleton, ChartSkeleton, TableSkeleton } from './LoadingSkeleton';

import { aggregateByDate, groupAndAggregate, accountAverage } from '../utils/aggregators';
import { exportToCsv } from '../utils/csvExport';

import styles from '../styles/Dashboard.module.css';

// ── Column definitions for the three breakdown tables ─────────────────────

const CAMPAIGN_COLUMNS = [
  { key: 'campaignName',  label: 'Campaign',      sortable: true,  format: 'string',   width: 240 },
  { key: 'adStatus',      label: 'Delivery',      sortable: true,  format: 'string',   align: 'center' },
  { key: 'spend',         label: 'Spend',         sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'results',       label: 'Results',       sortable: true,  format: 'number',   align: 'right' },
  { key: 'costPerResult', label: 'Cost / Result', sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'installs',      label: 'App Installs',  sortable: true,  format: 'number',   align: 'right' },
  { key: 'impressions',   label: 'Impressions',   sortable: true,  format: 'compact',  align: 'right' },
  { key: 'reach',         label: 'Reach',         sortable: true,  format: 'compact',  align: 'right' },
  { key: 'linkClicks',    label: 'Link Clicks',   sortable: true,  format: 'number',   align: 'right' },
  { key: 'ctrLink',       label: 'CTR (Link)',    sortable: true,  format: 'percent',  align: 'right', conditional: true },
  { key: 'cpm',           label: 'CPM',           sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'leads',         label: 'Leads',         sortable: true,  format: 'number',   align: 'right' },
  { key: 'costPerLead',   label: 'CPL',          sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'roas',          label: 'ROAS',          sortable: true,  format: 'roas',     align: 'right', conditional: true },
];

const AD_SET_COLUMNS = [
  { key: 'adSetName',     label: 'Ad Set',       sortable: true,  format: 'string',   width: 200 },
  { key: 'campaignName',  label: 'Campaign',     sortable: true,  format: 'string',   width: 160 },
  { key: 'spend',         label: 'Spend',        sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'impressions',   label: 'Impressions',  sortable: true,  format: 'compact',  align: 'right' },
  { key: 'ctrLink',       label: 'CTR (Link)',   sortable: true,  format: 'percent',  align: 'right', conditional: true },
  { key: 'cpm',           label: 'CPM',          sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'leads',         label: 'Leads',        sortable: true,  format: 'number',   align: 'right' },
  { key: 'costPerLead',   label: 'CPL',          sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'roas',          label: 'ROAS',         sortable: true,  format: 'roas',     align: 'right', conditional: true },
];

const AD_COLUMNS = [
  { key: 'adName',        label: 'Ad',           sortable: true,  format: 'string',   width: 200 },
  { key: 'adSetName',     label: 'Ad Set',       sortable: true,  format: 'string',   width: 160 },
  { key: 'spend',         label: 'Spend',        sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'impressions',   label: 'Impressions',  sortable: true,  format: 'compact',  align: 'right' },
  { key: 'ctrLink',       label: 'CTR (Link)',   sortable: true,  format: 'percent',  align: 'right', conditional: true },
  { key: 'frequency',     label: 'Frequency',    sortable: true,  format: 'number',   align: 'right' },
  { key: 'leads',         label: 'Leads',        sortable: true,  format: 'number',   align: 'right' },
  { key: 'costPerLead',   label: 'CPL',          sortable: true,  format: 'currency', align: 'right', conditional: true },
  { key: 'roas',          label: 'ROAS',         sortable: true,  format: 'roas',     align: 'right', conditional: true },
  { key: 'adStatus',      label: 'Status',       sortable: true,  format: 'string',   align: 'center' },
];

// ── KPI card definitions ───────────────────────────────────────────────────
const KPI_DEFS = [
  { key: 'spend',         label: 'Total Spend',     format: 'currency', isPositiveGood: false, icon: <DollarSign size={16} /> },
  { key: 'results',       label: 'Total Results',   format: 'number',   isPositiveGood: true,  icon: <Target size={16} /> },
  { key: 'costPerResult', label: 'Cost / Result',   format: 'currency', isPositiveGood: false, icon: <DollarSign size={16} /> },
  { key: 'installs',      label: 'App Installs',    format: 'number',   isPositiveGood: true,  icon: <Download size={16} /> },
  { key: 'impressions',   label: 'Impressions',     format: 'compact',  isPositiveGood: true,  icon: <Eye size={16} /> },
  { key: 'reach',         label: 'Reach',           format: 'compact',  isPositiveGood: true,  icon: <Users size={16} /> },
  { key: 'linkClicks',    label: 'Link Clicks',     format: 'compact',  isPositiveGood: true,  icon: <MousePointerClick size={16} /> },
  { key: 'ctrLink',       label: 'CTR (Link)',      format: 'percent',  isPositiveGood: true,  icon: <TrendingUp size={16} /> },
  { key: 'cpm',           label: 'CPM',             format: 'currency', isPositiveGood: false, icon: <BarChart2 size={16} /> },
  { key: 'cpcLink',       label: 'CPC (Link)',      format: 'currency', isPositiveGood: false, icon: <DollarSign size={16} /> },
  { key: 'leads',         label: 'Total Leads',     format: 'number',   isPositiveGood: true,  icon: <Target size={16} /> },
  { key: 'costPerLead',   label: 'Cost / Lead',     format: 'currency', isPositiveGood: false, icon: <DollarSign size={16} /> },
  { key: 'purchases',     label: 'Purchases',       format: 'number',   isPositiveGood: true,  icon: <ShoppingCart size={16} /> },
  { key: 'roas',          label: 'ROAS',            format: 'roas',     isPositiveGood: true,  icon: <Zap size={16} /> },
  { key: 'frequency',     label: 'Frequency',       format: 'number',   isPositiveGood: false, icon: <Eye size={16} /> },
];

// ── Dashboard ──────────────────────────────────────────────────────────────
export function Dashboard() {
  const { data: rawData, loading, refreshing, error, lastUpdated, refresh } = useSheetData();
  const { filteredData, kpis, kpiChanges, filterOptions } = useFilteredData(rawData);

  // ── Derived chart/table data (all memoized) ──────────────────────────────
  const trendData        = useMemo(() => aggregateByDate(filteredData), [filteredData]);
  const campaignData     = useMemo(() => groupAndAggregate(filteredData, 'campaignName'), [filteredData]);
  const adSetData        = useMemo(() => groupAndAggregate(filteredData, 'adSetName'),    [filteredData]);
  const adData           = useMemo(() => groupAndAggregate(filteredData, 'adName'),       [filteredData]);

  // Account averages for conditional table formatting
  const tableAverages    = useMemo(() => ({
    spend:        accountAverage(campaignData, 'spend'),
    ctrLink:      accountAverage(campaignData, 'ctrLink'),
    cpm:          accountAverage(campaignData, 'cpm'),
    costPerLead:  accountAverage(campaignData, 'costPerLead'),
    roas:         accountAverage(campaignData, 'roas'),
  }), [campaignData]);

  const handleExport = () => {
    exportToCsv(filteredData, null, `meta_ads_${format(new Date(), 'yyyy-MM-dd')}`);
  };

  return (
    <div className={styles.layout}>
      {/* ── Refreshing progress bar ── */}
      {refreshing && <div className={styles.refreshingBar} />}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <BarChart2 size={18} color="white" />
            </div>
            <span className={styles.logoText}>Meta Ads Dashboard</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {lastUpdated && (
            <span className={styles.lastUpdated}>
              Last updated: {format(lastUpdated, 'dd MMM, HH:mm:ss')}
            </span>
          )}

          <button
            className={`${styles.refreshBtn} ${refreshing ? styles.spinning : ''}`}
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw size={13} />
            {refreshing ? 'Refreshing…' : 'Refresh Data'}
          </button>

          <button className={styles.exportBtn} onClick={handleExport}>
            <Download size={13} />
            Export CSV
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* ── Filter Bar ── */}
      <div className={styles.filterStrip}>
        <FilterBar filterOptions={filterOptions} />
      </div>

      {/* ── Main Content ── */}
      <main className={styles.main}>

        {/* Demo mode notice */}
        {IS_DEMO_MODE && (
          <div style={{
            margin: 'var(--space-4) 0',
            padding: 'var(--space-3) var(--space-5)',
            background: 'linear-gradient(90deg, rgba(99,102,241,.1), rgba(139,92,246,.08))',
            border: '1px solid rgba(99,102,241,.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13, color: 'var(--brand-primary)', fontWeight: 500,
          }}>
            📊 <strong>Meta Ads Performance Report</strong> — Showing data for <strong>1 September – 16 September 2026</strong> (Active &amp; Spending Campaigns | ₹0 spend excluded).
          </div>
        )}

        {/* Live Google Sheet banner */}
        {!IS_DEMO_MODE && (
          <div style={{
            margin: 'var(--space-4) 0',
            padding: 'var(--space-3) var(--space-5)',
            background: 'linear-gradient(90deg, rgba(16,185,129,.12), rgba(5,150,105,.08))',
            border: '1px solid rgba(16,185,129,.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13, color: '#047857', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8
          }}>
            <span>
              🟢 <strong>Connected to Live Google Sheet</strong> — Source: <strong>Meta Ads Data</strong> ({rawData?.length ? rawData.length.toLocaleString() : 0} records synced live)
            </span>
            <a
              href="https://docs.google.com/spreadsheets/d/1iBUroD04LLZpGWRe0BucumWOxYSFDwlMBoGPJa7S6co/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#047857', textDecoration: 'underline', fontSize: 12 }}
            >
              Open Google Sheet ↗
            </a>
          </div>
        )}

        {/* Fetch error banner (only for real errors, not demo mode) */}
        {error && !IS_DEMO_MODE && (
          <div className={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>
              {error.message?.includes('VITE_SHEET_ID')
                ? '⚙️ Sheet not configured — set VITE_SHEET_ID in your .env file and restart the dev server.'
                : `Data fetch error: ${error.message}. Showing last known data.`}
            </span>
          </div>
        )}

        {/* ── KPI Cards ── */}
        {loading ? (
          <KpiRowSkeleton count={KPI_DEFS.length} />
        ) : (
          <div className="grid-kpi">
            {KPI_DEFS.map((kpi) => (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={kpis[kpi.key]}
                format={kpi.format}
                change={kpiChanges[kpi.key]}
                icon={kpi.icon}
                isPositiveGood={kpi.isPositiveGood}
              />
            ))}
          </div>
        )}

        {/* ── Trend Chart ── */}
        {loading ? (
          <ChartSkeleton height={320} />
        ) : (
          <ErrorBoundary>
            <div className="col-12">
              <TrendChart data={trendData} />
            </div>
          </ErrorBoundary>
        )}

        {/* ── Funnel + Platform ── */}
        <div className="grid-charts">
          <div className="col-6">
            {loading ? <ChartSkeleton height={280} /> : (
              <ErrorBoundary>
                <FunnelChart kpis={kpis} />
              </ErrorBoundary>
            )}
          </div>
          <div className="col-6">
            {loading ? <ChartSkeleton height={280} /> : (
              <ErrorBoundary>
                <PlatformBreakdown filteredData={filteredData} />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* ── Placement + Demographics ── */}
        <div className="grid-charts">
          <div className="col-6">
            {loading ? <ChartSkeleton height={280} /> : (
              <ErrorBoundary>
                <PlacementBreakdown filteredData={filteredData} />
              </ErrorBoundary>
            )}
          </div>
          <div className="col-6">
            {loading ? <ChartSkeleton height={280} /> : (
              <ErrorBoundary>
                <DemographicsHeatmap filteredData={filteredData} />
              </ErrorBoundary>
            )}
          </div>
        </div>

        {/* ── Top/Bottom Performers ── */}
        {loading ? <ChartSkeleton height={300} /> : (
          <ErrorBoundary>
            <PerformersList filteredData={filteredData} />
          </ErrorBoundary>
        )}

        {/* ── Campaign Table ── */}
        <div>
          <div className={styles.sectionTitle}>📊 Campaign Breakdown</div>
          {loading ? <TableSkeleton /> : (
            <ErrorBoundary>
              <DataTable
                title="Campaigns"
                columns={CAMPAIGN_COLUMNS}
                data={campaignData}
                averages={tableAverages}
                searchable
              />
            </ErrorBoundary>
          )}
        </div>

        {/* ── Ad Set Table ── */}
        <div>
          <div className={styles.sectionTitle}>📋 Ad Set Breakdown</div>
          {loading ? <TableSkeleton /> : (
            <ErrorBoundary>
              <DataTable
                title="Ad Sets"
                columns={AD_SET_COLUMNS}
                data={adSetData}
                averages={tableAverages}
                searchable
              />
            </ErrorBoundary>
          )}
        </div>

        {/* ── Ad Table ── */}
        <div>
          <div className={styles.sectionTitle}>🖼️ Ad Breakdown</div>
          {loading ? <TableSkeleton /> : (
            <ErrorBoundary>
              <DataTable
                title="Ads"
                columns={AD_COLUMNS}
                data={adData}
                averages={tableAverages}
                searchable
              />
            </ErrorBoundary>
          )}
        </div>

      </main>
    </div>
  );
}
