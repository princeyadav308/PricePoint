import { memo, useCallback } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from 'reactflow';
import { SearchCheck, Rocket, ArrowRight } from 'lucide-react';
import { useSessionStore } from '../../../store/useSessionStore';
import { useMindMapStore } from '../../../store/useMindMapStore';
import type { JourneyType } from '../../../types/session';

// ============================================================
// JourneyNode — passes its own node.id to expandJourney
// ============================================================

interface JourneyNodeData {
    type: 'established' | 'new';
    selected: boolean;
    dimmed?: boolean;
    label: string;
    subtitle: string;
}

const JOURNEY_CONFIG = {
    established: {
        journeyType: 'established_seller' as JourneyType,
        Icon: SearchCheck,
        iconColor: 'text-teal-600 dark:text-teal-400',
    },
    new: {
        journeyType: 'new_launcher' as JourneyType,
        Icon: Rocket,
        iconColor: 'text-secondary',
    },
};

function JourneyNodeComponent({ id, data }: NodeProps<JourneyNodeData>) {
    const { type, selected, dimmed, label, subtitle } = data;
    const config = JOURNEY_CONFIG[type];
    const { Icon, iconColor } = config;

    const setJourneyType = useSessionStore((s) => s.setJourneyType);
    const expandJourney = useMindMapStore((s) => s.expandJourney);
    const isExpanded = useMindMapStore((s) => s.isExpanded);
    const { fitView } = useReactFlow();

    const handleClick = useCallback(() => {
        if (isExpanded) return;
        setJourneyType(config.journeyType);
        expandJourney(id); // Pass node ID — "Calculate-First" reads position from store

        // Pan camera to the new classification card after it renders
        setTimeout(() => {
            fitView({
                nodes: [{ id: 'stage-1' }],
                duration: 800,
                padding: 0.4,
                maxZoom: 0.8,
            });
        }, 200);
    }, [id, isExpanded, setJourneyType, expandJourney, fitView, config.journeyType]);

    return (
        <div
            className={`
                relative w-80 rounded-2xl
                bg-background-light dark:bg-background-dark
                flex flex-col justify-between p-6
                transition-all duration-300 group cursor-pointer
                ${selected ? 'active-pressed' : 'hover-in-shadow-lg'}
                ${dimmed ? 'opacity-30 grayscale pointer-events-none' : ''}
            `}
            onClick={handleClick}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!bg-slate-400 !w-2 !h-2 !border-0 opacity-0"
                style={{ top: '50%', transform: 'translateY(-50%)', left: -5 }}
            />

            <div className="flex items-start gap-4">
                <div className={`inner-shadow w-12 h-12 rounded-xl flex items-center justify-center ${iconColor} flex-shrink-0`}>
                    <Icon size={24} strokeWidth={2} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                        {label}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="flex justify-end items-end mt-4">
                <ArrowRight className="text-gray-400 dark:text-gray-500 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>

            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!bg-slate-400 !w-2 !h-2 !border-0 opacity-0"
                style={{ right: -5, top: '50%', transform: 'translateY(-50%)' }}
            />
        </div>
    );
}

export const JourneyNode = memo(JourneyNodeComponent);
