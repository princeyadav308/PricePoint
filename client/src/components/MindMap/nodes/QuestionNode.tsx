import { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import {
    Package, SearchCheck, Rocket, TrendingUp,
    Compass, Users, ChevronRight, Check, Globe,
    Gem, Calculator, Target, FileText, Boxes,
    Briefcase, Monitor, Receipt, Plus, Trash2, BarChart3,
    Lightbulb, X,
} from 'lucide-react';
import type { StageConfig, QuestionField, UnitEconomicsRow } from '../../../data/questions.config';
import { STAGE_MAP, PRODUCT_TYPE_TO_DEEP_DIVE } from '../../../data/questions.config';
import { useMindMapStore } from '../../../store/useMindMapStore';
import { useSessionStore } from '../../../store/useSessionStore';
import type { SessionStage } from '../../../types/session';

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
    FileText, Boxes, Briefcase, Monitor, Receipt,
    BarChart3,
};

// ── N/A sentinel value ───────────────────────────────────────
const NA_VALUE = '__NA__';

// Branch IDs that must all complete before convergence spawns
const CONVERGENCE_BRANCHES: SessionStage[] = ['market_research', 'distribution', 'psychological'];

// ── Help Tip (lightbulb toggle) ──────────────────────────────
const HelpTip = ({
    helpText: _helpText, expanded, onToggle,
}: {
    helpText: string; expanded: boolean; onToggle: () => void;
}) => (
    <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`
            w-5 h-5 rounded-full flex items-center justify-center
            transition-all duration-300 flex-shrink-0
            ${expanded
                ? 'bg-primary text-white scale-110'
                : 'bg-background-light dark:bg-background-dark outer-shadow text-amber-500 hover:text-primary'
            }
        `}
    >
        <Lightbulb size={11} />
    </button>
);

// ── N/A Toggle ───────────────────────────────────────────────
const NAToggle = ({
    active, onToggle, disabled,
}: {
    active: boolean; onToggle: () => void; disabled: boolean;
}) => (
    <button
        onClick={(e) => { e.stopPropagation(); if (!disabled) onToggle(); }}
        disabled={disabled}
        className={`
            px-2 py-0.5 rounded-full text-[10px] font-bold
            transition-all duration-300 flex-shrink-0 leading-none
            ${active
                ? 'bg-slate-400 text-white'
                : 'bg-background-light dark:bg-background-dark outer-shadow text-slate-400 hover:text-slate-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
        `}
    >
        N/A
    </button>
);

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
    <div className="grid grid-cols-2 gap-2">
        {field.options?.map((opt) => (
            <button
                key={opt}
                onClick={() => !disabled && onChange(opt)}
                disabled={disabled}
                className={`
                    px-3 py-2 rounded-xl text-xs font-medium
                    transition-all duration-300
                    bg-background-light dark:bg-background-dark
                    disabled:opacity-50 text-left
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

// ── Neumorphic Multi-Select (with optional custom options) ───
const MultiSelectField = ({
    field, value, onChange, disabled,
}: {
    field: QuestionField; value: string[]; onChange: (v: string[]) => void; disabled: boolean;
}) => {
    const [customInput, setCustomInput] = useState('');
    const [customOptions, setCustomOptions] = useState<string[]>([]);
    const allOptions = [...(field.options ?? []), ...customOptions];

    const toggle = (opt: string) => {
        if (disabled) return;
        const current = value ?? [];
        if (current.includes(opt)) {
            onChange(current.filter((v) => v !== opt));
        } else {
            onChange([...current, opt]);
        }
    };

    const addCustom = () => {
        const trimmed = customInput.trim();
        if (!trimmed || allOptions.includes(trimmed)) return;
        setCustomOptions((prev) => [...prev, trimmed]);
        onChange([...(value ?? []), trimmed]);
        setCustomInput('');
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {allOptions.map((opt) => {
                    const isSelected = (value ?? []).includes(opt);
                    const isCustom = customOptions.includes(opt);
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
                            {isCustom && !disabled && (
                                <X
                                    size={10}
                                    className="text-slate-400 hover:text-red-400 ml-0.5"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCustomOptions((prev) => prev.filter((o) => o !== opt));
                                        onChange((value ?? []).filter((v) => v !== opt));
                                    }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Custom option input */}
            {field.allowCustom && !disabled && (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        className="flex-1 bg-background-light dark:bg-background-dark inner-shadow rounded-xl px-3 py-2 text-xs text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                        placeholder="Add your own…"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={addCustom}
                        disabled={!customInput.trim()}
                        className={`
                            w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                            transition-all duration-300
                            ${customInput.trim()
                                ? 'bg-primary text-white outer-shadow hover:bg-primary-dark'
                                : 'bg-background-light dark:bg-background-dark outer-shadow text-slate-400 cursor-not-allowed'
                            }
                        `}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ── Textarea Field ───────────────────────────────────────────
const TextareaField = ({
    field, value, onChange, disabled,
}: {
    field: QuestionField; value: string; onChange: (v: string) => void; disabled: boolean;
}) => (
    <textarea
        className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-xl px-4 py-3 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400 disabled:opacity-50 resize-none min-h-[140px] nodrag"
        placeholder={field.placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={disabled}
        rows={6}
    />
);

// ── Unit Economics Table ─────────────────────────────────────
interface UnitEconRow {
    id: string;
    label: string;
    value: string;
    isCustom?: boolean;
}

const UnitEconomicsField = ({
    field, value, onChange, disabled,
}: {
    field: QuestionField;
    value: UnitEconRow[] | undefined;
    onChange: (v: UnitEconRow[]) => void;
    disabled: boolean;
}) => {
    // Initialize from defaultRows if no value yet
    const rows: UnitEconRow[] = value ?? (field.defaultRows ?? []).map((r: UnitEconomicsRow) => ({
        id: r.id,
        label: r.label,
        value: '',
        isCustom: false,
    }));

    const updateRow = (index: number, updates: Partial<UnitEconRow>) => {
        if (disabled) return;
        const updated = rows.map((row, i) => i === index ? { ...row, ...updates } : row);
        onChange(updated);
    };

    const addRow = () => {
        if (disabled) return;
        const newRow: UnitEconRow = {
            id: `custom_${Date.now()}`,
            label: '',
            value: '',
            isCustom: true,
        };
        onChange([...rows, newRow]);
    };

    const removeRow = (index: number) => {
        if (disabled) return;
        onChange(rows.filter((_, i) => i !== index));
    };

    const total = rows.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);

    return (
        <div className="space-y-1 nodrag">
            {/* Header */}
            <div className="flex items-center px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span className="flex-1">Expense</span>
                <span className="w-24 text-right">Cost</span>
                <span className="w-8" />
            </div>

            {/* Rows */}
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {rows.map((row, index) => (
                    <div
                        key={row.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-light dark:bg-background-dark inner-shadow"
                    >
                        {row.isCustom ? (
                            <input
                                type="text"
                                className="flex-1 bg-transparent text-xs text-text-light dark:text-text-dark outline-none placeholder:text-slate-400"
                                placeholder="Expense name"
                                value={row.label}
                                onChange={(e) => updateRow(index, { label: e.target.value })}
                                onPointerDown={(e) => e.stopPropagation()}
                                disabled={disabled}
                            />
                        ) : (
                            <span className="flex-1 text-xs text-text-light dark:text-text-dark truncate">
                                {row.label}
                            </span>
                        )}
                        <input
                            type="number"
                            className="w-24 bg-transparent text-xs text-right text-text-light dark:text-text-dark outline-none placeholder:text-slate-400 font-medium"
                            placeholder={
                                (field.defaultRows ?? []).find((d: UnitEconomicsRow) => d.id === row.id)?.placeholder ?? '0.00'
                            }
                            value={row.value}
                            onChange={(e) => updateRow(index, { value: e.target.value })}
                            onPointerDown={(e) => e.stopPropagation()}
                            disabled={disabled}
                        />
                        {row.isCustom && !disabled && (
                            <button
                                onClick={() => removeRow(index)}
                                className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                        {!row.isCustom && <span className="w-8" />}
                    </div>
                ))}
            </div>

            {/* Add Row Button */}
            {!disabled && (
                <button
                    onClick={addRow}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-primary hover-in-shadow bg-background-light dark:bg-background-dark transition-all duration-300"
                >
                    <Plus size={14} />
                    Add Expense
                </button>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl outer-shadow bg-background-light dark:bg-background-dark mt-2">
                <span className="text-sm font-bold text-text-light dark:text-text-dark">Total Cost</span>
                <span className="text-sm font-bold text-primary">
                    {total.toFixed(2)}
                </span>
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────
export const QuestionNode = memo(({ id, data }: NodeProps<QuestionNodeData>) => {
    const { config } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formState, setFormState] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);
    const [naFields, setNaFields] = useState<Set<string>>(new Set());
    const [helpExpanded, setHelpExpanded] = useState<Set<string>>(new Set());

    const submitStage = useMindMapStore((s) => s.submitStage);
    const spawnBranches = useMindMapStore((s) => s.spawnBranches);
    const spawnResult = useMindMapStore((s) => s.spawnResult);
    const spawnConvergence = useMindMapStore((s) => s.spawnConvergence);
    const addAnswer = useSessionStore((s) => s.addAnswer);
    const completeStage = useSessionStore((s) => s.completeStage);
    const sessionAnswers = useSessionStore((s) => s.answers);
    const { fitView } = useReactFlow();

    const handleChange = useCallback((fieldId: string, value: unknown) => {
        setFormState((prev) => ({ ...prev, [fieldId]: value }));
    }, []);

    const toggleNA = useCallback((fieldId: string) => {
        setNaFields((prev) => {
            const next = new Set(prev);
            if (next.has(fieldId)) {
                next.delete(fieldId);
                setFormState((prev) => {
                    const copy = { ...prev };
                    delete copy[fieldId];
                    return copy;
                });
            } else {
                next.add(fieldId);
                setFormState((prev) => ({ ...prev, [fieldId]: NA_VALUE }));
            }
            return next;
        });
    }, []);

    const toggleHelp = useCallback((fieldId: string) => {
        setHelpExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(fieldId)) next.delete(fieldId);
            else next.add(fieldId);
            return next;
        });
    }, []);

    // ── Validation — sliders must be explicitly touched ──────
    const allFieldsFilled = config.fields.every((field) => {
        // N/A fields always pass
        if (naFields.has(field.id)) return true;

        const val = formState[field.id];
        if (field.type === 'multi-select') return Array.isArray(val) && val.length > 0;
        if (field.type === 'slider') return val !== undefined && val !== null;
        if (field.type === 'unit-economics') {
            if (!Array.isArray(val)) return false;
            return val.some((row: UnitEconRow) => row.value !== '' && parseFloat(row.value) > 0);
        }
        if (field.type === 'textarea') return val !== undefined && val !== null && String(val).trim().length >= 10;
        return val !== undefined && val !== null && String(val).trim() !== '';
    });

    const hasValidationErrors = config.fields.some((field) => {
        if (naFields.has(field.id)) return false;
        if (field.validate && formState[field.id] !== undefined) {
            return field.validate(formState[field.id], formState) !== null;
        }
        return false;
    });

    const canProceed = allFieldsFilled && !hasValidationErrors;

    const handleNext = useCallback(() => {
        if (!canProceed || submitted) return;

        // Save answers
        config.fields.forEach((field) => {
            addAnswer(field.id, formState[field.id]);
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completeStage(config.id as any);
        setSubmitted(true);

        // ── Dynamic routing for product_deep_dive ────────────
        let resolvedNextStageId = config.nextStageId;
        if (config.nextStageId === 'product_deep_dive') {
            const productType = formState['product_type']
                ?? sessionAnswers['product_type']?.value
                ?? 'Physical Product';
            resolvedNextStageId = PRODUCT_TYPE_TO_DEEP_DIVE[productType as string] ?? 'stage_2a_physical';
        }

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
        } else if (resolvedNextStageId === 'result') {
            spawnResult(id);
            setTimeout(() => {
                fitView({
                    nodes: [{ id: 'result-trinity' }],
                    duration: 800,
                    padding: 0.4,
                    maxZoom: 0.8,
                });
            }, 250);
        } else if (resolvedNextStageId) {
            const nextConfig = STAGE_MAP[resolvedNextStageId] ?? null;
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
        } else {
            // ── Terminal branch stage — check for convergence ────
            // Use getState() for synchronous read after completeStage
            setTimeout(() => {
                const completed = useSessionStore.getState().completedStages;
                const allDone = CONVERGENCE_BRANCHES.every((b) => completed.includes(b));
                const alreadyExists = useMindMapStore.getState().nodes.some(
                    (n) => n.id === 'stage-van_westendorp'
                );
                if (allDone && !alreadyExists) {
                    spawnConvergence();
                    setTimeout(() => {
                        fitView({
                            nodes: [{ id: 'stage-van_westendorp' }],
                            duration: 800,
                            padding: 0.4,
                            maxZoom: 0.8,
                        });
                    }, 300);
                }
            }, 100);
        }
    }, [
        canProceed, submitted, config, formState, id, sessionAnswers,
        addAnswer, completeStage, submitStage, spawnBranches, spawnResult, spawnConvergence, fitView,
    ]);

    // ── Render a single field ────────────────────────────────
    const renderField = (field: QuestionField) => {
        const val = formState[field.id];
        const isNA = naFields.has(field.id);

        // If N/A is active, show a dimmed placeholder
        if (isNA) {
            return (
                <div className="px-4 py-3 rounded-xl inner-shadow bg-background-light dark:bg-background-dark text-xs text-slate-400 italic opacity-50">
                    Not Applicable — skipped
                </div>
            );
        }

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
            case 'textarea':
                return (
                    <TextareaField
                        field={field}
                        value={val ?? ''}
                        onChange={(v) => handleChange(field.id, v)}
                        disabled={submitted}
                    />
                );
            case 'unit-economics':
                return (
                    <UnitEconomicsField
                        field={field}
                        value={val}
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
                <div className="flex items-center gap-3 mb-4">
                    <div className={`
                        w-10 h-10 rounded-xl flex items-center justify-center
                        transition-all duration-300 flex-shrink-0
                        ${submitted
                            ? 'bg-primary text-white'
                            : 'bg-background-light dark:bg-background-dark outer-shadow text-primary'
                        }
                    `}>
                        <IconComp size={20} />
                    </div>
                    <h3 className="text-base font-bold text-text-light dark:text-text-dark leading-tight">
                        {config.title}
                    </h3>
                    {submitted && (
                        <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary flex-shrink-0">
                            <Check size={14} /> Done
                        </div>
                    )}
                </div>

                {/* Dynamic Fields — scrollable if needed */}
                <div className={`space-y-4 ${config.scrollable ? 'max-h-[420px] overflow-y-auto pr-1 custom-scrollbar' : ''}`}>
                    {config.fields.map((field) => (
                        <div key={field.id} className="flex flex-col gap-1.5">
                            {/* Label row with Help + N/A buttons */}
                            <div className="flex items-start gap-2">
                                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1 leading-snug flex-1">
                                    {field.label}
                                </label>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {field.helpText && (
                                        <HelpTip
                                            helpText={field.helpText}
                                            expanded={helpExpanded.has(field.id)}
                                            onToggle={() => toggleHelp(field.id)}
                                        />
                                    )}
                                    <NAToggle
                                        active={naFields.has(field.id)}
                                        onToggle={() => toggleNA(field.id)}
                                        disabled={submitted}
                                    />
                                </div>
                            </div>

                            {/* Help text shown below label (if bulb expanded and has helpText) */}
                            {field.helpText && helpExpanded.has(field.id) && (
                                <div className="px-3 py-2.5 rounded-xl inner-shadow bg-background-light dark:bg-background-dark text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    💡 {field.helpText}
                                </div>
                            )}

                            {renderField(field)}

                            {/* Error text */}
                            {!naFields.has(field.id) && field.validate && formState[field.id] !== undefined && field.validate(formState[field.id], formState) && (
                                <div className="text-[11px] font-medium text-red-500 flex items-center gap-1.5 mt-0.5 px-1 animate-in slide-in-from-top-1 fade-in duration-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {field.validate(formState[field.id], formState)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    {submitted ? (
                        <div className="flex items-center gap-2 text-sm font-bold text-primary px-4 py-2">
                            <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                <Check size={12} />
                            </span>
                            {config.branchIds ? 'Branch Complete' : 'Step Complete'}
                        </div>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className={`px-6 py-2.5 rounded-full transition-all flex items-center gap-2 font-medium text-sm active:scale-95 ${canProceed
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
