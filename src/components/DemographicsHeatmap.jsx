/**
 * DemographicsHeatmap.jsx
 * Grouped bar chart showing spend by Age group and Gender.
 */

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { sumField } from '../utils/aggregators';
import { formatCurrency } from '../utils/formatters';
import styles from '../styles/Charts.module.css';

const GENDER_COLORS = {
  male:    '#6366f1',
  female:  '#ec4899',
  unknown: '#94a3b8',
};

function normalizeGender(g) {
  if (!g) return 'unknown';
  const lower = g.toLowerCase();
  if (lower.includes('male') && !lower.includes('female')) return 'male';
  if (lower.includes('female')) return 'female';
  return 'unknown';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)', padding: '10px 14px',
      boxShadow: 'var(--shadow-md)', fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Age: {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.fill, marginBottom: 2, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span style={{ textTransform: 'capitalize' }}>{p.dataKey}</span>
          <span style={{ fontWeight: 600 }}>{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function DemographicsHeatmap({ filteredData }) {
  const { chartData, genders } = useMemo(() => {
    if (!filteredData?.length) return { chartData: [], genders: [] };

    // Group by age × gender
    const matrix = {};
    const genderSet = new Set();

    for (const row of filteredData) {
      const age = row.age || 'Unknown';
      const gender = normalizeGender(row.gender);
      genderSet.add(gender);

      if (!matrix[age]) matrix[age] = {};
      matrix[age][gender] = (matrix[age][gender] || 0) + (row.spend || 0);
    }

    const genders = [...genderSet].sort();
    const chartData = Object.entries(matrix)
      .map(([age, genderMap]) => ({ age, ...genderMap }))
      .sort((a, b) => a.age.localeCompare(b.age));

    return { chartData, genders };
  }, [filteredData]);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <div>
          <div className={styles.chartTitle}>Demographics Breakdown</div>
          <div className={styles.chartSubtitle}>Spend by Age & Gender</div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.chartEmpty}>No demographic data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="age"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => {
                if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)}M`;
                if (v >= 1_000) return `${(v/1_000).toFixed(0)}K`;
                return v;
              }}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false} tickLine={false} width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{value}</span>
              )}
            />
            {genders.map((gender) => (
              <Bar
                key={gender}
                dataKey={gender}
                name={gender}
                fill={GENDER_COLORS[gender] ?? '#94a3b8'}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
