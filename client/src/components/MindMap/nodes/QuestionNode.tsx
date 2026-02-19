import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import {
    Package, SearchCheck, Rocket, TrendingUp,
    Compass, Users, ChevronRight, Check, Globe,
    Gem, Calculator, Target,
} from 'lucide-react';
import type { StageConfig, QuestionField } from '../../../data/questions.config';
import { STAGE_MAP } from '../../../data/questions.config';
import { useMindMapStore } from '../../../store/useMindMapStore';
import { useSessionStore } from '../../../store/useSessionStore';

// ============================================================
// QuestionNode — Dynamic Question Engine
// ============================================================

interface QuestionNodeData {
    config: StageConfig;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
    Package, SearchCheck, Rocket, TrendingUp,
    Compass, Users, Globe, Gem, Calculator, Target,
};

// ── Neumorphic Slider ────────────────────────────────────────
const SliderField = ({
    field, value, onChange, disabled,
}: {
    field: QuestionField; value: number | undefined; onChange: (v: number) => void; disabled: boolean;
}) => {
    const min = field.min ?? 0;
    const max = field.max ?? 100;
    const displayVal = value ?? min;
    const pct = ((displayVal - min) / (max - min)) * 100;
    const isTouched = value !== undefined;

    return (
        <div className="space-y-3 nodrag">
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{min}{field.unit ?? ''}</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full transition-all ${isTouched
                        ? 'text-primary bg-background-light dark:bg-background-dark outer-shadow'
                        : 'text-slate-400 bg-transparent'
                    }`}>
                    {displayVal}{field.unit ?? ''}
                </span>
                <span className="text-xs text-slate-400">{max}{field.unit ?? ''}</span>
            </div>
            <div className="relative h-2">
                <div className="absolute inset-0 rounded-full inner-shadow" />
                <div
                    className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-150"
                    style={{ width: `${pct}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={field.step ?? 1}
                    value={displayVal}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    disabled={disabled}
                    className="neu-slider absolute inset-0 w-full disabled:opacity-50"
                />
            </div>
        </div>
    );
};

// ── Neumorphic MCQ ───────────────────────────────────────────
const MCQField = ({
    field, value, onChange, disabled,
}: {
    field: QuestionField; value: string; onChange: (v: string) => void; disabled: boolean;
}) => (
    <div className="grid grid-cols-2 gap-3">
        {field.options?.map((opt) => (
            <button
                key={opt}
                onClick={() => !disabled && onChange(opt)}
                disabled={disabled}
                className={`
                    px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-300
                    bg-background-light dark:bg-background-dark
                    disabled:opacity-50
                    ${value === opt
                        ? 'active-pressed text-primary font-bold'
                        : 'hover-in-shadow text-text-light dark:text-text-dark'
                    }
                `}
            >
                {opt}
            </button>
        ))}
    </div>
);

// ── Neumorphic Multi-Select ──────────────────────────────────
const MultiSelectField = ({
    field, value, onChange, disabled,
}: {
    field: QuestionField; value: string[]; onChange: (v: string[]) => void; disabled: boolean;
}) => {
    const toggle = (opt: string) => {
        if (disabled) return;
        const current = value ?? [];
        if (current.includes(opt)) {
            onChange(current.filter((v) => v !== opt));
        } else {
            onChange([...current, opt]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
                const isSelected = (value ?? []).includes(opt);
                return (
                    <button
                        key={opt}
                        onClick={() => toggle(opt)}
                        disabled={disabled}
                        className={`
                            px-3 py-2 rounded-xl text-xs font-medium
                            transition-all duration-300
                            bg-background-light dark:bg-background-dark
                            disabled:opacity-50 flex items-center gap-1.5
                            ${isSelected
                                ? 'active-pressed text-primary font-bold'
                                : 'hover-in-shadow text-text-light dark:text-text-dark'
                            }
                        `}
                    >
                        {isSelected && <Check size={12} className="text-primary" />}
                        {opt}
                    </button>
                );
            })}
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────
export const QuestionNode = memo(({ id, data }: NodeProps<QuestionNodeData>) => {
    const { config } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formState, setFormState] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);

    const submitStage = useMindMapStore((s) => s.submitStage);
    const spawnBranches = useMindMapStore((s) => s.spawnBranches);
    const spawnResult = useMindMapStore((s) => s.spawnResult);
    const addAnswer = useSessionStore((s) => s.addAnswer);
    const completeStage = useSessionStore((s) => s.completeStage);
    const { fitView } = useReactFlow();

    const handleChange = useCallback((fieldId: string, value: unknown) => {
        setFormState((prev) => ({ ...prev, [fieldId]: value }));
    }, []);

    // ── Validation — sliders must be explicitly touched ──────
    const allFieldsFilled = config.fields.every((field) => {
        const val = formState[field.id];
        if (field.type === 'multi-select') return Array.isArray(val) && val.length > 0;
        if (field.type === 'slider') return val !== undefined && val !== null;
        return val !== undefined && val !== null && String(val).trim() !== '';
    });

    const handleNext = useCallback(() => {
        if (!allFieldsFilled || submitted) return;

        // Save answers
        config.fields.forEach((field) => {
            addAnswer(field.id, formState[field.id]);
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completeStage(config.id as any);
        setSubmitted(true);

        // ── Branching vs Linear vs Result ────────────────────
        if (config.branchIds && config.branchIds.length > 0) {
            const branchConfigs = config.branchIds
                .map((bid) => STAGE_MAP[bid])
                .filter(Boolean) as StageConfig[];
            spawnBranches(id, branchConfigs);

            setTimeout(() => {
                const branchNodeIds = branchConfigs.map((c) => ({ id: `stage-${c.id}` }));
                fitView({
                    nodes: [{ id }, ...branchNodeIds],
                    duration: 800,
                    padding: 0.3,
                    maxZoom: 0.6,
                });
            }, 250);
        } else if (config.nextStageId === 'result') {
            spawnResult(id);
            setTimeout(() => {
                fitView({
                    nodes: [{ id: 'result-trinity' }],
                    duration: 800,
                    padding: 0.4,
                    maxZoom: 0.8,
                });
            }, 250);
        } else if (config.nextStageId) {
            const nextConfig = STAGE_MAP[config.nextStageId] ?? null;
            if (nextConfig) {
                submitStage(id, nextConfig);
                setTimeout(() => {
                    fitView({
                        nodes: [{ id: `stage-${nextConfig.id}` }],
                        duration: 800,
                        padding: 0.4,
                        maxZoom: 0.8,
                    });
                }, 250);
            }
        }
    }, [
        allFieldsFilled, submitted, config, formState, id,
        addAnswer, completeStage, submitStage, spawnBranches, spawnResult, fitView,
    ]);

    // ── Render a single field ────────────────────────────────
    const renderField = (field: QuestionField) => {
        const val = formState[field.id];

        switch (field.type) {
            case 'slider':
                return (
                    <SliderField
                        field={field}
                        value={val}
                        onChange={(v) => handleChange(field.id, v)}
                        disabled={submitted}
                    />
                );
            case 'mcq':
                return (
                    <MCQField
                        field={field}
                        value={val ?? ''}
                        onChange={(v) => handleChange(field.id, v)}
                        disabled={submitted}
                    />
                );
            case 'multi-select':
                return (
                    <MultiSelectField
                        field={field}
                        value={val ?? []}
                        onChange={(v) => handleChange(field.id, v)}
                        disabled={submitted}
                    />
                );
            case 'select':
                return (
                    <div className="relative">
                        <select
                            className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-xl px-4 py-3 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                            value={val ?? ''}
                            onChange={(e) => handleChange(field.id, e.target.value)}
                            disabled={submitted}
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
                );
            default:
                return (
                    <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-xl px-4 py-3 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400 disabled:opacity-50"
                        placeholder={field.placeholder}
                        value={val ?? ''}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        disabled={submitted}
                    />
                );
        }
    };

    const IconComp = ICON_MAP[config.icon] ?? Package;

    // ── Button label ─────────────────────────────────────────
    const buttonLabel = config.branchIds ? 'Analyze'
        : config.nextStageId === 'result' ? 'Calculate Price'
            : config.nextStageId ? 'Next Step'
                : 'Complete';

    return (
        <div className="relative group">
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!bg-slate-400 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ top: '50%', transform: 'translateY(-50%)', left: -5 }}
            />

            {/* Main Card — gold ring when completed */}
            <div className={`
                w-[400px] bg-background-light dark:bg-background-dark
                outer-shadow-lg rounded-2xl p-6 transition-all duration-300
                ${submitted ? 'ring-2 ring-primary' : ''}
            `}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        transition-all duration-300
                        ${submitted
                            ? 'bg-primary text-white'
                            : 'bg-background-light dark:bg-background-dark outer-shadow text-primary'
                        }
                    `}>
                        <IconComp size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                        {config.title}
                    </h3>
                    {submitted && (
                        <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary">
                            <Check size={14} /> Done
                        </div>
                    )}
                </div>

                {/* Dynamic Fields */}
                <div className="space-y-5">
                    {config.fields.map((field) => (
                        <div key={field.id} className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1">
                                {field.label}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-8 flex justify-end">
                    {submitted ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-primary px-4 py-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <Check size={12} />
                            </span>
                            Branch Complete
                        </div>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!allFieldsFilled}
                            className={`px-6 py-2.5 rounded-full transition-all flex items-center gap-2 font-medium text-sm active:scale-95 ${allFieldsFilled
                                    ? 'bg-primary hover:bg-primary-dark text-white outer-shadow cursor-pointer'
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {buttonLabel}
                            <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>

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
