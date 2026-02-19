import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Package, ChevronRight } from 'lucide-react'; // Imports for Stage 1 defaults
import type { StageConfig } from '../../../data/questions.config';

// ============================================================
// QuestionNode — Neumorphic Form Card for Data Entry
// ============================================================

interface QuestionNodeData {
    config: StageConfig;
    answers?: Record<string, string>;
}

export const QuestionNode = memo(({ data }: NodeProps<QuestionNodeData>) => {
    const { config } = data;
    const [formState, setFormState] = useState<Record<string, string>>({});

    const handleChange = (fieldId: string, value: string) => {
        setFormState((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleNext = () => {
        console.log('Submitting step:', config.id, formState);
        // TODO: Call store action to submit and proceed
    };

    return (
        <div className="relative group">
            {/* Target Handle (Left) */}
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!bg-slate-400 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ top: '50%', transform: 'translateY(-50%)', left: -5 }}
            />

            {/* Main Card — Neumorphic Style */}
            <div className="w-[400px] bg-background-light dark:bg-background-dark shadow-outer rounded-2xl p-6 transition-theme">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-background-light dark:bg-background-dark shadow-outer flex items-center justify-center text-primary">
                        {/* We could dynamically render icon if we map string to component, but hardcoded Package for now or map it if needed. 
                            For simplicity, rendering Package if match, else generic. 
                        */}
                        <Package size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                        {config.title}
                    </h3>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                    {config.fields.map((field) => (
                        <div key={field.id} className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">
                                {field.label}
                            </label>

                            {field.type === 'select' ? (
                                <div className="relative">
                                    <select
                                        className="w-full bg-background-light dark:bg-background-dark shadow-inner rounded-xl px-4 py-3 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                        value={formState[field.id] || ''}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                    >
                                        <option value="" disabled>Select an option</option>
                                        {field.options?.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        ▼
                                    </div>
                                </div>
                            ) : (
                                <input
                                    type={field.type}
                                    className="w-full bg-background-light dark:bg-background-dark shadow-inner rounded-xl px-4 py-3 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                                    placeholder={field.placeholder}
                                    value={formState[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, e.target.value)}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer / Next Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleNext}
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium text-sm active:scale-95"
                    >
                        Next Step
                        <ChevronRight size={16} />
                    </button>
                </div>

            </div>

            {/* Source Handle (Right) - for next connection */}
            <Handle
                type="source"
                position={Position.Right}
                id="right"
                className="!bg-primary !w-3 !h-3 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ top: '50%', transform: 'translateY(-50%)', right: -6 }}
            />
        </div>
    );
});
