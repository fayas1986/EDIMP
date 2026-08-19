import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export type SparklineTimeHorizon = '1h' | '6h' | '12h' | '24h';

export interface ErrorTrajectorySparklineProps {
  data: number[]; // hourly or sub-hourly data points
  status: 'Critical' | 'Warning' | 'Info' | 'Healthy';
  timeHorizon?: SparklineTimeHorizon; // '1h' | '6h' | '12h' | '24h'
  width?: number;
  height?: number;
  showMinMax?: boolean;
  showTrendBadge?: boolean;
  showStartEndLabels?: boolean;
  compact?: boolean;
  interactive?: boolean;
  className?: string;
  idPrefix?: string;
}

export const ErrorTrajectorySparkline: React.FC<ErrorTrajectorySparklineProps> = ({
  data = [],
  status,
  timeHorizon = '24h',
  width = 84,
  height = 26,
  showMinMax = false,
  showTrendBadge = false,
  showStartEndLabels = false,
  compact = false,
  interactive = true,
  className = '',
  idPrefix = 'sparkline',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Fallback if data is empty
  const safeData = data.length > 0 ? data : [1, 1.2, 1.1, 1.5, 1.8, 2.0, 1.9, 2.2];
  const count = safeData.length;

  const minVal = Math.min(...safeData);
  const maxVal = Math.max(...safeData);
  const startVal = safeData[0];
  const endVal = safeData[count - 1];
  const deltaVal = +(endVal - startVal).toFixed(2);
  const isRising = deltaVal > 0.05;
  const isFalling = deltaVal < -0.05;

  // Compute realistic time offset label based on timeHorizon
  const getTimeOffsetLabel = (index: number) => {
    if (index === count - 1) return 'Now';
    const remainingSteps = count - 1 - index;
    const ratio = remainingSteps / (count - 1);

    if (timeHorizon === '1h') {
      const minutesAgo = Math.round(ratio * 60);
      return `-${minutesAgo}m`;
    }
    if (timeHorizon === '6h') {
      const hoursAgo = +(ratio * 6).toFixed(1);
      return `-${hoursAgo}h`;
    }
    if (timeHorizon === '12h') {
      const hoursAgo = Math.round(ratio * 12);
      return `-${hoursAgo}h`;
    }
    // 24h default
    const hoursAgo = Math.round(ratio * 24);
    return `-${hoursAgo}h`;
  };

  // Visual Theme mapping based on Status
  const getTheme = () => {
    switch (status) {
      case 'Critical':
        return {
          stroke: '#e11d48', // rose-600
          fillGradientStart: 'rgba(244, 63, 94, 0.45)', // rose-500
          fillGradientEnd: 'rgba(244, 63, 94, 0.02)',
          dotBg: '#e11d48',
          dotRing: '#ffe4e6',
          textClass: 'text-rose-600',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'Warning':
        return {
          stroke: '#d97706', // amber-600
          fillGradientStart: 'rgba(245, 158, 11, 0.40)', // amber-500
          fillGradientEnd: 'rgba(245, 158, 11, 0.02)',
          dotBg: '#d97706',
          dotRing: '#fef3c7',
          textClass: 'text-amber-600',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'Info':
        return {
          stroke: '#0284c7', // sky-600
          fillGradientStart: 'rgba(14, 165, 233, 0.35)', // sky-500
          fillGradientEnd: 'rgba(14, 165, 233, 0.02)',
          dotBg: '#0284c7',
          dotRing: '#e0f2fe',
          textClass: 'text-sky-600',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
        };
      case 'Healthy':
      default:
        return {
          stroke: '#059669', // emerald-600
          fillGradientStart: 'rgba(16, 185, 129, 0.35)', // emerald-500
          fillGradientEnd: 'rgba(16, 185, 129, 0.02)',
          dotBg: '#059669',
          dotRing: '#d1fae5',
          textClass: 'text-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
    }
  };

  const theme = getTheme();
  const paddingX = compact ? 2 : 4;
  const paddingY = compact ? 3 : 4;

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const valueRange = maxVal - minVal || 0.5;

  // Calculate coordinates for points
  const points = safeData.map((val, i) => {
    const x = paddingX + (i / (count - 1)) * innerWidth;
    const y = paddingY + innerHeight - ((val - minVal) / valueRange) * innerHeight;
    return { x, y, val, timeLabel: getTimeOffsetLabel(i) };
  });

  // Construct SVG Path
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  // Area closed path for gradient fill under the sparkline
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath = `${linePath} L ${lastPt.x},${height} L ${firstPt.x},${height} Z`;

  const gradientId = `sparkline-grad-${idPrefix}-${status.toLowerCase()}-${timeHorizon}`;

  // Hovered point coordinates
  const activePt = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      title={`${timeHorizon} Error Rate Trajectory: ${startVal.toFixed(2)}% (-${timeHorizon}) → ${endVal.toFixed(2)}% (Now) | Range: [${minVal.toFixed(2)}% - ${maxVal.toFixed(2)}%]`}
    >
      <div className="relative flex items-center">
        <svg
          width={width}
          height={height}
          className="overflow-visible"
          onMouseLeave={() => interactive && setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.fillGradientStart} />
              <stop offset="100%" stopColor={theme.fillGradientEnd} />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#${gradientId})`} />

          {/* Sparkline Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={theme.stroke}
            strokeWidth={compact ? 1.5 : 2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Endpoint Pulse Dot on Latest Reading */}
          {points.length > 0 && (
            <g>
              {(status === 'Critical' || status === 'Warning') && (
                <circle
                  cx={lastPt.x}
                  cy={lastPt.y}
                  r={compact ? 3.5 : 4.5}
                  fill={theme.stroke}
                  opacity="0.3"
                  className="animate-ping"
                />
              )}
              <circle
                cx={lastPt.x}
                cy={lastPt.y}
                r={compact ? 2 : 2.5}
                fill={theme.dotBg}
                stroke="#ffffff"
                strokeWidth={1}
              />
            </g>
          )}

          {/* Interactive Mouse Hover Overlay & Marker */}
          {interactive && (
            <g>
              {points.map((pt, i) => (
                <rect
                  key={i}
                  x={pt.x - innerWidth / (count * 2)}
                  y={0}
                  width={innerWidth / count}
                  height={height}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              ))}

              {activePt && (
                <g>
                  {/* Vertical Guide Line */}
                  <line
                    x1={activePt.x}
                    y1={0}
                    x2={activePt.x}
                    y2={height}
                    stroke="#94a3b8"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  {/* Highlight Circle */}
                  <circle
                    cx={activePt.x}
                    cy={activePt.y}
                    r={3.5}
                    fill={theme.dotBg}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Hover Micro Tooltip Pill */}
        {activePt && (
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-30 flex items-center gap-1"
          >
            <span>{activePt.timeLabel}:</span>
            <span className="text-amber-300">{activePt.val.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {/* Optional Range Labels (Min / Max or Trajectory Delta) */}
      {(showMinMax || showStartEndLabels || showTrendBadge) && (
        <div className="w-full flex items-center justify-between text-[9px] font-mono text-slate-500 mt-0.5 leading-none">
          {showStartEndLabels && (
            <>
              <span className="opacity-75">{startVal.toFixed(1)}%</span>
              <span className="text-slate-300">→</span>
              <span className={`font-bold ${theme.textClass}`}>{endVal.toFixed(1)}%</span>
            </>
          )}

          {showMinMax && !showStartEndLabels && (
            <>
              <span className="text-[8.5px] opacity-70">L: {minVal.toFixed(1)}%</span>
              <span className="text-[8.5px] opacity-70">H: {maxVal.toFixed(1)}%</span>
            </>
          )}

          {showTrendBadge && (
            <div
              className={`inline-flex items-center gap-0.5 px-1 py-0.2 rounded border text-[8.5px] font-bold ${theme.badgeBg}`}
            >
              {isRising ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : isFalling ? (
                <TrendingDown className="w-2.5 h-2.5" />
              ) : (
                <Minus className="w-2.5 h-2.5" />
              )}
              <span>{deltaVal > 0 ? `+${deltaVal}%` : `${deltaVal}%`} ({timeHorizon})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
