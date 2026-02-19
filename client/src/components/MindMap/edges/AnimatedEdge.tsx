import { memo } from 'react';
import { getBezierPath, type EdgeProps } from 'reactflow';

// ============================================================
// AnimatedEdge — Neumorphic Bezier Curve
//
// Color priority:
//   1. style.stroke  (e.g. Navy '#002147' set directly on the edge)
//   2. data.color    (key into COLOR_MAP for named journey colors)
//   3. gold fallback
// ============================================================

const COLOR_MAP: Record<string, string> = {
    gold: '#B8860B',
    blue: '#2563EB',
    teal: '#0F766E',
    navy: '#002147',
    inactive: '#CBD5E1',
};

function AnimatedEdgeComponent({
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    style = {},
}: EdgeProps) {
    if (
        sourceX === undefined ||
        sourceY === undefined ||
        targetX === undefined ||
        targetY === undefined
    ) {
        return null;
    }

    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        curvature: 0.45,
    });

    // ── 3-tier color resolution ──────────────────────────────
    const resolvedColor =
        ((style as React.CSSProperties).stroke as string | undefined) ??
        COLOR_MAP[data?.color ?? 'gold'] ??
        COLOR_MAP.gold;

    const resolvedWidth =
        ((style as React.CSSProperties).strokeWidth as number | undefined) ?? 1.5;

    // Neumorphic drop-shadow — makes the edge feel like it's floating
    // above the light-gray workspace, matching card shadows
    const dropShadow = `drop-shadow(0px 2px 4px rgba(0,0,0,0.10))`;

    return (
        <g>
            {/* Outer glow — wide, very faint */}
            <path
                d={edgePath}
                fill="none"
                stroke={resolvedColor}
                strokeWidth={resolvedWidth * 4}
                strokeOpacity={0.07}
                strokeLinecap="round"
            />

            {/* Main line */}
            <path
                id={id}
                d={edgePath}
                fill="none"
                stroke={resolvedColor}
                strokeWidth={resolvedWidth}
                strokeOpacity={0.8}
                strokeDasharray="5 5"
                strokeLinecap="round"
                style={{
                    filter: dropShadow,
                    animation: 'flow-dash 1s linear infinite',
                }}
            />

            {/* Travelling dot */}
            <circle r={resolvedWidth} fill={resolvedColor} opacity={0.9}>
                <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
            </circle>
        </g>
    );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);
