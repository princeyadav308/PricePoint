import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

// ============================================================
// RootNode — Central Neumorphic "PricePoint" node
// ============================================================

function RootNodeComponent(_props: NodeProps) {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full outer-shadow-lg bg-background-light dark:bg-background-dark"></div>

            {/* Inner Ring */}
            <div className="absolute inset-4 rounded-full inner-shadow bg-background-light dark:bg-background-dark border-4 border-transparent dark:border-gray-700/20"></div>

            {/* Content — just PRICEPOINT, centered and bold */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-1 bg-primary mb-3 rounded-full shadow-sm"></div>
                <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-widest">
                    PRICEPOINT
                </h2>
            </div>

            {/* Decorators */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 dark:bg-gray-600 rounded-r shadow-sm opacity-50"></div>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 dark:bg-gray-600 rounded-l shadow-sm opacity-50"></div>

            {/* Source handle — bottom */}
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!bg-primary !w-3 !h-3 !border-0"
                style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
            />
        </div>
    );
}

export const RootNode = memo(RootNodeComponent);
