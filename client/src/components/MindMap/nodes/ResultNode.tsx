import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Crown, TrendingUp, Zap, FileText, X, Lock, Mail } from 'lucide-react';
import type { PricingResult } from '../../../utils/pricingEngine';
import { useSessionStore } from '../../../store/useSessionStore';
import { generateChartUrls } from '../../../utils/charts';
import { PricingReportPDF } from '../../PricingReportPDF';
import { PDFDownloadLink } from '@react-pdf/renderer';

// ============================================================
// ResultNode — Trinity Price Quote (Phase 3)
//
// Displays Budget / Recommended / Premium prices with a
// neumorphic card layout. Enforces Paywall State.
// ============================================================

interface ResultNodeData {
    result: PricingResult;
}

export const ResultNode = memo(({ data }: NodeProps<ResultNodeData>) => {
    const { result } = data;
    const [showModal, setShowModal] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportPayload, setReportPayload] = useState<{ claudeData: any; chartUrls: any; documentId: string } | null>(null);

    const isUnlocked = useSessionStore((s) => s.isUnlocked);
    const unlockQuote = useSessionStore((s) => s.unlockQuote);

    // Get currency from session (fallback to $)
    const currencySymbol = '$';

    // Handle unlocking
    const handleUnlock = () => {
        if (emailInput.trim() && emailInput.includes('@')) {
            unlockQuote(emailInput.trim());
        }
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        try {
            // Usually we do the Stripe Checkout redirect here:
            // const res = await fetch('http://localhost:3000/api/checkout', { method: 'POST', ... })
            // window.location.href = res.url;
            // 
            // For now, immediately generate the report via Mock Auth
            const fullSessionData = useSessionStore.getState();
            const payload = {
                sessionData: fullSessionData,
                pricingResult: result,
                appliedModifiers: result.appliedModifiers,
            };

            const response = await fetch('http://localhost:3000/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const data = await response.json();
            const charts = generateChartUrls(fullSessionData, result);

            setReportPayload({
                claudeData: data.claudeData,
                chartUrls: charts,
                documentId: `PP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            });
        } catch (error) {
            console.error('Error generating report:', error);
            // Fallback for UI if backend is not running
            const fullSessionData = useSessionStore.getState();
            const charts = generateChartUrls(fullSessionData, result);
            setReportPayload({
                claudeData: {
                    executiveSummary: "Pending backend connection...",
                    marketJustification: "Pending backend connection...",
                    defensibility: "Pending backend connection..."
                },
                chartUrls: charts,
                documentId: `PP-MOCK-DEV`
            });
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
            <div className={`w-full max-w-[850px] md:w-[850px] bg-background-light dark:bg-background-dark outer-shadow-lg rounded-3xl p-6 md:p-10 transition-all duration-500`}>
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
                                We've finished analyzing your unit economics, brand value, and market conditions. Enter your email to reveal your Trinity Quote and download your report.
                            </p>

                            <div className="w-full max-w-sm space-y-4">
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
                                <button
                                    onClick={handleUnlock}
                                    disabled={!emailInput.includes('@')}
                                    className={`w-full py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${emailInput.includes('@')
                                        ? 'bg-primary hover:bg-primary-dark text-white outer-shadow active:scale-95 cursor-pointer'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                        }`}
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
                            <div className="outer-shadow rounded-3xl p-6 text-center transition-all hover:-translate-y-1 duration-300 md:mb-4">
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
                            <div className="rounded-3xl p-8 text-center outer-shadow-lg ring-2 ring-[#DFA81C] bg-[#DFA81C]/5 transition-all hover:-translate-y-2 duration-300 relative z-10 scale-105">
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#DFA81C] text-white text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap shadow-lg">
                                    AI Recommended
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-[#DFA81C]/20 text-[#DFA81C] flex items-center justify-center mx-auto mb-4 mt-2">
                                    <TrendingUp size={24} />
                                </div>
                                <span className="text-xs uppercase tracking-wider text-[#DFA81C] font-bold">
                                    Optimal Price
                                </span>
                                <p className="text-4xl sm:text-5xl font-extrabold text-[#DFA81C] mt-2 drop-shadow-sm">
                                    {currencySymbol}{result.recommended.toFixed(2)}
                                </p>
                                <span className="text-xs text-slate-500 mt-3 block font-medium">
                                    Van Westendorp OPP
                                </span>
                            </div>

                            {/* Premium (Right Column) */}
                            <div className="outer-shadow rounded-3xl p-6 text-center transition-all hover:-translate-y-1 duration-300 md:mb-4">
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

                        {/* Download Button */}
                        <div className="mt-8 flex justify-center">
                            {reportPayload ? (
                                <PDFDownloadLink
                                    document={<PricingReportPDF documentId={reportPayload.documentId} claudeData={reportPayload.claudeData} chartUrls={reportPayload.chartUrls} pricingResult={result} />}
                                    fileName={`PricePoint_Intelligence_${reportPayload.documentId}.pdf`}
                                    className="px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm outer-shadow transition-all active:scale-95 flex items-center gap-2"
                                >
                                    {/* @ts-ignore */}
                                    {({ loading }) => (
                                        <>
                                            <FileText size={18} />
                                            {loading ? 'Rendering PDF...' : 'Download Investment Report'}
                                        </>
                                    )}
                                </PDFDownloadLink>
                            ) : (
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isGenerating}
                                    className="px-8 py-4 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm outer-shadow transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isGenerating ? <TrendingUp className="animate-pulse" size={18} /> : <FileText size={18} />}
                                    {isGenerating ? 'Synthesizing with Claude...' : 'Generate Full Investor Report'}
                                </button>
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
                            <X size={16} />
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
