/**
 * PlacementBreakdown.jsx
 * Horizontal bar chart showing spend and clicks by ad placement.
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { sumField } from '../utils/aggregators';
import { formatCurrency, formatCompact } from '../utils/formatters';
import styles from '../styles/Charts.module.css';

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#f97316','#ef4444','#ec4899'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: 'var(--shadow-md)', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.fill, marginBottom: 2, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600 }}>
            {p.dataKey === 'spend' ? formatCurrency(p.value) : formatCompact(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PlacementBreakdown({ filteredData }) {
  const chartData = useMemo(() => {
    if (!filteredData?.length) return [];
    const groups = {};
    for (const row of filteredData) {
      const key = row.placement || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    }
    return Object.entries(groups)
      .map(([placement, rows]) => ({
        name: placement,
        spend:      sumField(rows, 'spend'),
        linkClicks: sumField(rows, 'linkClicks'),
      }))
      .filter((d) => d.spend > 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10); // top 10 placements
  }, [filteredData]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>Placement Breakdown</div>
          <div className={styles.chartSubtitle}>Top placements by spend</div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.chartEmpty}>No placement data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(240, chartData.length * 38)}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={130}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="spend" name="Spend" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, idx) => (
                <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
