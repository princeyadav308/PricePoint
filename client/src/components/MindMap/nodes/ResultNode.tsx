import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Crown, TrendingUp, Zap, FileText, Lock, Mail, ChevronDown, Check as CheckIcon, X as XIcon, AlertTriangle } from 'lucide-react';
import type { PricingResult } from '../../../utils/pricingEngine';
import { useSessionStore } from '../../../store/useSessionStore';
import { AuthModal } from '../../AuthModal';
import { getCurrencyFromAnswers } from '../../../utils/currency';
import { supabase } from '../../../lib/supabase';

// ============================================================
// ResultNode — Trinity Price Quote (Phase 3)
//
// Displays Budget / Recommended / Premium prices with a
// neumorphic card layout. Enforces Paywall State.
// ============================================================

interface ResultNodeData {
    result: PricingResult | null;
}

// ── Mandatory Data Categories ────────────────────────────────
const MANDATORY_CATEGORIES = [
    { label: 'Price Sensitivity (Van Westendorp)', keys: ['too_cheap', 'bargain', 'getting_expensive', 'too_expensive'] },
    { label: 'Unit Economics (Cost Table)', keys: ['ue_physical', 'ue_service', 'ue_digital'] },
    { label: 'Financials (Profit Margin & Tax Rate)', keys: ['desired_margin', 'tax_rate'] },
    { label: 'Product Value (USP & Brand)', keys: ['usp_strength', 'brand_recognition', 'retention_rate'] },
];

// ── Pricing Feature Row ──────────────────────────────────────
const PricingRow = ({ label, included }: { label: string; included?: boolean }) => (
    <div className="flex items-center gap-2">
        {included ? (
            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <CheckIcon size={10} strokeWidth={3} />
            </div>
        ) : (
            <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-400 flex items-center justify-center flex-shrink-0">
                <XIcon size={10} strokeWidth={3} />
            </div>
        )}
        <span className={included ? 'text-text-light dark:text-text-dark' : 'text-slate-400 line-through'}>
            {label}
        </span>
    </div>
);

export const ResultNode = memo(({ data }: NodeProps<ResultNodeData>) => {
    const { result } = data;
    const [showModal, setShowModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [showPricing, setShowPricing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const isUnlocked = useSessionStore((s) => s.isUnlocked);
    const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
    const unlockQuote = useSessionStore((s) => s.unlockQuote);

    // Get currency from session (fallback to $)
    const answers = useSessionStore((s) => s.answers);
    const currencySymbol = getCurrencyFromAnswers(answers);

    // ── Insufficient Data Guard ──────────────────────────────
    if (!result) {
        // Find which mandatory categories are missing
        const NA_MARKER = '__NA__';
        const skippedCategories = MANDATORY_CATEGORIES.filter((cat) => {
            return !cat.keys.some((k) => {
                const val = answers[k]?.value;
                return val !== undefined && val !== null && val !== '' && val !== NA_MARKER;
            });
        });

        return (
            <div className="w-[550px] nodrag">
                <Handle type="target" position={Position.Left} id="left" className="opacity-0" />
                <div className="rounded-2xl outer-shadow bg-background-light dark:bg-background-dark p-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle size={24} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-light dark:text-text-dark">Intelligence Pending...</h2>
                            <p className="text-xs text-slate-400">Insufficient data for accurate pricing</p>
                        </div>
                    </div>

                    {/* Explanation */}
                    <div className="inner-shadow rounded-xl p-5 mb-5">
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            An Investor-Grade pricing report cannot be built on empty inputs.
                            We need real data from your pricing journey to generate a high-fidelity audit.
                        </p>
                    </div>

                    {/* Skipped Sections */}
                    {skippedCategories.length > 0 && (
                        <div className="mb-5">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mandatory Questions Skipped</p>
                            <div className="space-y-2">
                                {skippedCategories.map((cat) => (
                                    <div key={cat.label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20">
                                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                        <span className="text-xs font-medium text-red-600 dark:text-red-400">{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Instruction */}
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
                        <span className="text-primary text-lg">←</span>
                        <p className="text-xs font-medium text-primary">
                            Return to the Mind Map and answer the highlighted sections to unlock your results.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Handle unlocking
    const handleUnlock = () => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }

        // Trigger Stripe Checkout or Dodo Payments Mock
        // const res = await fetch('http://localhost:3000/api/checkout', { method: 'POST', ... })
        // window.location.href = res.url;

        // For now, unlock directly
        unlockQuote(emailInput.trim() || useSessionStore.getState().user?.email || 'user@example.com');
    };

    const handleCheckout = async (tier: 'Basic' | 'Professional' | 'Investor') => {
        setIsGenerating(true);
        try {
            const fullSessionData = useSessionStore.getState();

            // Get Supabase Session Token
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                setShowAuthModal(true);
                setIsGenerating(false);
                return;
            }

            // 1. Initialize DB Record
            const initRes = await fetch('http://127.0.0.1:3000/api/reports/initialize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionData: fullSessionData,
                    pricingResult: data.result,  // Send the calculated numbers!
                    tier: tier
                })
            });

            if (!initRes.ok) throw new Error('Failed to initialize report');
            const { documentId } = await initRes.json();

            // 2. Generate Dodo Checkout URL
            const checkoutRes = await fetch('http://127.0.0.1:3000/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId,
                    returnUrl: `${window.location.origin}/success?documentId=${documentId}`
                })
            });

            if (!checkoutRes.ok) throw new Error('Failed to generate checkout link');
            const { url } = await checkoutRes.json();

            // 3. Redirect to Dodo hosted checkout
            window.location.href = url;

        } catch (error) {
            console.error('Checkout error:', error);
            alert("Error connecting to payment provider. Please try again or check your backend.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative group">
            <Handle
                type="target"
                position={Position.Left}
                id="left"
                className="!bg-primary !w-3 !h-3 !border-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ top: '50%', transform: 'translateY(-50%)', left: -6 }}
            />

            {/* Main Card */}
            <div className={`w-full max-w-[1100px] md:w-[1100px] bg-background-light dark:bg-background-dark outer-shadow-lg rounded-3xl p-6 md:p-10 transition-all duration-500`}>
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center outer-shadow">
                        <Crown size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-text-light dark:text-text-dark">
                            Your Pricing Intelligence
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            AI-calculated from your market, value, and financial data
                        </p>
                    </div>
                </div>

                {!isUnlocked ? (
                    // ==========================================
                    // LOCKED STATE (PAYWALL)
                    // ==========================================
                    <div className="relative mt-8 inner-shadow rounded-2xl p-8 overflow-hidden bg-background-light dark:bg-background-dark">

                        {/* Fake Skeletons Background to give the illusion of data */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none p-8 blur-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                                <div className="h-40 outer-shadow rounded-2xl"></div>
                                <div className="h-48 outer-shadow rounded-2xl"></div>
                                <div className="h-40 outer-shadow rounded-2xl"></div>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col items-center justify-center text-center py-8">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center outer-shadow mb-6">
                                <Lock size={32} />
                            </div>
                            <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-2">
                                Your Custom Quote is Ready
                            </h4>
                            <p className="text-sm text-slate-500 max-w-md mb-8 leading-relaxed">
                                We've finished analyzing your unit economics, brand value, and market conditions. {isAuthenticated ? 'Click below to reveal your Trinity Quote and download your report.' : 'Enter your email to reveal your Trinity Quote and download your report.'}
                            </p>

                            <div className="w-full max-w-sm space-y-4">
                                {!isAuthenticated && (
                                    <div className="relative flex items-center">
                                        <div className="absolute left-4 text-slate-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="founder@startup.com"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                            onPointerDown={(e) => e.stopPropagation()} // stop React Flow drag
                                            className="w-full bg-background-light dark:bg-background-dark inner-shadow rounded-full pl-12 pr-6 py-4 text-sm text-text-light dark:text-text-dark outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={handleUnlock}
                                    className={`w-full py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white outer-shadow active:scale-95 cursor-pointer`}
                                >
                                    Reveal Intelligence
                                    <TrendingUp size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // ==========================================
                    // UNLOCKED STATE (REVEAL)
                    // ==========================================
                    <div className="mt-8 animate-in fade-in zoom-in duration-500">
                        {/* 3-Column Neumorphic UI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end">

                            {/* Budget (Left Column) */}
                            <div className="outer-shadow rounded-3xl p-6 text-center transition-all duration-300 md:mb-4 hover-in-shadow cursor-default">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mx-auto mb-4">
                                    <Zap size={20} />
                                </div>
                                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                                    Entry Price
                                </span>
                                <p className="text-3xl font-bold text-text-light dark:text-text-dark mt-2">
                                    {currencySymbol}{result.budget.toFixed(2)}
                                </p>
                                <span className="text-xs text-slate-400 mt-2 block font-medium">
                                    High Volume · Low Friction
                                </span>
                            </div>

                            {/* Recommended (Center Column - Elevated with Gold Accent) */}
                            <div className="rounded-3xl p-8 text-center outer-shadow-lg ring-2 ring-[#DFA81C] bg-[#DFA81C]/5 transition-all duration-300 relative z-10 scale-105 hover-in-shadow cursor-default">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#DFA81C] text-white text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg">
                                    AI Recommended
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-[#DFA81C]/20 text-[#DFA81C] flex items-center justify-center mx-auto mb-4 mt-2">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-xs uppercase tracking-wider text-[#DFA81C] font-bold">
                                    Optimal Price
                                </span>
                                <p className="font-extrabold text-[#DFA81C] mt-2 drop-shadow-sm leading-tight" style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}>
                                    {currencySymbol}{result.recommended.toFixed(2)}
                                </p>
                                <span className="text-xs text-slate-500 mt-3 block font-medium">
                                    Van Westendorp OPP
                                </span>
                            </div>

                            {/* Premium (Right Column) */}
                            <div className="outer-shadow rounded-3xl p-6 text-center transition-all duration-300 md:mb-4 hover-in-shadow cursor-default">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mx-auto mb-4">
                                    <Crown size={20} />
                                </div>
                                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                                    Premium Price
                                </span>
                                <p className="text-3xl font-bold text-text-light dark:text-text-dark mt-2">
                                    {currencySymbol}{result.premium.toFixed(2)}
                                </p>
                                <span className="text-xs text-slate-400 mt-2 block font-medium">
                                    High Margin · Anchor
                                </span>
                            </div>
                        </div>

                        {/* Market Modifiers */}
                        {result.appliedModifiers && result.appliedModifiers.length > 0 && (
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                {result.appliedModifiers.map((mod) => (
                                    <span key={mod} className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 outer-shadow border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1.5">
                                        {mod === 'BLUE_OCEAN' && '🌊 Blue Ocean Bonus'}
                                        {mod === 'HIGH_SATURATION' && '⚠️ Saturation Penalty'}
                                        {mod === 'MARKET_GRAVITY_APPLIED' && '📉 Market Gravity Applied'}
                                        {mod === 'MARGIN_PROTECTION' && '🛡️ Margin Protection'}
                                        {!['BLUE_OCEAN', 'HIGH_SATURATION', 'MARKET_GRAVITY_APPLIED', 'MARGIN_PROTECTION'].includes(mod) && mod.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Analysis Summary */}
                        <div className="mt-10 p-5 inner-shadow rounded-2xl">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
                                <div>
                                    <span className="text-slate-400 block mb-1">Cost Base</span>
                                    <span className="font-bold text-text-light dark:text-text-dark">
                                        {currencySymbol}{result.analysis.costPlusBase.toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-1">Value Multiplier</span>
                                    <span className="font-bold text-primary">
                                        {result.analysis.valueMultiplier.toFixed(2)}x
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block mb-1">Price Range</span>
                                    <span className="font-bold text-text-light dark:text-text-dark">
                                        {currencySymbol}{result.analysis.vanWestendorp.floor.toFixed(0)} – {currencySymbol}{result.analysis.vanWestendorp.ceiling.toFixed(0)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Download Report CTA */}
                        <div className="mt-8 flex flex-col items-center gap-4">
                            <button
                                onClick={() => setShowPricing(!showPricing)}
                                className="px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm outer-shadow transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FileText size={18} />
                                Download Detailed Report
                                <ChevronDown size={16} className={`transition-transform duration-300 ${showPricing ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Pricing Comparison Table */}
                            {showPricing && (
                                <div className="w-full mt-6 animate-in slide-in-from-top-4 fade-in duration-500">
                                    {/* 3-Tier Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

                                        {/* ── Basic Tier ── */}
                                        <div className="outer-shadow rounded-2xl p-6 flex flex-col transition-all duration-300 hover-in-shadow cursor-default">
                                            <div className="text-center mb-5">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mx-auto mb-3">
                                                    <Zap size={20} />
                                                </div>
                                                <h4 className="text-base font-bold text-text-light dark:text-text-dark">The Founder's Compass</h4>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Best for solo validation and personal reference.</p>
                                                <p className="text-3xl font-extrabold text-text-light dark:text-text-dark mt-3">$299</p>
                                            </div>
                                            <div className="space-y-2.5 flex-1 text-xs">
                                                <PricingRow included label="1,000-word concise analysis" />
                                                <PricingRow included label="Full 7-part Trinity Report" />
                                                <PricingRow included label="7–10 Pages PDF" />
                                                <PricingRow included label="Verified URL + Document ID" />
                                                <PricingRow included label="Full Audit Trail" />
                                                <PricingRow included label="Legal Disclaimer" />
                                                <PricingRow label="Custom logo integration" />
                                                <PricingRow label="Editable DOCX version" />
                                                <PricingRow label="Competitor benchmarking" />
                                                <PricingRow label="Defensibility Thesis" />
                                                <PricingRow label="Re-generation credits" />
                                            </div>
                                            <button
                                                onClick={() => handleCheckout('Basic')}
                                                disabled={isGenerating}
                                                className="mt-5 w-full py-3 rounded-full bg-background-light dark:bg-background-dark text-slate-600 dark:text-slate-300 hover:text-text-light dark:hover:text-text-dark font-bold text-xs outer-shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {isGenerating ? 'Processing...' : 'Get Basic Report'}
                                            </button>
                                        </div>

                                        {/* ── Professional Tier (Highlighted) ── */}
                                        <div className="outer-shadow-lg rounded-2xl p-6 flex flex-col ring-2 ring-[#DFA81C] bg-[#DFA81C]/5 relative transition-all duration-300 hover-in-shadow cursor-default">
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#DFA81C] text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg">
                                                Most Popular
                                            </div>
                                            <div className="text-center mb-5 mt-2">
                                                <div className="w-10 h-10 rounded-xl bg-[#DFA81C]/20 text-[#DFA81C] flex items-center justify-center mx-auto mb-3">
                                                    <TrendingUp size={20} />
                                                </div>
                                                <h4 className="text-base font-bold text-text-light dark:text-text-dark">The Boardroom Standard</h4>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Best for team alignment and scaling decisions.</p>
                                                <p className="text-3xl font-extrabold text-[#DFA81C] mt-3">$799</p>
                                            </div>
                                            <div className="space-y-2.5 flex-1 text-xs">
                                                <PricingRow included label="2,000-word Senior Analyst narrative" />
                                                <PricingRow included label="Deep comparative research" />
                                                <PricingRow included label="20–40 Pages PDF + DOCX" />
                                                <PricingRow included label="Verified URL + Document ID" />
                                                <PricingRow included label="Full Audit Trail" />
                                                <PricingRow included label="Legal Disclaimer" />
                                                <PricingRow included label="Custom logo integration" />
                                                <PricingRow included label="Editable DOCX for team" />
                                                <PricingRow included label="3+ competitor benchmarks" />
                                                <PricingRow label="Defensibility Thesis" />
                                                <PricingRow label="Re-generation credits" />
                                            </div>
                                            <button
                                                onClick={() => handleCheckout('Professional')}
                                                disabled={isGenerating}
                                                className="mt-5 w-full py-3 rounded-full bg-[#DFA81C] hover:bg-[#c99517] text-white font-bold text-xs outer-shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {isGenerating ? 'Processing...' : 'Get Professional Report'}
                                            </button>
                                        </div>

                                        {/* ── Investor Pack Tier ── */}
                                        <div className="outer-shadow rounded-2xl p-6 flex flex-col transition-all duration-300 hover-in-shadow cursor-default">
                                            <div className="text-center mb-5">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mx-auto mb-3">
                                                    <Crown size={20} />
                                                </div>
                                                <h4 className="text-base font-bold text-text-light dark:text-text-dark">The Capital Catalyst</h4>
                                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">Best for fundraising, M&A, and retail expansion.</p>
                                                <p className="text-3xl font-extrabold text-text-light dark:text-text-dark mt-3">$1,999</p>
                                            </div>
                                            <div className="space-y-2.5 flex-1 text-xs">
                                                <PricingRow included label="4,000+ word McKinsey-level deep dive" />
                                                <PricingRow included label="Revenue projections & resilience" />
                                                <PricingRow included label="40–60 Pages PDF + DOCX" />
                                                <PricingRow included label="Priority AI re-analysis (1-on-1)" />
                                                <PricingRow included label="Full Audit Trail" />
                                                <PricingRow included label="Legal Disclaimer" />
                                                <PricingRow included label="White-label + Seal of Authority" />
                                                <PricingRow included label="Editable DOCX for team" />
                                                <PricingRow included label="Comprehensive benchmarking" />
                                                <PricingRow included label="Defensibility Thesis + Roadmap" />
                                                <PricingRow included label="2 Re-generations (30-day)" />
                                            </div>
                                            <button
                                                onClick={() => handleCheckout('Investor')}
                                                disabled={isGenerating}
                                                className="mt-5 w-full py-3 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs outer-shadow transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                            >
                                                {isGenerating ? 'Processing...' : 'Get Investor Pack'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Note */}
                                    <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
                                        Every report includes the Full Audit Trail, Trinity Price Model, and Legal Shield. Prices are one-time.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Coming Soon Modal */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-background-light dark:bg-background-dark outer-shadow-lg rounded-3xl p-8 text-center max-w-sm w-full animate-in zoom-in duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-text-light transition-colors w-8 h-8 flex items-center justify-center rounded-full inner-shadow"
                        >
                            <XIcon size={16} />
                        </button>
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                            <FileText size={32} />
                        </div>
                        <h4 className="text-xl font-bold text-text-light dark:text-text-dark mb-3">
                            Coming in Phase 4
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            The full Investor Report with executive summary, Van Westendorp charts, and tax
                            breakdowns will be available in the next release.
                        </p>
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => {
                    setShowAuthModal(false);
                    // Automatically trigger the unlock/payment flow once authenticated
                    handleUnlock();
                }}
            />

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
