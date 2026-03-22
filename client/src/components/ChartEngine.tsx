import React from 'react';
import { Svg, Rect, Line, Text as SvgText, G } from '@react-pdf/renderer';

// ============================================================
// ChartEngine — PricePoint SVG Chart Primitives for @react-pdf/renderer
//
// Design: "Financial Times" data aesthetic
// Palette: Navy (#0A1628), Gold (#DFA81C), Slate (#4A5568)
// Only Bar and Waterfall charts — no pie/donut (renderer limitation)
// ============================================================

const NAVY = '#0A1628';
const GOLD = '#DFA81C';
const SLATE = '#4A5568';
const GRID_COLOR = '#E2E8F0';

// ── Bar Chart ────────────────────────────────────────────────
// Renders a horizontal or vertical bar chart from labels + values.
// Used for: Price Range visualization, Pricing Tier comparison
interface BarChartProps {
    labels: string[];
    values: number[];
    width?: number;
    height?: number;
    barColor?: string;
    highlightIndex?: number; // Index of the bar to highlight in gold
    title?: string;
}

export const BarChart: React.FC<BarChartProps> = ({
    labels,
    values,
    width = 460,
    height = 180,
    barColor = NAVY,
    highlightIndex,
    title,
}) => {
    if (!labels?.length || !values?.length) return null;

    const padding = { top: title ? 30 : 10, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxVal = Math.max(...values, 1);
    const barWidth = Math.min(32, (chartWidth / labels.length) * 0.65);
    const gap = chartWidth / labels.length;

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Title */}
            {title && (
                <SvgText x={padding.left} y={16} style={{ fontSize: 8, fontWeight: 700, fill: NAVY }}>
                    {title}
                </SvgText>
            )}

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const y = padding.top + chartHeight * (1 - frac);
                const label = `$${Math.round(maxVal * frac)}`;
                return (
                    <G key={i}>
                        <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} style={{ stroke: GRID_COLOR, strokeWidth: 0.5 }} />
                        <SvgText x={padding.left - 5} y={y + 3} style={{ fontSize: 6, fill: SLATE, textAnchor: 'end' as any }}>
                            {label}
                        </SvgText>
                    </G>
                );
            })}

            {/* Bars */}
            {values.map((val, i) => {
                const barH = (val / maxVal) * chartHeight;
                const x = padding.left + i * gap + (gap - barWidth) / 2;
                const y = padding.top + chartHeight - barH;
                const fill = highlightIndex === i ? GOLD : barColor;

                return (
                    <G key={i}>
                        <Rect x={x} y={y} width={barWidth} height={barH} style={{ fill }} />
                        {/* Value label on top */}
                        <SvgText x={x + barWidth / 2} y={y - 4} style={{ fontSize: 6, fill: NAVY, textAnchor: 'middle' as any, fontWeight: 600 }}>
                            ${Math.round(val)}
                        </SvgText>
                        {/* Category label below */}
                        <SvgText x={x + barWidth / 2} y={padding.top + chartHeight + 12} style={{ fontSize: 5, fill: SLATE, textAnchor: 'middle' as any }}>
                            {labels[i]?.substring(0, 10)}
                        </SvgText>
                    </G>
                );
            })}

            {/* Baseline */}
            <Line
                x1={padding.left} y1={padding.top + chartHeight}
                x2={width - padding.right} y2={padding.top + chartHeight}
                style={{ stroke: NAVY, strokeWidth: 1 }}
            />
        </Svg>
    );
};

// ── Waterfall Chart ──────────────────────────────────────────
// Renders a waterfall (cascade) chart showing cumulative flow.
// Used for: LTV:CAC breakdown, Unit Economics visualization
interface WaterfallChartProps {
    labels: string[];
    values: number[];
    width?: number;
    height?: number;
    title?: string;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
    labels,
    values,
    width = 460,
    height = 180,
    title,
}) => {
    if (!labels?.length || !values?.length) return null;

    const padding = { top: title ? 30 : 10, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate cumulative positions
    let cumulative = 0;
    const segments = values.map((val, i) => {
        const isLast = i === values.length - 1;
        const start = isLast ? 0 : cumulative;
        const end = isLast ? val : cumulative + val;
        if (!isLast) cumulative += val;
        return { start, end, value: val, isPositive: val >= 0, isLast };
    });

    const allYValues = segments.flatMap(s => [s.start, s.end]);
    const minY = Math.min(0, ...allYValues);
    const maxY = Math.max(1, ...allYValues);
    const range = maxY - minY;

    const barWidth = Math.min(40, (chartWidth / labels.length) * 0.6);
    const gap = chartWidth / labels.length;

    const yScale = (val: number) => padding.top + chartHeight - ((val - minY) / range) * chartHeight;

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Title */}
            {title && (
                <SvgText x={padding.left} y={16} style={{ fontSize: 8, fontWeight: 700, fill: NAVY }}>
                    {title}
                </SvgText>
            )}

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                const val = minY + range * frac;
                const y = yScale(val);
                return (
                    <G key={i}>
                        <Line x1={padding.left} y1={y} x2={width - padding.right} y2={y} style={{ stroke: GRID_COLOR, strokeWidth: 0.5 }} />
                        <SvgText x={padding.left - 5} y={y + 3} style={{ fontSize: 6, fill: SLATE, textAnchor: 'end' as any }}>
                            ${Math.round(val)}
                        </SvgText>
                    </G>
                );
            })}

            {/* Waterfall bars + connectors */}
            {segments.map((seg, i) => {
                const x = padding.left + i * gap + (gap - barWidth) / 2;
                const yTop = yScale(Math.max(seg.start, seg.end));
                const yBot = yScale(Math.min(seg.start, seg.end));
                const barH = Math.max(1, yBot - yTop);
                const fill = seg.isLast ? NAVY : seg.isPositive ? GOLD : '#EF4444';

                return (
                    <G key={i}>
                        <Rect x={x} y={yTop} width={barWidth} height={barH} style={{ fill }} />
                        {/* Value label */}
                        <SvgText x={x + barWidth / 2} y={yTop - 4} style={{ fontSize: 6, fill: NAVY, textAnchor: 'middle' as any, fontWeight: 600 }}>
                            ${Math.round(Math.abs(seg.value))}
                        </SvgText>
                        {/* Connector to next bar */}
                        {i < segments.length - 1 && !segments[i + 1].isLast && (
                            <Line
                                x1={x + barWidth} y1={yScale(seg.end)}
                                x2={padding.left + (i + 1) * gap + (gap - barWidth) / 2} y2={yScale(seg.end)}
                                style={{ stroke: GRID_COLOR, strokeWidth: 0.5, strokeDasharray: '2,2' }}
                            />
                        )}
                        {/* Label */}
                        <SvgText x={x + barWidth / 2} y={padding.top + chartHeight + 12} style={{ fontSize: 5, fill: SLATE, textAnchor: 'middle' as any }}>
                            {labels[i]?.substring(0, 12)}
                        </SvgText>
                    </G>
                );
            })}

            {/* Baseline at 0 */}
            <Line
                x1={padding.left} y1={yScale(0)}
                x2={width - padding.right} y2={yScale(0)}
                style={{ stroke: NAVY, strokeWidth: 1 }}
            />
        </Svg>
    );
};

// ── Multi-Line Revenue Chart ─────────────────────────────────
// Renders a 3-line chart (Conservative / Base / Optimistic)
// Used for: 12-month revenue projection
interface RevenueChartProps {
    labels: string[];
    conservative: number[];
    baseCase: number[];
    optimistic: number[];
    width?: number;
    height?: number;
    title?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
    labels,
    conservative,
    baseCase,
    optimistic,
    width = 460,
    height = 180,
    title,
}) => {
    if (!labels?.length || !conservative?.length) return null;

    const padding = { top: title ? 30 : 10, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const allVals = [...(conservative || []), ...(baseCase || []), ...(optimistic || [])];
    const maxVal = Math.max(...allVals, 1);
    const stepX = chartWidth / Math.max(labels.length - 1, 1);

    const xPos = (i: number) => padding.left + i * stepX;
    const yPos = (val: number) => padding.top + chartHeight - (val / maxVal) * chartHeight;

    // Draw lines as connected segments
    const drawLine = (data: number[], color: string) => {
        if (!data?.length) return null;
        return data.slice(0, -1).map((val, i) => (
            <Line
                key={`${color}-${i}`}
                x1={xPos(i)} y1={yPos(val)}
                x2={xPos(i + 1)} y2={yPos(data[i + 1])}
                style={{ stroke: color, strokeWidth: 1.5 }}
            />
        ));
    };

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {title && (
                <SvgText x={padding.left} y={16} style={{ fontSize: 8, fontWeight: 700, fill: NAVY }}>
                    {title}
                </SvgText>
            )}

            {/* Grid */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                <G key={i}>
                    <Line
                        x1={padding.left} y1={padding.top + chartHeight * (1 - frac)}
                        x2={width - padding.right} y2={padding.top + chartHeight * (1 - frac)}
                        style={{ stroke: GRID_COLOR, strokeWidth: 0.5 }}
                    />
                    <SvgText x={padding.left - 5} y={padding.top + chartHeight * (1 - frac) + 3} style={{ fontSize: 6, fill: SLATE, textAnchor: 'end' as any }}>
                        ${Math.round(maxVal * frac)}
                    </SvgText>
                </G>
            ))}

            {/* Lines */}
            {drawLine(conservative, SLATE)}
            {drawLine(baseCase, NAVY)}
            {drawLine(optimistic, GOLD)}

            {/* X-axis labels */}
            {labels.map((label, i) => (
                <SvgText key={i} x={xPos(i)} y={padding.top + chartHeight + 12} style={{ fontSize: 5, fill: SLATE, textAnchor: 'middle' as any }}>
                    {label}
                </SvgText>
            ))}

            {/* Legend */}
            <Rect x={width - 110} y={padding.top} width={8} height={8} style={{ fill: SLATE }} />
            <SvgText x={width - 98} y={padding.top + 7} style={{ fontSize: 5, fill: SLATE }}>Conservative</SvgText>

            <Rect x={width - 110} y={padding.top + 12} width={8} height={8} style={{ fill: NAVY }} />
            <SvgText x={width - 98} y={padding.top + 19} style={{ fontSize: 5, fill: NAVY }}>Base Case</SvgText>

            <Rect x={width - 110} y={padding.top + 24} width={8} height={8} style={{ fill: GOLD }} />
            <SvgText x={width - 98} y={padding.top + 31} style={{ fontSize: 5, fill: GOLD }}>Optimistic</SvgText>

            {/* Baseline */}
            <Line
                x1={padding.left} y1={padding.top + chartHeight}
                x2={width - padding.right} y2={padding.top + chartHeight}
                style={{ stroke: NAVY, strokeWidth: 1 }}
            />
        </Svg>
    );
};
