import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import {
    Package, SearchCheck, Rocket, TrendingUp,
    Compass, Users, ChevronRight, Check, Globe,
    Gem, Calculator, Target, FileText, Boxes,
    Briefcase, Monitor, Receipt, Plus, Trash2, BarChart3,
    Lightbulb, X, AlertTriangle, Sparkles, Edit2,
} from 'lucide-react';
import type { StageConfig, QuestionField, UnitEconomicsRow } from '../../../data/questions.config';
import { STAGE_MAP, PRODUCT_TYPE_TO_DEEP_DIVE } from '../../../data/questions.config';
import { useMindMapStore } from '../../../store/useMindMapStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useIntelligenceStore } from '../../../store/useIntelligenceStore';
import type { SessionStage } from '../../../types/session';
import { MarketIntelligencePanel } from './MarketIntelligencePanel';
import { getCurrencyFromAnswers } from '../../../utils/currency';

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
    const isTouched = value !== undefined;
    const [customMode, setCustomMode] = useState(false);

    // Resolve 'currency' sentinel to actual symbol from session answers
    const sessionAnswers = useSessionStore((s) => s.answers);
    const isCurrency = field.unit === 'currency';
    const resolvedUnit = isCurrency ? getCurrencyFromAnswers(sessionAnswers) : (field.unit ?? '');

    // Clamp percentage for the slider fill
    const clampedVal = Math.min(displayVal, max);
    const pct = ((clampedVal - min) / (max - min)) * 100;

    // If value exceeds slider max, auto-switch to custom mode
    if (isCurrency && value !== undefined && value > max && !customMode) {
        setCustomMode(true);
    }

    return (
        <div className="space-y-3 nodrag nopan">
            <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{min}{resolvedUnit}</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full transition-all ${isTouched
                    ? 'text-primary bg-background-light dark:bg-background-dark outer-shadow'
                    : 'text-slate-400 bg-transparent'
                    }`}>
                    {isTouched ? `${displayVal.toLocaleString()}${resolvedUnit}` : `${displayVal}${resolvedUnit}`}
                </span>
                <span className="text-xs text-slate-400">{max}{resolvedUnit}</span>
            </div>

            {customMode ? (
                /* ── Custom number input ── */
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">{resolvedUnit}</span>
                        <input
                            type="number"
                            min={min}
                            value={value ?? ''}
                            onChange={(e) => onChange(Number(e.target.value))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={disabled}
                            placeholder="Enter amount"
                            className="w-full py-2 pl-8 pr-3 rounded-xl inner-shadow bg-background-light dark:bg-background-dark text-sm text-text-light dark:text-text-dark outline-none transition-all focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (value && value > max) onChange(max);
                            setCustomMode(false);
                        }}
                        disabled={disabled}
                        className="text-[10px] font-bold px-3 py-2 rounded-lg outer-shadow text-slate-500 hover:text-primary transition-all cursor-pointer whitespace-nowrap"
                    >
                        Slider
                    </button>
                </div>
            ) : (
                /* ── Slider with optional Custom button ── */
                <div className="flex items-center gap-2">
                    <div className="relative h-6 flex items-center flex-1">
                        <div className="absolute left-0 right-0 h-2 rounded-full inner-shadow" />
                        <div
                            className="absolute left-0 h-2 rounded-full bg-primary transition-all duration-150"
                            style={{ width: `${pct}%`, top: '50%', transform: 'translateY(-50%)' }}
                        />
                        <input
                            type="range"
                            min={min}
                            max={max}
                            step={field.step ?? 1}
                            value={clampedVal}
                            onChange={(e) => onChange(Number(e.target.value))}
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={disabled}
                            className="neu-slider absolute inset-0 w-full disabled:opacity-50"
                        />
                    </div>
                    <button
                        onClick={() => setCustomMode(true)}
                        disabled={disabled}
                        className="text-[10px] font-bold px-3 py-2 rounded-lg outer-shadow text-slate-500 hover:text-primary transition-all cursor-pointer whitespace-nowrap"
                    >
                        Custom
                    </button>
                </div>
            )}
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

// ── VW Alert Card ────────────────────────────────────────────
const VWAlertCard = ({
    type: _type, severity, message, suggestion,
}: {
    type: string; severity: string; message: string; suggestion?: string;
}) => (
    <div className={`px-4 py-3 rounded-xl border ${
        severity === 'High'
            ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30'
            : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30'
    }`}>
        <div className="flex items-start gap-2">
            <AlertTriangle size={14} className={severity === 'High' ? 'text-red-500 mt-0.5' : 'text-amber-500 mt-0.5'} />
            <div className="flex-1">
                <p className={`text-xs font-medium leading-relaxed ${
                    severity === 'High' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                }`}>
                    {message}
                </p>
                {suggestion && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                        💡 {suggestion}
                    </p>
                )}
            </div>
        </div>
    </div>
);

// ── Auto-detect badge ────────────────────────────────────────
const AutoDetectedBadge = () => (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full ml-2">
        <Sparkles size={9} /> Auto-filled
    </span>
);

// ── Main Component ───────────────────────────────────────────
export const QuestionNode = memo(({ id, data }: NodeProps<QuestionNodeData>) => {
    const { config } = data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [formState, setFormState] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);
    const [naFields, setNaFields] = useState<Set<string>>(new Set());
    const [helpExpanded, setHelpExpanded] = useState<Set<string>>(new Set());
    const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

    const submitStage = useMindMapStore((s) => s.submitStage);
    const spawnBranches = useMindMapStore((s) => s.spawnBranches);
    const spawnResult = useMindMapStore((s) => s.spawnResult);
    const spawnConvergence = useMindMapStore((s) => s.spawnConvergence);
    const addAnswer = useSessionStore((s) => s.addAnswer);
    const completeStage = useSessionStore((s) => s.completeStage);
    const sessionAnswers = useSessionStore((s) => s.answers);
    const { fitView } = useReactFlow();

    // Intelligence store
    const geoData = useIntelligenceStore((s) => s.geoData);
    const preFillData = useIntelligenceStore((s) => s.preFillData);
    const marketPriceRange = useIntelligenceStore((s) => s.marketPriceRange);
    const vwAlerts = useIntelligenceStore((s) => s.vwAlerts);
    const validateVanWestendorp = useIntelligenceStore((s) => s.validateVanWestendorp);
    const runCompetitorDiscovery = useIntelligenceStore((s) => s.runCompetitorDiscovery);
    const runDemandAnalysis = useIntelligenceStore((s) => s.runDemandAnalysis);

    // ── Auto-populate from intelligence data on mount ─────────
    // Grab discovered competitors for auto-fill
    const discoveredCompetitors = useIntelligenceStore((s) => s.discoveredCompetitors);

    useEffect(() => {
        if (submitted) return;
        const autoFilled: Record<string, any> = {};
        const autoFieldIds = new Set<string>();

        // Build enriched description from pre-fill fragments
        const rawDesc = preFillData?.description || sessionAnswers['product_description_prefill']?.value as string || '';
        const targetCust = preFillData?.targetCustomer || sessionAnswers['target_customer_prefill']?.value as string || '';
        const usp = preFillData?.valueUsp || sessionAnswers['usp_prefill']?.value as string || '';
        let enrichedDescription = rawDesc;
        if (targetCust && !rawDesc.toLowerCase().includes(targetCust.toLowerCase())) {
            enrichedDescription += ` Target customer: ${targetCust}.`;
        }
        if (usp && !rawDesc.toLowerCase().includes(usp.toLowerCase())) {
            enrichedDescription += ` Unique value: ${usp}.`;
        }

        // Map pre-fill data to question field IDs
        const preFillMap: Record<string, string | undefined> = {
            product_name: preFillData?.productName || sessionAnswers['product_name_prefill']?.value as string,
            product_description_text: enrichedDescription.trim() || undefined,
        };

        // Map geo data
        if (geoData) {
            const countryMap: Record<string, string> = {
                US: 'United States', GB: 'United Kingdom', IN: 'India',
                DE: 'European Union', FR: 'European Union', IT: 'European Union', ES: 'European Union',
                CA: 'Canada', AU: 'Australia',
            };
            const currencyMap: Record<string, string> = {
                USD: 'USD ($)', EUR: 'EUR (€)', GBP: 'GBP (£)',
                INR: 'INR (₹)', CAD: 'CAD (C$)', AUD: 'AUD (A$)',
            };
            preFillMap['business_country'] = countryMap[geoData.countryCode] || sessionAnswers['geo_country']?.value as string;
            preFillMap['currency'] = currencyMap[geoData.currency] || undefined;
            if (geoData.suggestedVatRate > 0) {
                preFillMap['tax_rate'] = String(geoData.suggestedVatRate);
            }
        }

        // Map product category from pre-fill
        const catPrefill = preFillData?.category || sessionAnswers['product_category_prefill']?.value as string;
        if (catPrefill) {
            preFillMap['product_type'] = catPrefill;
        }

        // Map market price range from competitor scraping
        if (marketPriceRange) {
            preFillMap['competitor_price_low'] = String(marketPriceRange.min);
            preFillMap['competitor_price_high'] = String(marketPriceRange.max);
        }

        // Map competitor count from discovered competitors
        if (discoveredCompetitors.length > 0) {
            preFillMap['competitor_count'] = String(discoveredCompetitors.length);
        }

        // Apply only for fields that exist in this stage config
        for (const field of config.fields) {
            const preFillValue = preFillMap[field.id];
            if (preFillValue && formState[field.id] === undefined) {
                // For sliders/numbers, parse to number
                if (field.type === 'slider' || field.type === 'number') {
                    const num = Number(preFillValue);
                    if (!isNaN(num)) {
                        autoFilled[field.id] = num;
                        autoFieldIds.add(field.id);
                    }
                } else {
                    autoFilled[field.id] = preFillValue;
                    autoFieldIds.add(field.id);
                }
            }
        }

        if (Object.keys(autoFilled).length > 0) {
            setFormState((prev) => ({ ...autoFilled, ...prev }));
            setAutoFilledFields((prev) => new Set([...prev, ...autoFieldIds]));
        }
    }, [
        config.id,
        submitted,
        preFillData,
        geoData,
        marketPriceRange,
        discoveredCompetitors.length
    ]); // Re-run when async intelligence data arrives

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
            const result = field.validate(formState[field.id], formState);
            // Warnings (starting with ⚠️) are non-blocking
            if (result && result.startsWith('⚠️')) return false;
            return result !== null;
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

        // ── Van Westendorp validation against market data ────
        if (config.id === 'van_westendorp') {
            const vwValues = {
                tooCheap: Number(formState['too_cheap']) || 0,
                bargain: Number(formState['bargain']) || 0,
                gettingExpensive: Number(formState['getting_expensive']) || 0,
                tooExpensive: Number(formState['too_expensive']) || 0,
            };
            // Build market data from intelligence store or manual answers
            const mpr = useIntelligenceStore.getState().marketPriceRange;
            const competitorMin = mpr?.min || Number(sessionAnswers['competitor_price_low']?.value) || 0;
            const competitorMax = mpr?.max || Number(sessionAnswers['competitor_price_high']?.value) || 0;
            const competitorAvg = mpr?.average || (competitorMin && competitorMax ? Math.round((competitorMin + competitorMax) / 2) : 0);
            const mkData = competitorMin > 0 && competitorMax > 0
                ? { competitorMin, competitorMax, competitorAvg }
                : undefined;
            validateVanWestendorp(vwValues, mkData);
        }

        // ── Auto-trigger competitor discovery + demand analysis ──
        if (config.id === 'product_classification') {
            const productName = formState['product_name']
                ?? sessionAnswers['product_name_prefill']?.value
                ?? '';
            const productType = formState['product_type'] ?? '';
            const country = formState['business_country']
                ?? sessionAnswers['geo_country']?.value
                ?? 'United States';

            if (productName) {
                // Fire-and-forget — both are non-blocking
                runCompetitorDiscovery(String(productName), String(productType), String(country));
                runDemandAnalysis(String(productName), String(country));
            }
        }

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
        } else if (resolvedNextStageId === 'financials_focus' || resolvedNextStageId === 'product_value_focus') {
            // Special sentinel: focus camera on existing card (no new node spawned)
            const targetNodeId = resolvedNextStageId === 'financials_focus'
                ? 'stage-financials'
                : 'stage-product_value';
            setTimeout(() => {
                fitView({
                    nodes: [{ id: targetNodeId }],
                    duration: 800,
                    padding: 0.2,
                    maxZoom: 1.1,
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
                                    {autoFilledFields.has(field.id) && !submitted && <AutoDetectedBadge />}
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

                            {/* Error / Warning text — reserved height to prevent layout shift */}
                            <div className="min-h-[18px]">
                                {!naFields.has(field.id) && field.validate && formState[field.id] !== undefined && (() => {
                                    const msg = field.validate(formState[field.id], formState);
                                    if (!msg) return null;
                                    const isWarning = msg.startsWith('⚠️');
                                    return (
                                        <div className={`text-[11px] font-medium flex items-center gap-1.5 mt-0.5 px-1 animate-in slide-in-from-top-1 fade-in duration-200 ${isWarning ? 'text-amber-500' : 'text-red-500'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-amber-500' : 'bg-red-500'}`} />
                                            {msg}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Market Intelligence Panel (market_intelligence stage) ── */}
                {config.id === 'market_intelligence' && (
                    <MarketIntelligencePanel />
                )}

                {/* ── Van Westendorp Cross-Reference Alerts ── */}
                {config.id === 'van_westendorp' && submitted && vwAlerts.length > 0 && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1">
                            Market Cross-Reference Alerts
                        </p>
                        {vwAlerts.map((alert, i) => (
                            <VWAlertCard key={i} {...alert} />
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                    {submitted ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    // Clear all N/A toggles so fields are directly editable
                                    setNaFields(new Set());
                                    // Remove NA_VALUE from form state for those fields
                                    setFormState((prev) => {
                                        const cleaned = { ...prev };
                                        for (const key of Object.keys(cleaned)) {
                                            if (cleaned[key] === NA_VALUE) {
                                                delete cleaned[key];
                                            }
                                        }
                                        return cleaned;
                                    });
                                }}
                                className="text-xs font-medium text-slate-400 hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <Edit2 size={12} />
                                Edit Answers
                            </button>
                            <div className="flex items-center gap-2 text-sm font-bold text-primary px-4 py-2">
                                <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Check size={12} />
                                </span>
                                {config.branchIds ? 'Branch Complete' : 'Step Complete'}
                            </div>
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
