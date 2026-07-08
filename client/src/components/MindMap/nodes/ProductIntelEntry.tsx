import { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, useReactFlow, type NodeProps } from 'reactflow';
import {
    Globe, Sparkles, Loader2, ChevronRight, Search,
    MapPin, ArrowRight, Check,
} from 'lucide-react';
import { useIntelligenceStore } from '../../../store/useIntelligenceStore';
import { useSessionStore } from '../../../store/useSessionStore';
import { useMindMapStore } from '../../../store/useMindMapStore';
import { STAGE_MAP } from '../../../data/questions.config';

// ============================================================
// ProductIntelEntry — "Question 0"
//
// The first screen after journey selection. User enters their
// product URL or name, and the system auto-detects product
// details + geo/currency. Replaces manual entry with magic.
// ============================================================

interface ProductIntelEntryData {
    parentNodeId: string;
}

// ── Geo Detection Badge ──────────────────────────────────────
const GeoBadge = memo(() => {
    const geoData = useIntelligenceStore((s) => s.geoData);
    const geoStatus = useIntelligenceStore((s) => s.geoStatus);

    if (geoStatus === 'idle') return null;

    if (geoStatus === 'loading') {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl inner-shadow bg-background-light dark:bg-background-dark animate-pulse">
                <Loader2 size={12} className="animate-spin text-primary" />
                <span className="text-[10px] text-slate-400">Detecting location...</span>
            </div>
        );
    }

    if (geoStatus === 'success' && geoData) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl outer-shadow bg-background-light dark:bg-background-dark transition-all duration-300 hover:shadow-none">
                <MapPin size={12} className="text-primary" />
                <span className="text-[11px] text-text-light dark:text-text-dark font-medium">
                    📍 {geoData.country} · {geoData.currency}
                </span>
                {geoData.suggestedVatRate > 0 && (
                    <span className="text-[9px] text-slate-400 ml-1">
                        VAT {geoData.suggestedVatRate}%
                    </span>
                )}
            </div>
        );
    }

    return null;
});
GeoBadge.displayName = 'GeoBadge';

// ── Pre-fill Result Card ─────────────────────────────────────
const PreFillResult = memo(({ onContinue }: { onContinue: () => void }) => {
    const preFillData = useIntelligenceStore((s) => s.preFillData);
    const geoData = useIntelligenceStore((s) => s.geoData);

    if (!preFillData) return null;

    const fields = [
        { label: 'Product Name', value: preFillData.productName },
        { label: 'Category', value: [preFillData.category, preFillData.subCategory].filter(Boolean).join(' — ') || null },
        { label: 'Target Customer', value: preFillData.targetCustomer },
        { label: 'Geography', value: preFillData.geographyServed },
    ].filter((f) => f.value);

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    Auto-detected
                </span>
            </div>

            <div className="space-y-2">
                {fields.map(({ label, value }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl inner-shadow bg-background-light dark:bg-background-dark"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                {label}
                            </span>
                            <span className="text-xs font-medium text-text-light dark:text-text-dark truncate block">
                                {value}
                            </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">
                            <Sparkles size={8} /> Auto
                        </span>
                    </div>
                ))}

                {/* Description (full width) */}
                {preFillData.description && (
                    <div className="px-3 py-2.5 rounded-xl inner-shadow bg-background-light dark:bg-background-dark">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Description
                        </span>
                        <p className="text-[11px] text-text-light dark:text-text-dark leading-relaxed line-clamp-3">
                            {preFillData.description}
                        </p>
                    </div>
                )}
            </div>

            {/* Geo Badge */}
            {geoData && (
                <GeoBadge />
            )}

            {/* Continue Button */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={onContinue}
                    className="flex-1 px-4 py-2.5 rounded-full bg-primary hover:bg-primary-dark text-white font-medium text-sm transition-all flex items-center justify-center gap-2 outer-shadow active:scale-95 cursor-pointer"
                >
                    Looks right — Continue
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
});
PreFillResult.displayName = 'PreFillResult';

// ── Loading State ────────────────────────────────────────────
const AnalysingState = memo(() => {
    const preFillStatus = useIntelligenceStore((s) => s.preFillStatus);
    const geoStatus = useIntelligenceStore((s) => s.geoStatus);

    return (
        <div className="space-y-3 animate-in fade-in duration-300">
            <p className="text-xs text-slate-400 font-medium mb-2">✨ Analysing your product...</p>
            <div className="space-y-2">
                {/* Geo */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl inner-shadow bg-background-light dark:bg-background-dark">
                    {geoStatus === 'loading' ? (
                        <Loader2 size={12} className="animate-spin text-primary" />
                    ) : geoStatus === 'success' ? (
                        <Check size={12} className="text-emerald-500" />
                    ) : (
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    )}
                    <span className="text-[11px] text-text-light dark:text-text-dark font-medium flex-1">
                        Detecting your location
                    </span>
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                        geoStatus === 'success' ? 'bg-emerald-400 w-full' : geoStatus === 'loading' ? 'bg-primary/60 w-3/4 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 w-0'
                    }`} style={{ maxWidth: 60 }} />
                </div>

                {/* Scrape */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl inner-shadow bg-background-light dark:bg-background-dark">
                    {preFillStatus === 'loading' ? (
                        <Loader2 size={12} className="animate-spin text-primary" />
                    ) : preFillStatus === 'success' ? (
                        <Check size={12} className="text-emerald-500" />
                    ) : (
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    )}
                    <span className="text-[11px] text-text-light dark:text-text-dark font-medium flex-1">
                        Scraping product details
                    </span>
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                        preFillStatus === 'success' ? 'bg-emerald-400 w-full' : preFillStatus === 'loading' ? 'bg-primary/60 w-1/2 animate-pulse' : 'bg-slate-200 dark:bg-slate-700 w-0'
                    }`} style={{ maxWidth: 60 }} />
                </div>
            </div>
        </div>
    );
});
AnalysingState.displayName = 'AnalysingState';

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export const ProductIntelEntry = memo(({ id, data: _data }: NodeProps<ProductIntelEntryData>) => {
    const [inputValue, setInputValue] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [phase, setPhase] = useState<'input' | 'analysing' | 'results' | 'done'>('input');

    const preFillStatus = useIntelligenceStore((s) => s.preFillStatus);
    const preFillData = useIntelligenceStore((s) => s.preFillData);
    const runPreFill = useIntelligenceStore((s) => s.runPreFill);
    const addAnswer = useSessionStore((s) => s.addAnswer);
    const submitStage = useMindMapStore((s) => s.submitStage);
    const { fitView } = useReactFlow();

    // Transition from analysing → results when prefill completes
    useEffect(() => {
        if (phase === 'analysing' && preFillStatus === 'success' && preFillData) {
            setPhase('results');
        } else if (phase === 'analysing' && preFillStatus === 'failed') {
            // Pre-fill failed → skip to product_classification directly
            handleSkipToManual();
        }
    }, [phase, preFillStatus, preFillData]);

    const handleAnalyse = useCallback(() => {
        if (!inputValue.trim()) return;
        runPreFill(inputValue.trim());
        setPhase('analysing');
    }, [inputValue, runPreFill]);

    const handleContinue = useCallback(() => {
        // Save pre-fill results to session store for downstream auto-population
        const intel = useIntelligenceStore.getState();
        if (intel.preFillData?.productName) {
            addAnswer('product_name_prefill', intel.preFillData.productName);
        }
        if (intel.preFillData?.description) {
            addAnswer('product_description_prefill', intel.preFillData.description);
        }
        if (intel.preFillData?.category) {
            addAnswer('product_category_prefill', intel.preFillData.category);
        }
        if (intel.preFillData?.targetCustomer) {
            addAnswer('target_customer_prefill', intel.preFillData.targetCustomer);
        }
        if (intel.preFillData?.valueUsp) {
            addAnswer('usp_prefill', intel.preFillData.valueUsp);
        }
        if (intel.geoData) {
            addAnswer('geo_country', intel.geoData.country);
            addAnswer('geo_currency', intel.geoData.currency);
            addAnswer('geo_vat', intel.geoData.suggestedVatRate);
        }

        setPhase('done');
        setSubmitted(true);

        // Spawn product_classification as the next stage
        const nextConfig = STAGE_MAP['product_classification'];
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
    }, [id, addAnswer, submitStage, fitView]);

    const handleSkipToManual = useCallback(() => {
        // Save geo data even when skipping pre-fill
        const intel = useIntelligenceStore.getState();
        if (intel.geoData) {
            addAnswer('geo_country', intel.geoData.country);
            addAnswer('geo_currency', intel.geoData.currency);
            addAnswer('geo_vat', intel.geoData.suggestedVatRate);
        }

        setPhase('done');
        setSubmitted(true);

        const nextConfig = STAGE_MAP['product_classification'];
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
    }, [id, addAnswer, submitStage, fitView]);

    return (
        <div className="relative group">
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!bg-slate-400 !w-2 !h-2 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ top: '50%', transform: 'translateY(-50%)', left: -5 }}
            />

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
                        <Globe size={20} />
                    </div>
                    <h3 className="text-base font-bold text-text-light dark:text-text-dark leading-tight">
                        Product Intelligence
                    </h3>
                    {submitted && (
                        <div className="ml-auto flex items-center gap-1.5 text-xs font-bold text-primary flex-shrink-0">
                            <Check size={14} /> Done
                        </div>
                    )}
                </div>

                {/* Phase: Input */}
                {phase === 'input' && (
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Enter your website URL or product name and we'll auto-detect your product details, location, and currency.
                        </p>

                        {/* URL Input */}
                        <div className="relative nodrag">
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={16} />
                            </div>
                            <input
                                type="text"
                                placeholder='e.g. "myproduct.com" or "BuildMetrics AI"'
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyse()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-xl pl-10 pr-4 py-3 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Geo Badge (shows while user is typing) */}
                        <GeoBadge />

                        {/* Actions */}
                        <div className="space-y-2 pt-1">
                            <button
                                onClick={handleAnalyse}
                                disabled={!inputValue.trim()}
                                className={`w-full px-4 py-2.5 rounded-full font-medium text-sm transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                    inputValue.trim()
                                        ? 'bg-primary hover:bg-primary-dark text-white outer-shadow cursor-pointer'
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                <Sparkles size={14} />
                                Analyse My Product
                                <ArrowRight size={14} />
                            </button>

                            <button
                                onClick={handleSkipToManual}
                                className="w-full px-4 py-2 text-xs text-slate-400 hover:text-primary transition-colors font-medium cursor-pointer"
                            >
                                I don't have a website yet — continue manually
                            </button>
                        </div>
                    </div>
                )}

                {/* Phase: Analysing */}
                {phase === 'analysing' && (
                    <AnalysingState />
                )}

                {/* Phase: Results */}
                {phase === 'results' && (
                    <PreFillResult onContinue={handleContinue} />
                )}

                {/* Phase: Done */}
                {phase === 'done' && (
                    <div className="flex items-center gap-2 text-sm font-bold text-primary px-4 py-2">
                        <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <Check size={12} />
                        </span>
                        Intelligence captured
                    </div>
                )}
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
ProductIntelEntry.displayName = 'ProductIntelEntry';
