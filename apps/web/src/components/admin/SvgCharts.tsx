"use client";

import React, { useMemo } from "react";

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  valueFormatter?: (val: number) => string;
}

export function LineChart({
  data,
  height = 200,
  strokeColor = "#15803d", // forest-700
  fillColor = "rgba(21, 128, 61, 0.1)",
  valueFormatter = (val) => String(val),
}: LineChartProps) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  const maxVal = useMemo(() => {
    if (points.length === 0) return 100;
    const max = Math.max(...points.map((p) => p.value));
    return max === 0 ? 100 : max * 1.15; // 15% padding
  }, [points]);

  const minVal = 0;

  const chartHeight = height - 40;
  const chartWidth = 500;

  const svgPoints = useMemo(() => {
    if (points.length === 0) return "";
    const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
    return points
      .map((p, idx) => {
        const x = idx * stepX;
        const y = chartHeight - ((p.value - minVal) / (maxVal - minVal)) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
  }, [points, maxVal, chartHeight]);

  const areaPoints = useMemo(() => {
    if (points.length === 0) return "";
    const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;
    const path = points
      .map((p, idx) => {
        const x = idx * stepX;
        const y = chartHeight - ((p.value - minVal) / (maxVal - minVal)) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
    return `0,${chartHeight} ${path} ${chartWidth},${chartHeight}`;
  }, [points, maxVal, chartHeight]);

  if (points.length === 0) {
    return (
      <div className="w-full flex items-center justify-center bg-cream-50/50 rounded-xl border border-dashed border-ink-200" style={{ height }}>
        <p className="text-xs text-ink-400 font-bold uppercase tracking-wider">No chart data available</p>
      </div>
    );
  }

  const stepX = points.length > 1 ? chartWidth / (points.length - 1) : chartWidth;

  return (
    <div className="w-full space-y-2">
      <div className="relative overflow-visible">
        <svg
          viewBox={`-20 -10 ${chartWidth + 40} ${height}`}
          className="w-full overflow-visible"
          style={{ maxHeight: height }}
          aria-label="Interactive line graph trend chart"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = chartHeight * pct;
            const labelValue = maxVal - (maxVal - minVal) * pct;
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#E8E8E6"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <text
                  x={-8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#787876"
                  className="text-[8px] font-bold font-mono"
                >
                  {valueFormatter(labelValue)}
                </text>
              </g>
            );
          })}

          {/* Filled Area */}
          <polygon points={areaPoints} fill="url(#lineGrad)" />

          {/* Line Path */}
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.5}
            points={svgPoints}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Nodes / Markers */}
          {points.map((p, idx) => {
            const x = idx * stepX;
            const y = chartHeight - ((p.value - minVal) / (maxVal - minVal)) * chartHeight;
            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#FFFFFF"
                  stroke={strokeColor}
                  strokeWidth={2}
                  className="hover:r-6 transition-all"
                />
                {/* Tooltip trigger hover label */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <rect
                    x={x - 45}
                    y={y - 25}
                    width={90}
                    height={18}
                    rx={4}
                    fill="#1A2B1A"
                  />
                  <text
                    x={x}
                    y={y - 13}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    className="text-[8px] font-bold font-mono"
                  >
                    {valueFormatter(p.value)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {points.map((p, idx) => {
            // Show maximum of 7 labels to prevent overlap
            const interval = Math.ceil(points.length / 7);
            if (idx % interval !== 0 && idx !== points.length - 1) return null;
            const x = idx * stepX;
            return (
              <text
                key={idx}
                x={x}
                y={chartHeight + 18}
                textAnchor="middle"
                fill="#787876"
                className="text-[9px] font-bold uppercase tracking-wider"
              >
                {p.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  barColor?: string;
  valueFormatter?: (val: number) => string;
}

export function BarChart({
  data,
  height = 200,
  barColor = "#15803d",
  valueFormatter = (val) => String(val),
}: BarChartProps) {
  const points = useMemo(() => data || [], [data]);

  const maxVal = useMemo(() => {
    if (points.length === 0) return 100;
    const max = Math.max(...points.map((p) => p.value));
    return max === 0 ? 100 : max * 1.15;
  }, [points]);

  const chartHeight = height - 40;
  const chartWidth = 500;

  if (points.length === 0) {
    return (
      <div className="w-full flex items-center justify-center bg-cream-50/50 rounded-xl border border-dashed border-ink-200" style={{ height }}>
        <p className="text-xs text-ink-400 font-bold uppercase tracking-wider">No bar chart data available</p>
      </div>
    );
  }

  const gap = 16;
  const totalGapsWidth = gap * (points.length - 1);
  const barWidth = (chartWidth - totalGapsWidth) / points.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`-20 -10 ${chartWidth + 40} ${height}`}
        className="w-full overflow-visible"
        style={{ maxHeight: height }}
        aria-label="Interactive bar graph"
      >
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
          const y = chartHeight * pct;
          const labelValue = maxVal - maxVal * pct;
          return (
            <g key={idx} className="opacity-40">
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#E8E8E6"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <text
                x={-8}
                y={y + 3}
                textAnchor="end"
                fill="#787876"
                className="text-[8px] font-bold font-mono"
              >
                {valueFormatter(labelValue)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {points.map((p, idx) => {
          const x = idx * (barWidth + gap);
          const barHeight = (p.value / maxVal) * chartHeight;
          const y = chartHeight - barHeight;

          return (
            <g key={idx} className="group cursor-pointer">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                fill={barColor}
                rx={Math.min(barWidth / 4, 4)}
                className="transition-all hover:brightness-95"
              />
              {/* Value hover tooltip */}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fill="#1A2B1A"
                className="text-[8px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {valueFormatter(p.value)}
              </text>
              {/* X Axis label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 18}
                textAnchor="middle"
                fill="#787876"
                className="text-[9px] font-bold uppercase tracking-wider"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

interface DonutChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  data: DonutChartDataPoint[];
  size?: number;
  valueFormatter?: (val: number) => string;
}

export function DonutChart({
  data,
  size = 180,
  valueFormatter = (val) => String(val),
}: DonutChartProps) {
  const points = useMemo(() => data || [], [data]);

  const total = useMemo(() => {
    return points.reduce((sum, p) => sum + p.value, 0);
  }, [points]);

  const segments = useMemo(() => {
    let cumulativeAngle = 0;
    const colors = [
      "#15803d", // forest-700
      "#eab308", // yellow-500
      "#f97316", // orange-500
      "#ef4444", // red-500
      "#3b82f6", // blue-500
      "#a855f7", // purple-500
    ];

    if (total === 0) return [];

    return points.map((p, idx) => {
      const percentage = p.value / total;
      const angle = percentage * 360;
      const startAngle = cumulativeAngle;
      cumulativeAngle += angle;

      // Coordinate conversions
      const radius = 50;
      const x1 = 50 + radius * Math.cos((startAngle - 90) * (Math.PI / 180));
      const y1 = 50 + radius * Math.sin((startAngle - 90) * (Math.PI / 180));
      const x2 = 50 + radius * Math.cos((cumulativeAngle - 90) * (Math.PI / 180));
      const y2 = 50 + radius * Math.sin((cumulativeAngle - 90) * (Math.PI / 180));

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;

      return {
        path: pathData,
        color: p.color || colors[idx % colors.length],
        label: p.label,
        value: p.value,
        percentage: (percentage * 100).toFixed(1),
      };
    });
  }, [points, total]);

  if (total === 0) {
    return (
      <div className="w-full flex items-center justify-center bg-cream-50/50 rounded-xl border border-dashed border-ink-200" style={{ height: size }}>
        <p className="text-xs text-ink-400 font-bold uppercase tracking-wider">No distribution data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      <div style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 overflow-visible">
          {segments.map((seg, idx) => (
            <path
              key={idx}
              d={seg.path}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
              className="hover:stroke-[24] transition-all cursor-pointer"
            >
              <title>{`${seg.label}: ${valueFormatter(seg.value)} (${seg.percentage}%)`}</title>
            </path>
          ))}
          {/* Donut Center */}
          <circle cx="50" cy="50" r="30" fill="#FFFFFF" />
          <text
            x="50"
            y="48"
            textAnchor="middle"
            fill="#787876"
            className="text-[6px] font-bold uppercase tracking-widest"
            transform="rotate(90 50 50)"
          >
            Total
          </text>
          <text
            x="50"
            y="57"
            textAnchor="middle"
            fill="#1A2B1A"
            className="text-[8px] font-extrabold font-mono"
            transform="rotate(90 50 50)"
          >
            {valueFormatter(total)}
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex-1 space-y-2">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-ink-600 font-semibold truncate max-w-[120px]">{seg.label}</span>
            <span className="text-ink-400 ml-auto font-mono text-[10px]">{valueFormatter(seg.value)}</span>
            <span className="text-forest-700 font-bold font-mono text-[10px] bg-forest-50 px-1.5 py-0.5 rounded-md">
              {seg.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
