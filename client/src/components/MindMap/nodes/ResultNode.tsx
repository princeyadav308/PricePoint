import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Crown, TrendingUp, Zap, FileText, X } from 'lucide-react';
import type { PricingResult } from '../../../utils/pricingEngine';

// ============================================================
// ResultNode — Trinity Price Quote
//
// Displays Budget / Recommended / Premium prices with a
// neumorphic card layout. "Download Report" triggers a
// Coming Soon modal (Phase 4).
// ============================================================

interface ResultNodeData {
    result: PricingResult;
}

export const ResultNode = memo(({ data }: NodeProps<ResultNodeData>) => {
    const { result } = data;
    const [showModal, setShowModal] = useState(false);

    // Get currency from session (fallback to $)
    const currencySymbol = '$';

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
            <div className="w-[660px] bg-background-light dark:bg-background-dark outer-shadow-lg rounded-2xl p-8 transition-all duration-300">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                        <Crown size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-text-light dark:text-text-dark">
                            Your Pricing Intelligence
                        </h3>
                        <p className="text-xs text-slate-400">
                            AI-calculated from your market, value, and financial data
                        </p>
                    </div>
                </div>

                {/* Trinity Cards */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                    {/* Budget */}
                    <div className="outer-shadow rounded-2xl p-5 text-center transition-all hover:scale-[1.02] duration-300">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center mx-auto mb-3">
                            <Zap size={16} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Entry Price
                        </span>
                        <p className="text-2xl font-bold text-text-light dark:text-text-dark mt-1">
                            {currencySymbol}{result.budget.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                            High Volume · Low Friction
                        </span>
                    </div>

                    {/* Recommended (Highlighted) */}
                    <div className="rounded-2xl p-5 text-center ring-2 ring-primary bg-primary/5 transition-all hover:scale-[1.02] duration-300 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                            ★ AI Recommended
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center mx-auto mb-3 mt-1">
                            <TrendingUp size={16} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-primary font-bold">
                            Optimal Price
                        </span>
                        <p className="text-3xl font-bold text-primary mt-1">
                            {currencySymbol}{result.recommended.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                            Van Westendorp OPP
                        </span>
                    </div>

                    {/* Premium */}
                    <div className="outer-shadow rounded-2xl p-5 text-center transition-all hover:scale-[1.02] duration-300">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mx-auto mb-3">
                            <Crown size={16} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                            Premium Price
                        </span>
                        <p className="text-2xl font-bold text-text-light dark:text-text-dark mt-1">
                            {currencySymbol}{result.premium.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                            High Margin · Anchor
                        </span>
                    </div>
                </div>

                {/* Analysis Summary */}
                <div className="mt-6 p-4 inner-shadow rounded-xl">
                    <div className="grid grid-cols-3 gap-4 text-center text-xs">
                        <div>
                            <span className="text-slate-400 block">Cost Base</span>
                            <span className="font-bold text-text-light dark:text-text-dark">
                                {currencySymbol}{result.analysis.costPlusBase.toFixed(2)}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Value Multiplier</span>
                            <span className="font-bold text-primary">
                                {result.analysis.valueMultiplier.toFixed(2)}x
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block">Price Range</span>
                            <span className="font-bold text-text-light dark:text-text-dark">
                                {currencySymbol}{result.analysis.vanWestendorp.floor.toFixed(0)} – {currencySymbol}{result.analysis.vanWestendorp.ceiling.toFixed(0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Download Button */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-medium text-sm outer-shadow transition-all active:scale-95 flex items-center gap-2"
                    >
                        <FileText size={16} />
                        Download Investor Report
                    </button>
                </div>
            </div>

            {/* Coming Soon Modal */}
            {showModal && (
                <div className="absolute inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black/20 rounded-2xl" onClick={() => setShowModal(false)} />
                    <div className="relative bg-background-light dark:bg-background-dark outer-shadow-lg rounded-2xl p-8 text-center max-w-[300px]">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-text-light transition-colors"
                        >
                            <X size={16} />
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                            <FileText size={28} />
                        </div>
                        <h4 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">
                            Coming in Sprint 3
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
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
