import React, { useCallback, useState, useEffect } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useMindMapStore } from '../store/useMindMapStore';
import { useIntelligenceStore } from '../store/useIntelligenceStore';
import type { JourneyType } from '../types/session';
import { Globe, Sparkles, Pencil, ArrowRight, Loader2, CheckCircle2, MapPin, Search, Rocket, AlertTriangle } from 'lucide-react';

/**
 * LandingView — Question 0 + Journey Selection
 *
 * Step 1: "Enter your URL or product name" (with geo-detection badge)
 * Step 2: Analyzing skeleton (loading)
 * Step 3: Pre-fill results with edit + confirm
 * Step 4: Journey selection cards (existing UI)
 */

type LandingStep = 'input' | 'analyzing' | 'results' | 'journey';

// ── Progress Bar Item ────────────────────────────────────────
const ProgressItem = ({
    label,
    status,
}: {
    label: string;
    status: 'pending' | 'loading' | 'done' | 'failed';
}) => (
    <div className="flex items-center gap-3">
        <div className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-full h-2 overflow-hidden flex-1">
            <div
                className={`h-full rounded-full transition-all duration-700 ${
                    status === 'done'
                        ? 'bg-primary w-full'
                        : status === 'loading'
                        ? 'bg-primary/60 w-2/3 animate-pulse'
                        : status === 'failed'
                        ? 'bg-red-400 w-full'
                        : 'w-0'
                }`}
            />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 w-48 text-right font-medium">{label}</span>
    </div>
);

// ── Editable Pre-fill Field ──────────────────────────────────
const PreFillField = ({
    label,
    value,
    autoDetected,
    onEdit,
    icon,
}: {
    label: string;
    value: string;
    autoDetected: boolean;
    onEdit: (newValue: string) => void;
    icon?: React.ReactNode;
}) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);

    useEffect(() => { setEditValue(value); }, [value]);

    return (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background-light dark:bg-background-dark inner-shadow">
            {icon && <div className="text-primary flex-shrink-0">{icon}</div>}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    {autoDetected && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            <Sparkles size={9} /> Auto-detected
                        </span>
                    )}
                </div>
                {editing ? (
                    <input
                        type="text"
                        className="w-full bg-transparent text-sm text-text-light dark:text-text-dark outline-none border-b border-primary/30 pb-0.5"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => {
                            onEdit(editValue);
                            setEditing(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onEdit(editValue);
                                setEditing(false);
                            }
                        }}
                        autoFocus
                    />
                ) : (
                    <p className="text-sm font-medium text-text-light dark:text-text-dark truncate">
                        {value || <span className="text-slate-400 italic">Not detected</span>}
                    </p>
                )}
            </div>
            {!editing && (
                <button
                    onClick={() => setEditing(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary transition-colors flex-shrink-0 hover-in-shadow"
                >
                    <Pencil size={12} />
                </button>
            )}
        </div>
    );
};

export const LandingView: React.FC = () => {
    const setJourneyType = useSessionStore((s) => s.setJourneyType);
    const addAnswer = useSessionStore((s) => s.addAnswer);
    const goToMap = useMindMapStore((s) => s.goToMap);

    // Intelligence store
    const geoData = useIntelligenceStore((s) => s.geoData);
    const geoStatus = useIntelligenceStore((s) => s.geoStatus);
    const preFillData = useIntelligenceStore((s) => s.preFillData);
    const preFillStatus = useIntelligenceStore((s) => s.preFillStatus);
    const runGeolocate = useIntelligenceStore((s) => s.runGeolocate);
    const runPreFill = useIntelligenceStore((s) => s.runPreFill);
    const setPreFillSkipped = useIntelligenceStore((s) => s.setPreFillSkipped);

    const [step, setStep] = useState<LandingStep>('input');
    const [inputValue, setInputValue] = useState('');

    // Local editable copies of pre-fill results
    const [editedFields, setEditedFields] = useState<Record<string, string>>({});

    // Auto-run geolocation on mount
    useEffect(() => {
        if (geoStatus === 'idle') {
            runGeolocate();
        }
    }, [geoStatus, runGeolocate]);

    // Watch preFillStatus to transition from analyzing → results
    const [failMessage, setFailMessage] = useState('');

    useEffect(() => {
        if (step === 'analyzing') {
            if (preFillStatus === 'success' && preFillData) {
                // Initialize editable fields from prefill data
                setEditedFields({
                    productName: preFillData.productName || '',
                    description: preFillData.description || '',
                    category: preFillData.category || '',
                    subCategory: preFillData.subCategory || '',
                    targetCustomer: preFillData.targetCustomer || '',
                    geographyServed: preFillData.geographyServed || '',
                    valueUsp: preFillData.valueUsp || '',
                });
                // Short delay for smooth transition
                const timer = setTimeout(() => setStep('results'), 600);
                return () => clearTimeout(timer);
            }
            if (preFillStatus === 'failed') {
                // Show brief failure message, then advance to journey
                setFailMessage('Could not analyse — you\'ll enter details manually.');
                const timer = setTimeout(() => {
                    setPreFillSkipped();
                    setStep('journey');
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [step, preFillStatus, preFillData, setPreFillSkipped]);

    const handleAnalyze = useCallback(() => {
        if (!inputValue.trim()) return;
        setStep('analyzing');
        runPreFill(inputValue.trim());
    }, [inputValue, runPreFill]);

    const handleSkipToJourney = useCallback(() => {
        setPreFillSkipped();
        setStep('journey');
    }, [setPreFillSkipped]);

    const handleConfirmPreFill = useCallback(() => {
        // Save pre-fill data to session answers
        if (editedFields.productName) addAnswer('product_name_prefill', editedFields.productName);
        if (editedFields.description) addAnswer('product_description_prefill', editedFields.description);
        if (editedFields.category) addAnswer('product_category_prefill', editedFields.category);
        if (editedFields.subCategory) addAnswer('product_subcategory_prefill', editedFields.subCategory);
        if (editedFields.targetCustomer) addAnswer('target_customer_prefill', editedFields.targetCustomer);
        if (editedFields.valueUsp) addAnswer('usp_prefill', editedFields.valueUsp);
        if (editedFields.geographyServed) addAnswer('geography_served_prefill', editedFields.geographyServed);

        // Save source URL for downstream intelligence
        if (preFillData?.sourceUrl) addAnswer('source_url_prefill', preFillData.sourceUrl);

        // Save geo data
        if (geoData) {
            addAnswer('geo_country', geoData.country);
            addAnswer('geo_country_code', geoData.countryCode);
            addAnswer('geo_currency', geoData.currency);
            addAnswer('geo_vat_rate', geoData.suggestedVatRate);
        }

        setStep('journey');
    }, [editedFields, geoData, preFillData, addAnswer]);

    const handleEditManually = useCallback(() => {
        setStep('journey');
    }, []);

    const updateField = useCallback((key: string, value: string) => {
        setEditedFields((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleJourneyClick = useCallback(
        (type: JourneyType) => {
            setJourneyType(type);
            goToMap(type);
        },
        [setJourneyType, goToMap]
    );

    // ═══════════════════════════════════════════════════════════
    // STEP 1: URL / Product Name Input
    // ═══════════════════════════════════════════════════════════
    if (step === 'input') {
        return (
            <main className="relative flex items-center justify-center w-full h-full p-8">
                <div className="flex flex-col items-center gap-8 max-w-lg w-full">
                    {/* Headline */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            Let's start with your product.
                        </h1>
                        <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                            We'll analyze it and pre-fill your pricing journey.
                        </p>
                    </div>

                    {/* Geo-detection badge */}
                    {geoStatus === 'success' && geoData && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full outer-shadow bg-background-light dark:bg-background-dark text-xs font-medium text-slate-600 dark:text-slate-300 animate-in fade-in slide-in-from-top-2 duration-500">
                            <MapPin size={14} className="text-primary" />
                            <span>Detected: <strong>{geoData.country}</strong> · {geoData.currency}</span>
                        </div>
                    )}

                    {/* Input Card */}
                    <div className="w-full outer-shadow-lg rounded-2xl p-8 bg-background-light dark:bg-background-dark">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center outer-shadow text-primary bg-background-light dark:bg-background-dark">
                                <Globe size={20} />
                            </div>
                            <span className="text-sm font-bold text-text-light dark:text-text-dark">
                                Enter your website URL or product name
                            </span>
                        </div>

                        <div className="relative mb-5">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                placeholder='e.g. "myproduct.com" or "BuildMetrics AI"'
                                className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-xl px-5 py-4 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/30 transition-all placeholder:text-slate-400"
                            />
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={!inputValue.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                inputValue.trim()
                                    ? 'bg-primary hover:bg-primary-dark text-white outer-shadow active:scale-[0.98]'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            Analyse My Product
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    {/* Skip link */}
                    <button
                        onClick={handleSkipToJourney}
                        className="text-sm text-slate-400 hover:text-primary transition-colors font-medium cursor-pointer"
                    >
                        I don't have a website yet → continue manually
                    </button>
                </div>
            </main>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 2: Analyzing Skeleton
    // ═══════════════════════════════════════════════════════════
    if (step === 'analyzing') {
        return (
            <main className="relative flex items-center justify-center w-full h-full p-8">
                <div className="flex flex-col items-center gap-8 max-w-md w-full">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center outer-shadow animate-pulse">
                        <Sparkles size={28} />
                    </div>

                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                            Analysing your product...
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            This takes 10–30 seconds. We're scraping and extracting key details.
                        </p>
                    </div>

                    {/* Progress bars */}
                    <div className="w-full outer-shadow-lg rounded-2xl p-6 bg-background-light dark:bg-background-dark space-y-4">
                        <ProgressItem
                            label="Detecting your location"
                            status={geoStatus === 'success' ? 'done' : geoStatus === 'loading' ? 'loading' : geoStatus === 'failed' ? 'failed' : 'pending'}
                        />
                        <ProgressItem
                            label="Scraping product details"
                            status={
                                preFillStatus === 'success'
                                    ? 'done'
                                    : preFillStatus === 'loading'
                                    ? 'loading'
                                    : preFillStatus === 'failed'
                                    ? 'failed'
                                    : 'pending'
                            }
                        />
                        <ProgressItem
                            label="AI extraction"
                            status={preFillStatus === 'success' ? 'done' : preFillStatus === 'loading' ? 'loading' : 'pending'}
                        />
                    </div>

                    {failMessage ? (
                        <div className="flex items-center gap-2 text-amber-500 animate-in fade-in duration-300">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-medium">{failMessage}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-xs">Please wait...</span>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 3: Pre-fill Results
    // ═══════════════════════════════════════════════════════════
    if (step === 'results') {
        return (
            <main className="relative flex items-center justify-center w-full h-full p-8 overflow-y-auto">
                <div className="flex flex-col items-center gap-6 max-w-lg w-full my-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 size={22} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Here's what we found
                        </h2>
                    </div>

                    {/* Results Card */}
                    <div className="w-full outer-shadow-lg rounded-2xl p-6 bg-background-light dark:bg-background-dark space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <PreFillField
                            label="Product Name"
                            value={editedFields.productName || ''}
                            autoDetected={!!preFillData?.productName}
                            onEdit={(v) => updateField('productName', v)}
                        />
                        <PreFillField
                            label="Category"
                            value={editedFields.category ? `${editedFields.category}${editedFields.subCategory ? ` — ${editedFields.subCategory}` : ''}` : ''}
                            autoDetected={!!preFillData?.category}
                            onEdit={(v) => updateField('category', v)}
                        />
                        {geoData && (
                            <PreFillField
                                label="Location"
                                value={`${geoData.country} · ${geoData.currency}`}
                                autoDetected={true}
                                onEdit={() => {}} // Geo is read-only for now
                                icon={<MapPin size={14} />}
                            />
                        )}
                        {geoData && geoData.suggestedVatRate > 0 && (
                            <PreFillField
                                label="VAT Rate"
                                value={`${geoData.suggestedVatRate}% (standard rate)`}
                                autoDetected={true}
                                onEdit={() => {}}
                            />
                        )}
                        {editedFields.targetCustomer && (
                            <PreFillField
                                label="Target Customer"
                                value={editedFields.targetCustomer}
                                autoDetected={!!preFillData?.targetCustomer}
                                onEdit={(v) => updateField('targetCustomer', v)}
                            />
                        )}

                        {/* Description block */}
                        {editedFields.description && (
                            <div className="px-4 py-3 rounded-xl bg-background-light dark:bg-background-dark inner-shadow">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Description
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        <Sparkles size={9} /> Auto-detected
                                    </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{editedFields.description}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 w-full">
                        <button
                            onClick={handleConfirmPreFill}
                            className="flex-1 py-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm outer-shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Looks right — Continue
                            <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={handleEditManually}
                            className="px-6 py-4 rounded-xl bg-background-light dark:bg-background-dark outer-shadow text-slate-500 hover:text-text-light dark:hover:text-text-dark font-medium text-sm transition-all cursor-pointer"
                        >
                            Skip
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // ═══════════════════════════════════════════════════════════
    // STEP 4: Journey Selection (Original LandingView)
    // ═══════════════════════════════════════════════════════════
    return (
        <main className="relative flex items-center justify-center w-full h-full p-8">

            {/* ── Headline Overlay ── */}
            <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2 text-center z-20">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    What are you pricing today?
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Select your path to begin analysis.
                </p>
                {/* Show geo badge in journey step too */}
                {geoData && (
                    <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full outer-shadow bg-background-light dark:bg-background-dark text-xs font-medium text-slate-500 dark:text-slate-400">
                        <MapPin size={12} className="text-primary" />
                        {geoData.country} · {geoData.currency}
                        {geoData.suggestedVatRate > 0 && ` · VAT ${geoData.suggestedVatRate}%`}
                    </div>
                )}
            </div>

            {/* ── Solid Connection Lines ── */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[720px] h-0.5 bg-gray-300 dark:bg-gray-600 opacity-50 -z-10"></div>

            {/* ── Three Core Nodes ── */}
            <div className="flex items-center gap-24 relative z-10">

                {/* ──── Left Card: Optimise Existing Product ──── */}
                <div
                    onClick={() => handleJourneyClick('established_seller')}
                    className="hover-in-shadow-lg w-80 h-48 rounded-2xl bg-background-light dark:bg-background-dark flex flex-col justify-between p-6 cursor-pointer"
                >
                    <div className="flex items-start gap-4">
                        <div className="inner-shadow w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                            <Search size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                Optimise Existing Product
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                Audit my current price &amp; find lost margin.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end items-end">
                        <ArrowRight size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                </div>

                {/* ──── Center Node: PRICEPOINT ──── */}
                <div className="relative w-64 h-64 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-0 rounded-full outer-shadow-lg"></div>
                    <div className="absolute inset-4 rounded-full inner-shadow border-4 border-transparent dark:border-gray-700/20"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-1 bg-primary mb-3 rounded-full"></div>
                        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-widest">
                            PRICEPOINT
                        </h2>
                    </div>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 dark:bg-gray-600 rounded-r shadow-sm"></div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 dark:bg-gray-600 rounded-l shadow-sm"></div>
                </div>

                {/* ──── Right Card: Launch New Product ──── */}
                <div
                    onClick={() => handleJourneyClick('new_launcher')}
                    className="hover-in-shadow-lg w-80 h-48 rounded-2xl bg-background-light dark:bg-background-dark flex flex-col justify-between p-6 cursor-pointer"
                >
                    <div className="flex items-start gap-4">
                        <div className="inner-shadow w-12 h-12 rounded-xl flex items-center justify-center text-secondary flex-shrink-0">
                            <Rocket size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                Launch New Product
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                Build a data-backed price from scratch.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end items-end">
                        <ArrowRight size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                </div>

            </div>
        </main>
    );
};
