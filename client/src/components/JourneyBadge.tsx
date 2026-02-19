import { useSessionStore } from '../store/useSessionStore';
import { Shield, Rocket } from 'lucide-react';

// ============================================================
// JourneyBadge — Persistent badge showing active journey mode
// ============================================================

export const JourneyBadge = () => {
    const journeyType = useSessionStore((s) => s.journeyType);

    if (!journeyType) return null;

    const isAudit = journeyType === 'established_seller';

    const config = isAudit
        ? {
            label: 'AUDIT MODE',
            color: '#B8860B',
            colorRgb: '184, 134, 11',
            Icon: Shield,
        }
        : {
            label: 'STRATEGY MODE',
            color: '#00897B',
            colorRgb: '0, 137, 123',
            Icon: Rocket,
        };

    return (
        <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md animate-fade-in pointer-events-auto"
            style={{
                background: `rgba(${config.colorRgb}, 0.1)`,
                border: `1px solid rgba(${config.colorRgb}, 0.3)`,
            }}
        >
            <config.Icon size={12} style={{ color: config.color }} />
            <span
                className="text-[10px] font-bold tracking-[0.15em]"
                style={{ color: config.color }}
            >
                {config.label}
            </span>
        </div>
    );
};
