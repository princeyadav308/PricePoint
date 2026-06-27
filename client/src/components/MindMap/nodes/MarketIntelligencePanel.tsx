import { memo, useEffect, useRef } from 'react';
import {
    Globe, TrendingUp, Search, ExternalLink,
    Sparkles, Loader2, AlertCircle, BarChart3,
    DollarSign, Users, Zap,
} from 'lucide-react';
import { useIntelligenceStore } from '../../../store/useIntelligenceStore';
import type { AsyncStatus, CompetitorPricing, DemandData } from '../../../store/useIntelligenceStore';

// ============================================================
// MarketIntelligencePanel — Embedded in market_research stage
//
// Shows competitor pricing table + market demand card.
// Data loads in the background after product_classification.
// ============================================================

// ── Shimmer Skeleton Row ─────────────────────────────────────
const ShimmerRow = () => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl inner-shadow bg-background-light dark:bg-background-dark animate-pulse">
        <div className="w-24 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="w-16 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
    </div>
);

// ── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status, label }: { status: AsyncStatus; label: string }) => {
    if (status === 'idle') return null;

    return (
        <span className={`
            inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full
            transition-all duration-300
            ${status === 'loading'
                ? 'bg-primary/10 text-primary animate-pulse'
                : status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
            }
        `}>
            {status === 'loading' && <Loader2 size={10} className="animate-spin" />}
            {status === 'success' && <Sparkles size={10} />}
            {status === 'failed' && <AlertCircle size={10} />}
            {label}
        </span>
    );
};

// ── Competitor Pricing Table ─────────────────────────────────
const CompetitorPricingTable = memo(({
    pricing,
    status,
}: {
    pricing: CompetitorPricing[];
    status: AsyncStatus;
}) => {
    if (status === 'idle') return null;

    return (
        <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-background-light dark:bg-background-dark outer-shadow text-primary transition-all duration-300 hover:scale-105">
                        <Globe size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Competitor Pricing
                    </span>
                </div>
                <StatusBadge
                    status={status}
                    label={status === 'loading' ? 'Scraping...' : status === 'success' ? 'Auto-scraped' : 'Unavailable'}
                />
            </div>

            {/* Loading State */}
            {status === 'loading' && (
                <div className="space-y-2">
                    <ShimmerRow />
                    <ShimmerRow />
                    <ShimmerRow />
                </div>
            )}

            {/* Success State — Table */}
            {status === 'success' && pricing.length > 0 && (
                <div className="rounded-xl outer-shadow bg-background-light dark:bg-background-dark overflow-hidden transition-all duration-300 hover:shadow-none">
                    {/* Table Header */}
                    <div className="flex items-center px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-700/30">
                        <span className="flex-1">Competitor</span>
                        <span className="w-28 text-center">Plans</span>
                        <span className="w-24 text-right">Price Range</span>
                        <span className="w-20 text-right">Model</span>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/30">
                        {pricing.map((cp, idx) => {
                            const domain = (() => {
                                try { return new URL(cp.url).hostname.replace('www.', ''); }
                                catch { return cp.url; }
                            })();

                            const prices = cp.plans
                                .filter(p => p.price > 0)
                                .map(p => p.price)
                                .sort((a, b) => a - b);

                            const priceRange = prices.length > 0
                                ? prices.length === 1
                                    ? `$${prices[0]}`
                                    : `$${prices[0]} – $${prices[prices.length - 1]}`
                                : '—';

                            return (
                                <div
                                    key={idx}
                                    className="flex items-center px-4 py-3 text-xs transition-all duration-300 hover:bg-primary/5 group cursor-default"
                                >
                                    {/* Competitor Name */}
                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                        <span className="font-medium text-text-light dark:text-text-dark truncate">
                                            {domain}
                                        </span>
                                        <a
                                            href={cp.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-primary hover:text-primary-dark"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ExternalLink size={11} />
                                        </a>
                                    </div>

                                    {/* Plan Count */}
                                    <div className="w-28 text-center">
                                        {cp.pricingNotFound ? (
                                            <span className="text-slate-400 italic text-[10px]">Not found</span>
                                        ) : (
                                            <div className="flex items-center justify-center gap-1.5">
                                                {cp.plans.slice(0, 3).map((plan, pi) => (
                                                    <span
                                                        key={pi}
                                                        className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-background-light dark:bg-background-dark inner-shadow text-slate-500 dark:text-slate-400 truncate max-w-[70px] transition-all duration-300 hover:text-primary hover:bg-primary/5"
                                                        title={`${plan.name}: $${plan.price}/${plan.billingCycle}`}
                                                    >
                                                        {plan.name}
                                                    </span>
                                                ))}
                                                {cp.plans.length > 3 && (
                                                    <span className="text-[9px] text-slate-400">+{cp.plans.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Range */}
                                    <span className="w-24 text-right font-bold text-text-light dark:text-text-dark">
                                        {priceRange}
                                    </span>

                                    {/* Model */}
                                    <span className="w-20 text-right text-[10px] text-slate-400 capitalize">
                                        {cp.pricingModelType !== 'unknown' ? cp.pricingModelType : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Free Tier Indicator */}
                    {pricing.some(cp => cp.hasFreeTrialOrFreeTier) && (
                        <div className="px-4 py-2 border-t border-slate-200/50 dark:border-slate-700/30 flex items-center gap-1.5">
                            <Zap size={10} className="text-emerald-500" />
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                {pricing.filter(cp => cp.hasFreeTrialOrFreeTier).length} competitor(s) offer free tier/trial
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* No Pricing Found */}
            {status === 'success' && pricing.length === 0 && (
                <div className="px-4 py-3 rounded-xl inner-shadow bg-background-light dark:bg-background-dark text-xs text-slate-400 italic">
                    No competitor pricing data available — enter prices manually below.
                </div>
            )}

            {/* Failed State */}
            {status === 'failed' && (
                <div className="px-4 py-3 rounded-xl inner-shadow bg-background-light dark:bg-background-dark text-xs text-slate-400 italic">
                    Competitor scraping unavailable — enter competitor prices manually below.
                </div>
            )}
        </div>
    );
});

// ── Market Demand Card ───────────────────────────────────────
const MarketDemandCard = memo(({
    demand,
    status,
}: {
    demand: DemandData | null;
    status: AsyncStatus;
}) => {
    if (status === 'idle') return null;

    const signalColor = demand?.demandSignal === 'Strong'
        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
        : demand?.demandSignal === 'Moderate'
            ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
            : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';

    return (
        <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-background-light dark:bg-background-dark outer-shadow text-primary transition-all duration-300 hover:scale-105">
                        <BarChart3 size={13} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Market Demand Signal
                    </span>
                </div>
                <StatusBadge
                    status={status}
                    label={status === 'loading' ? 'Analysing...' : status === 'success' ? 'DataForSEO' : 'Unavailable'}
                />
            </div>

            {/* Loading */}
            {status === 'loading' && (
                <div className="rounded-xl inner-shadow bg-background-light dark:bg-background-dark px-4 py-4 animate-pulse">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-8 rounded-lg bg-slate-200 dark:bg-slate-700" />
                        <div className="flex-1 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                    </div>
                </div>
            )}

            {/* Success */}
            {status === 'success' && demand && (
                <div className="rounded-xl outer-shadow bg-background-light dark:bg-background-dark p-4 space-y-3 transition-all duration-300 hover:shadow-none">
                    {/* Demand Signal Chip + Keyword */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Search size={12} className="text-slate-400" />
                            <span className="text-xs font-medium text-text-light dark:text-text-dark">
                                "{demand.keyword}"
                            </span>
                        </div>
                        {demand.demandSignal && (
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${signalColor} transition-all duration-300 hover:scale-105`}>
                                {demand.demandSignal} Demand
                            </span>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Monthly Volume */}
                        <div className="rounded-lg inner-shadow px-3 py-2 text-center transition-all duration-300 hover:bg-primary/5">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Users size={10} className="text-primary" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Volume</span>
                            </div>
                            <span className="text-sm font-bold text-text-light dark:text-text-dark">
                                {demand.monthlySearchVolume
                                    ? demand.monthlySearchVolume.toLocaleString()
                                    : '—'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">/month</span>
                        </div>

                        {/* CPC */}
                        <div className="rounded-lg inner-shadow px-3 py-2 text-center transition-all duration-300 hover:bg-primary/5">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <DollarSign size={10} className="text-primary" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">CPC</span>
                            </div>
                            <span className="text-sm font-bold text-text-light dark:text-text-dark">
                                {demand.costPerClick
                                    ? `$${demand.costPerClick.toFixed(2)}`
                                    : '—'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">per click</span>
                        </div>

                        {/* Competition */}
                        <div className="rounded-lg inner-shadow px-3 py-2 text-center transition-all duration-300 hover:bg-primary/5">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp size={10} className="text-primary" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Competition</span>
                            </div>
                            <span className="text-sm font-bold text-text-light dark:text-text-dark capitalize">
                                {demand.competitionLevel?.toLowerCase() || '—'}
                            </span>
                            <span className="text-[9px] text-slate-400 block">level</span>
                        </div>
                    </div>

                    {/* Interpretation */}
                    {demand.demandInterpretation && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed italic px-1">
                            💡 {demand.demandInterpretation}
                        </p>
                    )}

                    {/* Tier Limited Message */}
                    {demand.tierLimited && (
                        <p className="text-[10px] text-amber-500 font-medium px-1">
                            ⚡ Full demand analytics available on Founder Ready+ tiers.
                        </p>
                    )}
                </div>
            )}

            {/* Failed */}
            {status === 'failed' && (
                <div className="px-4 py-3 rounded-xl inner-shadow bg-background-light dark:bg-background-dark text-xs text-slate-400 italic">
                    Market demand data unavailable — this won't affect your pricing calculation.
                </div>
            )}
        </div>
    );
});

// ── Market Price Range Summary ────────────────────────────────
const MarketPriceRangeSummary = memo(({
    range,
}: {
    range: { min: number; max: number; average: number; median: number } | null;
}) => {
    if (!range) return null;

    return (
        <div className="rounded-xl outer-shadow bg-background-light dark:bg-background-dark p-4 transition-all duration-300 hover:shadow-none">
            <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 text-primary transition-all duration-300 hover:scale-105">
                    <DollarSign size={13} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Market Price Range
                </span>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <Sparkles size={9} /> Computed
                </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'Min', value: range.min },
                    { label: 'Average', value: range.average },
                    { label: 'Median', value: range.median },
                    { label: 'Max', value: range.max },
                ].map(({ label, value }) => (
                    <div key={label} className="text-center rounded-lg inner-shadow px-2 py-2 transition-all duration-300 hover:bg-primary/5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{label}</span>
                        <span className="text-sm font-bold text-text-light dark:text-text-dark">${value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════
// Main Panel
// ═══════════════════════════════════════════════════════════════
export const MarketIntelligencePanel = memo(() => {
    const competitorPricing = useIntelligenceStore((s) => s.competitorPricing);
    const pricingStatus = useIntelligenceStore((s) => s.pricingStatus);
    const demandData = useIntelligenceStore((s) => s.demandData);
    const demandStatus = useIntelligenceStore((s) => s.demandStatus);
    const marketPriceRange = useIntelligenceStore((s) => s.marketPriceRange);
    const competitorStatus = useIntelligenceStore((s) => s.competitorStatus);
    const discoveredCompetitors = useIntelligenceStore((s) => s.discoveredCompetitors);
    const runPriceScraping = useIntelligenceStore((s) => s.runPriceScraping);

    // Auto-trigger price scraping once competitors are discovered
    const hasFiredScrape = useRef(false);
    useEffect(() => {
        if (
            competitorStatus === 'success' &&
            discoveredCompetitors.length > 0 &&
            pricingStatus === 'idle' &&
            !hasFiredScrape.current
        ) {
            hasFiredScrape.current = true;
            const urls = discoveredCompetitors.map((c) => c.url).filter(Boolean);
            if (urls.length > 0) {
                runPriceScraping(urls);
            }
        }
    }, [competitorStatus, discoveredCompetitors, pricingStatus, runPriceScraping]);

    // Only render if any intelligence pipeline is active
    const isActive = pricingStatus !== 'idle' || demandStatus !== 'idle' || competitorStatus === 'loading';
    if (!isActive) return null;

    return (
        <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 nodrag">
            {/* Section Divider */}
            <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={10} />
                    Market Intelligence
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Market Price Range Summary */}
            <MarketPriceRangeSummary range={marketPriceRange} />

            {/* Competitor Pricing Table */}
            <CompetitorPricingTable
                pricing={competitorPricing}
                status={pricingStatus !== 'idle' ? pricingStatus : competitorStatus}
            />

            {/* Market Demand Card */}
            <MarketDemandCard
                demand={demandData}
                status={demandStatus}
            />
        </div>
    );
});
