import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
    Package,
    Microscope,
    TrendingUp,
    Target,
    Scale,
    Brain,
    Lock,
    Check,
} from 'lucide-react';

// ============================================================
// StageNode — Neumorphic stage card matching the soft UI theme
// ============================================================

interface StageNodeData {
    label: string;
    icon: string;
    stageNumber: number;
    locked: boolean;
    completed: boolean;
}

const ICON_MAP: Record<string, typeof Package> = {
    Package,
    Microscope,
    TrendingUp,
    Target,
    Scale,
    Brain,
};

function StageNodeComponent({ data }: NodeProps<StageNodeData>) {
    const { label, icon, stageNumber, locked, completed } = data;
    const IconComp = ICON_MAP[icon] ?? Package;

    return (
        <div
            className="relative"
            style={{
                opacity: locked ? 0.4 : 1,
                transition: 'opacity 0.4s ease-out',
            }}
        >
            {/* Target handle — top */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className={`!w-1.5 !h-1.5 !border-0 opacity-0 ${completed ? '!bg-emerald-500' : '!bg-slate-400'}`}
                style={{ top: '50%', transform: 'translateY(-50%)', left: -4 }}
            />

            {/* Main card — neumorphic style */}
            <div
                className={`
                    w-56 px-4 py-3 rounded-xl flex items-center gap-3
                    transition-all duration-300 ease-out
                    bg-white dark:bg-gray-800
                    ${completed
                        ? 'shadow-md border border-emerald-200 dark:border-emerald-800'
                        : 'outer-shadow border border-transparent'
                    }
                    ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}
                `}
            >
                {/* Stage number circle */}
                <div
                    className={`
                        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${completed
                            ? 'bg-emerald-100 dark:bg-emerald-900/30'
                            : locked
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : 'inner-shadow'
                        }
                    `}
                >
                    {completed ? (
                        <Check size={14} className="text-emerald-500" />
                    ) : locked ? (
                        <Lock size={12} className="text-gray-400 dark:text-gray-500" />
                    ) : (
                        <span className="text-xs font-bold text-primary">{stageNumber}</span>
                    )}
                </div>

                {/* Label + Icon */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <IconComp
                            size={14}
                            className={completed ? 'text-emerald-500' : locked ? 'text-gray-400' : 'text-primary'}
                        />
                        <span
                            className={`text-sm font-medium truncate ${completed
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : locked
                                    ? 'text-gray-400 dark:text-gray-500'
                                    : 'text-gray-700 dark:text-gray-200'
                                }`}
                        >
                            {label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Source handle — bottom */}
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className={`!w-1.5 !h-1.5 !border-0 opacity-0 ${completed ? '!bg-emerald-500' : '!bg-slate-400'}`}
                style={{ top: '50%', transform: 'translateY(-50%)', right: -4 }}
            />
        </div>
    );
}

export const StageNode = memo(StageNodeComponent);
