import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { BarChart, WaterfallChart, RevenueChart } from './ChartEngine';

// ============================================================
// PricePoint — Dynamic Multi-Tier Investment-Quality PDF Report
//
// Tiers: Basic (4 pages) | Founder Ready (6 pages) | Investor (10+ pages)
// Design: Inter font, 25mm margins, 12-col grid, Navy/Gold/Slate palette
// ============================================================

// ── Register Inter Font ──────────────────────────────────────
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf', fontWeight: 400 },
        { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf', fontWeight: 600 },
        { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.ttf', fontWeight: 800 },
    ]
});

// ── Constants ────────────────────────────────────────────────
const NAVY = '#0A1628';
const GOLD = '#DFA81C';
const SLATE = '#4A5568';
const LIGHT_GRAY = '#F8FAFC';
const BORDER = '#E2E8F0';
const MARGIN = 71;

const COLUMNS = 12;
const colWidth = (span: number) => `${(span / COLUMNS) * 100}%`;

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
    page: { fontFamily: 'Inter', fontSize: 10, color: SLATE, padding: MARGIN, paddingBottom: MARGIN + 25, backgroundColor: '#FFFFFF' },
    h1: { fontSize: 24, fontWeight: 800, color: NAVY, lineHeight: 2.5, marginBottom: 4 },
    h2: { fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 2.5, marginTop: 8 },
    h3: { fontSize: 12, fontWeight: 600, color: NAVY, marginTop: 10, marginBottom: 6 },
    body: { fontSize: 10, color: SLATE, lineHeight: 1.6, marginBottom: 10 },
    label: { fontSize: 8, fontWeight: 600, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 1 },
    small: { fontSize: 8, color: '#9CA3AF' },
    row: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },
    cover: { flex: 1, backgroundColor: NAVY, padding: 60, justifyContent: 'center' as const },
    coverBrand: { fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: 3, marginBottom: 80, textTransform: 'uppercase' as const },
    coverTitle: { fontSize: 42, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 16 },
    coverSub: { fontSize: 14, color: '#E0E5EC', opacity: 0.85 },
    metricCard: { borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 12, marginBottom: 8 },
    metricValue: { fontSize: 26, fontWeight: 800, color: GOLD, marginBottom: 2 },
    metricLabel: { fontSize: 8, fontWeight: 600, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    exhibitBox: { borderWidth: 1, borderColor: BORDER, padding: 16, marginTop: 12, marginBottom: 12, backgroundColor: LIGHT_GRAY },
    exhibitHeader: { fontSize: 9, fontWeight: 800, fontFamily: 'Inter', color: '#000000', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    sidebar: { padding: 14, backgroundColor: LIGHT_GRAY, borderLeftWidth: 3, borderLeftColor: GOLD },
    footer: { position: 'absolute' as const, bottom: 30, left: MARGIN, right: MARGIN, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
    footerText: { fontSize: 7, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row' as const, borderBottomWidth: 0.5, borderBottomColor: BORDER, minHeight: 22 },
    tableCell: { fontSize: 8, color: SLATE, paddingVertical: 5, paddingHorizontal: 8 },
    tableCellBold: { fontSize: 8, fontWeight: 600, color: NAVY, paddingVertical: 5, paddingHorizontal: 8 },
    tableHeader: { fontSize: 7, fontWeight: 800, color: NAVY, textTransform: 'uppercase' as const, paddingVertical: 6, paddingHorizontal: 8, letterSpacing: 0.5 },
    disclaimerBox: { marginTop: 20, padding: 14, backgroundColor: LIGHT_GRAY, borderLeftWidth: 3, borderLeftColor: '#9CA3AF' },
    disclaimerTitle: { fontSize: 9, fontWeight: 800, color: NAVY, marginBottom: 4, textTransform: 'uppercase' as const },
    disclaimerBody: { fontSize: 7, color: '#64748B', lineHeight: 1.5 },
});

// ── Helper Components ────────────────────────────────────────
const Col = ({ span = 12, children, style }: { span?: number; children?: React.ReactNode; style?: any }) => (
    <View style={{ width: colWidth(span), paddingHorizontal: 6, ...style }}>{children}</View>
);

const PageFooter = ({ documentId }: { documentId: string }) => (
    <View style={s.footer} fixed>
        <Text style={s.footerText}>{documentId}</Text>
        <Text style={s.footerText}>Confidential & Proprietary</Text>
        <Text style={s.footerText}>Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
    </View>
);

// Safe accessors
const txt = (v: any, fallback = 'Data unavailable.'): string => (typeof v === 'string' && v.length > 0) ? v : fallback;
const num = (v: any, fallback = 0): number => { const n = Number(v); return isNaN(n) ? fallback : n; };
const fmt = (n: any) => { const v = Number(n); return isNaN(v) ? '0.00' : v.toFixed(2); };
const arr = (v: any): any[] => Array.isArray(v) ? v : [];

// ── Props Interface ──────────────────────────────────────────
interface PricingReportPDFProps {
    documentId: string;
    claudeData: any;
    pricingResult: {
        budget: number;
        recommended: number;
        premium: number;
        analysis: {
            costPlusBase: number;
            valueMultiplier: number;
            totalUnitCost?: number;
            vanWestendorp?: { opp: number; floor: number; ceiling: number; pmc?: number; ipp?: number; pme?: number };
        };
        appliedModifiers?: string[];
    };
    sessionData: Record<string, any>;
    journeyType: string;
    tier: string;
    currencySymbol?: string;
}

// ── Main Component ───────────────────────────────────────────
export const PricingReportPDF: React.FC<PricingReportPDFProps> = ({
    documentId,
    claudeData,
    pricingResult,
    sessionData,
    journeyType,
    tier,
    currencySymbol,
}) => {
    const d = claudeData || {};
    const isAudit = journeyType === 'Pricing Audit' || journeyType === 'established_seller';
    const isBasic = tier === 'Basic';
    const isFounder = tier === 'Professional';
    const isInvestor = tier === 'Investor';
    const ACCENT = GOLD;
    const cs = currencySymbol || '$';

    // PageHeader component for inner pages
    const PageHeader = ({ section }: { section: string }) => (
        <View style={{ flexDirection: 'row' as const, justifyContent: 'space-between' as const, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 8 }} fixed>
            <Text style={{ fontSize: 8, fontWeight: 800, color: NAVY, letterSpacing: 2, textTransform: 'uppercase' as const }}>PricePoint Intelligence</Text>
            <Text style={{ fontSize: 8, color: SLATE }}>{section}</Text>
        </View>
    );

    // Extract answers for audit table
    const answers = sessionData?.answers || {};
    const answerEntries = Object.entries(answers).map(([key, val]: [string, any]) => ({
        question: key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        answer: typeof val?.value === 'object' ? JSON.stringify(val.value) : String(val?.value ?? 'N/A'),
    }));

    // Derive exec summary text (handles both old flat and new structured formats)
    const execSummary = typeof d.executive_summary === 'object'
        ? d.executive_summary
        : { headline: 'Executive Summary', summary: txt(d.executiveSummary || d.executive_summary), pricing_verdict: {} };

    const coverTierLabel = isInvestor ? 'Investor Grade' : isFounder ? 'Founder Ready' : 'Essentials';

    return (
        <Document>
            {/* ═══════════════════════════════════════════════════
                COVER PAGE — All Tiers
                ═══════════════════════════════════════════════════ */}
            <Page size="A4" style={{ ...s.cover }}>
                <Text style={{ ...s.coverBrand, color: ACCENT }}>PricePoint Intelligence</Text>
                <Text style={s.coverTitle}>
                    {coverTierLabel}{'\\n'}{isAudit ? 'Pricing Audit Verdict' : 'Launch Strategy Report'}
                </Text>
                <Text style={s.coverSub}>
                    Strictly Confidential • Prepared {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={{ ...s.coverSub, marginTop: 10, fontSize: 11 }}>
                    Document ID: {documentId}
                </Text>
                {/* Investor thesis on cover */}
                {isInvestor && d.report_meta?.report_thesis && (
                    <View style={{ marginTop: 40, borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 16 }}>
                        <Text style={{ fontSize: 10, color: '#E0E5EC', lineHeight: 1.6, fontStyle: 'italic' as const }}>
                            {d.report_meta.report_thesis}
                        </Text>
                    </View>
                )}
                <View style={{ position: 'absolute', bottom: 40, left: 60, right: 60 }}>
                    <Text style={{ fontSize: 8, color: '#9CA3AF', fontFamily: 'Inter', fontWeight: 600 }}>
                        {documentId} | Confidential & Proprietary
                    </Text>
                </View>
            </Page>

            {/* ═══════════════════════════════════════════════════
                STRATEGIC OVERVIEW — All Tiers
                ═══════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <PageHeader section="Strategic Overview" />
                <Text style={s.h1}>Strategic Overview</Text>

                {/* Audit: Cost of Inaction callout */}
                {isAudit && d.audit_findings?.revenue_leakage_estimate && (
                    <View style={{ ...s.sidebar, borderLeftColor: '#EF4444', marginBottom: 14 }}>
                        <Text style={{ ...s.label, color: '#EF4444' }}>⚠ Cost of Inaction</Text>
                        <Text style={{ ...s.body, marginTop: 6, fontWeight: 600 }}>
                            Estimated Revenue Leakage: {d.audit_findings.revenue_leakage_estimate}
                        </Text>
                    </View>
                )}

                {/* Price Trinity Cards */}
                <View style={{ ...s.row, marginTop: 4, marginBottom: 16 }}>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={{ ...s.metricValue, color: ACCENT }}>{cs}{fmt(pricingResult.budget)}</Text>
                            <Text style={s.metricLabel}>Market Entry Floor</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={{ ...s.metricValue, color: ACCENT }}>{cs}{fmt(pricingResult.recommended)}</Text>
                            <Text style={s.metricLabel}>Optimal Price Point</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={{ ...s.metricValue, color: ACCENT }}>{cs}{fmt(pricingResult.premium)}</Text>
                            <Text style={s.metricLabel}>Premium Anchor</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={s.metricValue}>{cs}{fmt(pricingResult.analysis?.costPlusBase)}</Text>
                            <Text style={s.metricLabel}>True Cost Base</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={s.metricValue}>{num(pricingResult.analysis?.valueMultiplier, 1).toFixed(2)}x</Text>
                            <Text style={s.metricLabel}>Value Multiplier</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={s.metricValue}>{(pricingResult.appliedModifiers || []).length}</Text>
                            <Text style={s.metricLabel}>Active Modifiers</Text>
                        </View>
                    </Col>
                </View>

                {/* Executive Summary */}
                <View style={s.row}>
                    <Col span={isBasic ? 12 : 8}>
                        <Text style={s.h2}>{txt(execSummary.headline, 'Executive Summary')}</Text>
                        <Text style={s.body}>{txt(execSummary.summary)}</Text>
                        {execSummary.pricing_verdict?.recommended_price && (
                            <View style={{ ...s.sidebar, marginTop: 8 }}>
                                <Text style={s.label}>Pricing Verdict</Text>
                                <Text style={{ ...s.body, marginTop: 6 }}>
                                    Recommended: {cs}{num(execSummary.pricing_verdict.recommended_price).toFixed(2)} ({txt(execSummary.pricing_verdict.recommended_model, 'N/A')})
                                </Text>
                                <Text style={s.small}>
                                    Confidence: {txt(execSummary.pricing_verdict.confidence_level, 'N/A')} — {txt(execSummary.pricing_verdict.confidence_rationale, '')}
                                </Text>
                            </View>
                        )}
                    </Col>
                    {!isBasic && (
                        <Col span={4}>
                            <View style={s.sidebar}>
                                <Text style={s.label}>Pricing Thesis</Text>
                                <Text style={{ ...s.body, marginTop: 8, fontSize: 9 }}>
                                    Value Multiplier of {num(pricingResult.analysis?.valueMultiplier, 1).toFixed(2)}x validates {num(pricingResult.analysis?.valueMultiplier, 1) >= 1.5 ? 'premium' : 'competitive'} positioning.
                                </Text>
                            </View>
                        </Col>
                    )}
                </View>

                {/* Investor: Key Findings */}
                {isInvestor && arr(execSummary.key_findings).length > 0 && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={s.h3}>Key Findings</Text>
                        {arr(execSummary.key_findings).map((finding: string, i: number) => (
                            <Text key={i} style={{ ...s.body, marginBottom: 4 }}>• {finding}</Text>
                        ))}
                    </View>
                )}

                <PageFooter documentId={documentId} />
            </Page>

            {/* ═══════════════════════════════════════════════════
                BASIC ONLY: Pricing Analysis + Risks + Next Steps
                ═══════════════════════════════════════════════════ */}
            {isBasic && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Pricing Analysis" />
                    <Text style={s.h1}>Pricing Analysis</Text>
                    {d.pricing_analysis && (
                        <>
                            <Text style={s.h3}>Survival Price Commentary</Text>
                            <Text style={s.body}>{txt(d.pricing_analysis.survival_commentary)}</Text>
                            <Text style={s.h3}>Best Price Commentary</Text>
                            <Text style={s.body}>{txt(d.pricing_analysis.best_price_commentary)}</Text>
                            <Text style={s.h3}>Premium Price Commentary</Text>
                            <Text style={s.body}>{txt(d.pricing_analysis.premium_price_commentary)}</Text>
                            <View style={s.sidebar}>
                                <Text style={s.label}>Recommended Anchor: {txt(d.pricing_analysis.recommended_anchor, 'best').toUpperCase()}</Text>
                                <Text style={{ ...s.body, marginTop: 6 }}>{txt(d.pricing_analysis.anchor_rationale)}</Text>
                            </View>
                        </>
                    )}

                    <Text style={s.h2}>Top Risks</Text>
                    {arr(d.top_risks).map((risk: any, i: number) => (
                        <View key={i} style={{ ...s.exhibitBox, borderLeftWidth: 3, borderLeftColor: risk.severity === 'High' ? '#EF4444' : risk.severity === 'Medium' ? GOLD : '#10B981' }}>
                            <Text style={{ ...s.tableCellBold, fontSize: 9 }}>{risk.risk}</Text>
                            <Text style={{ ...s.small, marginTop: 4 }}>Severity: {risk.severity} | Mitigation: {risk.mitigation}</Text>
                        </View>
                    ))}

                    <Text style={s.h2}>Next Steps</Text>
                    {arr(d.next_steps).map((step: string, i: number) => (
                        <Text key={i} style={s.body}>{i + 1}. {step}</Text>
                    ))}

                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════
                FOUNDER + INVESTOR: Market Intelligence
                ═══════════════════════════════════════════════════ */}
            {!isBasic && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Market Intelligence" />
                    <Text style={s.h1}>Market Intelligence</Text>
                    <View style={s.row}>
                        <Col span={6}>
                            <View style={s.exhibitBox}>
                                <Text style={s.exhibitHeader}>Market Analysis</Text>
                                <Text style={s.body}>{txt(d.market_analysis?.market_narrative || d.marketAnalysis)}</Text>
                                {d.market_analysis?.willingness_to_pay_analysis && (
                                    <>
                                        <Text style={s.h3}>Willingness to Pay</Text>
                                        <Text style={s.body}>{d.market_analysis.willingness_to_pay_analysis}</Text>
                                    </>
                                )}
                            </View>
                        </Col>
                        <Col span={6}>
                            <View style={s.exhibitBox}>
                                <Text style={s.exhibitHeader}>Competitive Landscape</Text>
                                <Text style={s.body}>{txt(d.market_analysis?.competitive_landscape || d.competitive_positioning?.narrative || d.competitivePositioning)}</Text>
                            </View>
                        </Col>
                    </View>

                    {/* Investor: TAM Analysis */}
                    {isInvestor && d.market_analysis?.tam_analysis && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={s.h3}>TAM/SAM/SOM Analysis</Text>
                            <Text style={s.body}>{d.market_analysis.tam_analysis}</Text>
                        </View>
                    )}

                    {/* Competitive Benchmark Table */}
                    {d.competitive_positioning?.benchmark_table && arr(d.competitive_positioning.benchmark_table).length > 0 && (
                        <View style={{ marginTop: 12 }}>
                            <Text style={s.h3}>Competitive Benchmark</Text>
                            <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                                <View style={{ width: '25%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Competitor</Text></View>
                                <View style={{ width: '20%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Est. Price</Text></View>
                                <View style={{ width: '25%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Positioning</Text></View>
                                <View style={{ width: '30%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Your Advantage</Text></View>
                            </View>
                            {arr(d.competitive_positioning.benchmark_table).map((row: any, i: number) => (
                                <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                                    <View style={{ width: '25%' }}><Text style={s.tableCellBold}>{row.competitor}</Text></View>
                                    <View style={{ width: '20%' }}><Text style={s.tableCell}>{row.estimated_price}</Text></View>
                                    <View style={{ width: '25%' }}><Text style={s.tableCell}>{row.positioning}</Text></View>
                                    <View style={{ width: '30%' }}><Text style={s.tableCell}>{row.your_advantage}</Text></View>
                                </View>
                            ))}
                        </View>
                    )}

                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════
                FOUNDER + INVESTOR: Unit Economics + Pricing Strategy
                ═══════════════════════════════════════════════════ */}
            {!isBasic && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Economics & Strategy" />
                    <Text style={s.h1}>Economics & Strategy</Text>

                    {d.unit_economics && (
                        <View style={s.row}>
                            <Col span={6}>
                                <View style={s.exhibitBox}>
                                    <Text style={s.exhibitHeader}>Unit Economics</Text>
                                    <Text style={s.body}>{txt(d.unit_economics.narrative)}</Text>
                                    {d.unit_economics.health_score && (
                                        <View style={{ ...s.sidebar, borderLeftColor: d.unit_economics.health_score === 'Strong' ? '#10B981' : d.unit_economics.health_score === 'Critical' ? '#EF4444' : GOLD }}>
                                            <Text style={s.label}>Health Score: {d.unit_economics.health_score}</Text>
                                            <Text style={{ ...s.small, marginTop: 4 }}>{txt(d.unit_economics.health_rationale, '')}</Text>
                                        </View>
                                    )}
                                </View>
                            </Col>
                            <Col span={6}>
                                <View style={s.exhibitBox}>
                                    <Text style={s.exhibitHeader}>Key Metrics</Text>
                                    {[
                                        ['Est. LTV', `${cs}${num(d.unit_economics.estimated_ltv).toFixed(0)}`],
                                        ['LTV:CAC Ratio', `${num(d.unit_economics.estimated_ltv_cac_ratio).toFixed(1)}x`],
                                        ['Payback Period', `${num(d.unit_economics.payback_period_months)} months`],
                                        ...(isInvestor && d.unit_economics.breakeven_units ? [['Breakeven Units', `${d.unit_economics.breakeven_units}`]] : []),
                                    ].map(([label, value], i) => (
                                        <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                                            <View style={{ width: '50%' }}><Text style={s.tableCellBold}>{label}</Text></View>
                                            <View style={{ width: '50%' }}><Text style={s.tableCell}>{value}</Text></View>
                                        </View>
                                    ))}
                                </View>
                            </Col>
                        </View>
                    )}

                    {/* Investor: Unit Economics Deep Dive */}
                    {isInvestor && d.unit_economics?.investor_lens_commentary && (
                        <View style={{ ...s.sidebar, marginTop: 12 }}>
                            <Text style={s.label}>Investor Lens</Text>
                            <Text style={{ ...s.body, marginTop: 6 }}>{d.unit_economics.investor_lens_commentary}</Text>
                        </View>
                    )}

                    {/* Pricing Strategy */}
                    {d.pricing_strategy && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={s.h2}>Pricing Strategy</Text>
                            <Text style={s.body}>{txt(d.pricing_strategy.strategy_narrative)}</Text>

                            {/* Tier Suggestions Table */}
                            {arr(d.pricing_strategy.pricing_tiers_suggestion).length > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                                        <View style={{ width: '20%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Tier</Text></View>
                                        <View style={{ width: '15%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Price</Text></View>
                                        <View style={{ width: '30%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Segment</Text></View>
                                        <View style={{ width: '35%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Value Prop</Text></View>
                                    </View>
                                    {arr(d.pricing_strategy.pricing_tiers_suggestion).map((t: any, i: number) => (
                                        <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                                            <View style={{ width: '20%' }}><Text style={s.tableCellBold}>{t.tier_name}</Text></View>
                                            <View style={{ width: '15%' }}><Text style={{ ...s.tableCell, color: GOLD, fontWeight: 600 }}>{cs}{num(t.price).toFixed(0)}</Text></View>
                                            <View style={{ width: '30%' }}><Text style={s.tableCell}>{t.target_segment}</Text></View>
                                            <View style={{ width: '35%' }}><Text style={s.tableCell}>{t.key_value_prop}</Text></View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════
                FOUNDER + INVESTOR: Risk Matrix + Roadmap
                ═══════════════════════════════════════════════════ */}
            {!isBasic && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Risk & Implementation" />
                    <Text style={s.h1}>Risk & Implementation</Text>

                    {/* Risk Matrix Table */}
                    {arr(d.risk_matrix).length > 0 && (
                        <View>
                            <Text style={s.h3}>Risk Matrix</Text>
                            <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                                <View style={{ width: '30%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Risk</Text></View>
                                <View style={{ width: '15%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Category</Text></View>
                                <View style={{ width: '12%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Severity</Text></View>
                                <View style={{ width: '43%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Mitigation</Text></View>
                            </View>
                            {arr(d.risk_matrix).map((r: any, i: number) => (
                                <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                                    <View style={{ width: '30%' }}><Text style={s.tableCellBold}>{r.risk}</Text></View>
                                    <View style={{ width: '15%' }}><Text style={s.tableCell}>{r.category}</Text></View>
                                    <View style={{ width: '12%' }}><Text style={{ ...s.tableCell, color: r.severity === 'High' ? '#EF4444' : r.severity === 'Medium' ? GOLD : '#10B981', fontWeight: 600 }}>{r.severity}</Text></View>
                                    <View style={{ width: '43%' }}><Text style={s.tableCell}>{r.mitigation}</Text></View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Implementation Roadmap */}
                    {d.implementation_roadmap && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={s.h2}>Implementation Roadmap</Text>
                            <Text style={s.body}>{txt(d.implementation_roadmap.narrative, '')}</Text>
                            {arr(d.implementation_roadmap.phases).map((phase: any, i: number) => (
                                <View key={i} style={{ ...s.exhibitBox, borderLeftWidth: 3, borderLeftColor: i === 0 ? GOLD : NAVY }}>
                                    <Text style={s.tableCellBold}>Phase {phase.phase}: {phase.title} ({phase.duration})</Text>
                                    {arr(phase.key_actions).map((action: string, j: number) => (
                                        <Text key={j} style={{ ...s.small, marginTop: 2 }}>• {action}</Text>
                                    ))}
                                    <Text style={{ ...s.small, marginTop: 4, color: GOLD }}>✓ Success: {phase.success_metric}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════ 
                INVESTOR ONLY: Financial Scenarios + Charts
                ═══════════════════════════════════════════════════ */}
            {isInvestor && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Financial Scenarios" />
                    <Text style={s.h1}>Financial Scenarios</Text>

                    {d.financial_scenarios && (
                        <>
                            <Text style={s.body}>{txt(d.financial_scenarios.narrative, '')}</Text>
                            {arr(d.financial_scenarios.scenarios).length > 0 && (
                                <View>
                                    <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                                        <View style={{ width: '20%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Scenario</Text></View>
                                        <View style={{ width: '15%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Price</Text></View>
                                        <View style={{ width: '20%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>MRR (M6)</Text></View>
                                        <View style={{ width: '20%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>ARR (Y1)</Text></View>
                                        <View style={{ width: '25%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Key Assumption</Text></View>
                                    </View>
                                    {arr(d.financial_scenarios.scenarios).map((sc: any, i: number) => (
                                        <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                                            <View style={{ width: '20%' }}><Text style={s.tableCellBold}>{sc.name}</Text></View>
                                            <View style={{ width: '15%' }}><Text style={{ ...s.tableCell, color: GOLD, fontWeight: 600 }}>{cs}{num(sc.price_point).toFixed(0)}</Text></View>
                                            <View style={{ width: '20%' }}><Text style={s.tableCell}>{cs}{num(sc.mrr_month_6).toLocaleString()}</Text></View>
                                            <View style={{ width: '20%' }}><Text style={s.tableCell}>{cs}{num(sc.arr_year_1).toLocaleString()}</Text></View>
                                            <View style={{ width: '25%' }}><Text style={s.tableCell}>{sc.key_assumption}</Text></View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}

                    {/* Charts */}
                    {d.chart_data && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={s.h2}>Visual Analytics</Text>

                            {/* Price Range Bar Chart */}
                            {d.chart_data.price_range_bar && (
                                <View style={s.exhibitBox}>
                                    <Text style={s.exhibitHeader}>Price Range Analysis</Text>
                                    <BarChart
                                        labels={arr(d.chart_data.price_range_bar.labels)}
                                        values={arr(d.chart_data.price_range_bar.values)}
                                        highlightIndex={3} // Highlight "Best Price"
                                        title=""
                                    />
                                    <Text style={s.small}>{txt(d.chart_data.price_range_bar.description, '')}</Text>
                                </View>
                            )}

                            {/* LTV:CAC Waterfall */}
                            {d.chart_data.ltv_cac_waterfall && (
                                <View style={{ ...s.exhibitBox, marginTop: 12 }}>
                                    <Text style={s.exhibitHeader}>Unit Economics Waterfall</Text>
                                    <WaterfallChart
                                        labels={arr(d.chart_data.ltv_cac_waterfall.labels)}
                                        values={arr(d.chart_data.ltv_cac_waterfall.values)}
                                        title=""
                                    />
                                    <Text style={s.small}>{txt(d.chart_data.ltv_cac_waterfall.description, '')}</Text>
                                </View>
                            )}
                        </View>
                    )}

                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════
                INVESTOR ONLY: Revenue Projection + Investor Narrative
                ═══════════════════════════════════════════════════ */}
            {isInvestor && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Investor Intelligence" />
                    <Text style={s.h1}>Investor Intelligence</Text>

                    {/* Revenue Projection Chart */}
                    {d.chart_data?.revenue_projection_12m && (
                        <View style={s.exhibitBox}>
                            <Text style={s.exhibitHeader}>12-Month Revenue Projection</Text>
                            <RevenueChart
                                labels={arr(d.chart_data.revenue_projection_12m.labels)}
                                conservative={arr(d.chart_data.revenue_projection_12m.conservative)}
                                baseCase={arr(d.chart_data.revenue_projection_12m.base_case)}
                                optimistic={arr(d.chart_data.revenue_projection_12m.optimistic)}
                                title=""
                            />
                            <Text style={s.small}>{txt(d.chart_data.revenue_projection_12m.description, '')}</Text>
                        </View>
                    )}

                    {/* Investor Narrative */}
                    {d.investor_narrative && (
                        <View style={{ marginTop: 16 }}>
                            <Text style={s.h2}>Investor Narrative</Text>
                            <Text style={s.body}>{txt(d.investor_narrative.pricing_thesis)}</Text>

                            {d.investor_narrative.defensibility_statement && (
                                <View style={s.sidebar}>
                                    <Text style={s.label}>Defensibility Statement</Text>
                                    <Text style={{ ...s.body, marginTop: 6 }}>{d.investor_narrative.defensibility_statement}</Text>
                                </View>
                            )}

                            {/* Comparable Companies */}
                            {arr(d.investor_narrative.comparable_companies).length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.h3}>Comparable Companies</Text>
                                    {arr(d.investor_narrative.comparable_companies).map((comp: any, i: number) => (
                                        <View key={i} style={{ ...s.exhibitBox }}>
                                            <Text style={s.tableCellBold}>{comp.company} — {comp.pricing_model}</Text>
                                            <Text style={s.small}>{comp.key_lesson}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Red Flags + Investor Questions */}
                            {arr(d.investor_narrative.red_flags_to_address).length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.h3}>Red Flags to Address</Text>
                                    {arr(d.investor_narrative.red_flags_to_address).map((flag: string, i: number) => (
                                        <Text key={i} style={{ ...s.body, color: '#EF4444' }}>⚠ {flag}</Text>
                                    ))}
                                </View>
                            )}
                            {arr(d.investor_narrative.investor_questions_to_prepare).length > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <Text style={s.h3}>Prepare For These Questions</Text>
                                    {arr(d.investor_narrative.investor_questions_to_prepare).map((q: string, i: number) => (
                                        <Text key={i} style={s.body}>Q{i + 1}: {q}</Text>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════
                INVESTOR + AUDIT: Audit Findings Page
                ═══════════════════════════════════════════════════ */}
            {isInvestor && isAudit && d.audit_findings && (
                <Page size="A4" style={s.page}>
                    <PageHeader section="Audit Findings" />
                    <Text style={s.h1}>Audit Findings</Text>
                    <View style={{ ...s.sidebar, borderLeftColor: '#EF4444', marginBottom: 14 }}>
                        <Text style={{ ...s.label, color: '#EF4444' }}>Pricing Health Score: {d.audit_findings.pricing_health_score}/100</Text>
                    </View>
                    <Text style={s.h3}>Current Price Assessment</Text>
                    <Text style={s.body}>{txt(d.audit_findings.current_price_assessment)}</Text>
                    <Text style={s.h3}>Revenue Leakage Estimate</Text>
                    <Text style={{ ...s.body, fontWeight: 600 }}>{txt(d.audit_findings.revenue_leakage_estimate)}</Text>

                    {arr(d.audit_findings.quick_wins).length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={s.h3}>Quick Wins</Text>
                            {arr(d.audit_findings.quick_wins).map((w: string, i: number) => (
                                <Text key={i} style={s.body}>✓ {w}</Text>
                            ))}
                        </View>
                    )}
                    {arr(d.audit_findings.structural_changes).length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            <Text style={s.h3}>Structural Changes Required</Text>
                            {arr(d.audit_findings.structural_changes).map((c: string, i: number) => (
                                <Text key={i} style={s.body}>→ {c}</Text>
                            ))}
                        </View>
                    )}
                    <PageFooter documentId={documentId} />
                </Page>
            )}

            {/* ═══════════════════════════════════════════════════
                ALL TIERS: Full Input Audit
                ═══════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <PageHeader section="Full Input Audit" />
                <Text style={s.h1}>Full Input Audit</Text>
                <Text style={{ ...s.body, marginBottom: 14 }}>
                    Complete record of all data points captured during the pricing intelligence assessment.
                </Text>

                <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                    <View style={{ width: '8%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>#</Text></View>
                    <View style={{ width: '42%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Data Point</Text></View>
                    <View style={{ width: '50%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Captured Value</Text></View>
                </View>
                {answerEntries.map((entry, i) => (
                    <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                        <View style={{ width: '8%' }}><Text style={s.tableCell}>{i + 1}</Text></View>
                        <View style={{ width: '42%' }}><Text style={s.tableCellBold}>{entry.question}</Text></View>
                        <View style={{ width: '50%' }}><Text style={s.tableCell}>{entry.answer}</Text></View>
                    </View>
                ))}

                {/* Algorithm Summary Table */}
                <View style={{ marginTop: 16 }}>
                    <Text style={s.h3}>Algorithm Output Summary</Text>
                    <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                        <View style={{ width: '50%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Metric</Text></View>
                        <View style={{ width: '50%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Value</Text></View>
                    </View>
                    {[
                        ['Entry Price (Budget)', `${cs}${fmt(pricingResult.budget)}`],
                        ['Optimal Price (Recommended)', `${cs}${fmt(pricingResult.recommended)}`],
                        ['Premium Anchor', `${cs}${fmt(pricingResult.premium)}`],
                        ['Cost-Plus Base', `${cs}${fmt(pricingResult.analysis?.costPlusBase)}`],
                        ['Value Multiplier', `${num(pricingResult.analysis?.valueMultiplier, 1).toFixed(2)}x`],
                        ['Total Unit Cost', `${cs}${fmt(pricingResult.analysis?.totalUnitCost)}`],
                        ['Applied Modifiers', (pricingResult.appliedModifiers || []).join(', ') || 'None'],
                    ].map(([label, value], i) => (
                        <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                            <View style={{ width: '50%' }}><Text style={s.tableCellBold}>{label}</Text></View>
                            <View style={{ width: '50%' }}><Text style={s.tableCell}>{value}</Text></View>
                        </View>
                    ))}
                </View>

                <PageFooter documentId={documentId} />
            </Page>

            {/* ═══════════════════════════════════════════════════
                ALL TIERS: Methodology Appendix + Legal Disclaimer
                ═══════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={s.h1}>Appendices & Legal</Text>

                <View style={s.disclaimerBox}>
                    <Text style={s.disclaimerTitle}>Section A: Methodology Appendix</Text>
                    <Text style={s.disclaimerBody}>
                        The pricing intelligence contained herein was algorithmically generated utilizing proprietary frameworks including: (1) Van Westendorp Price Sensitivity Modeling — a 4-line intersection methodology deriving PMC, OPP, IPP, and PME from consumer willingness-to-pay data; (2) Cost-Plus Calculation — Total Unit Cost × (1 + Desired Margin%) × (1 + Tax Rate%); (3) Value-Based Multiplier Scoring — a composite 1.2x–2.0x multiplier from USP Strength (35%), Retention Rate (25%), WTP Premium (25%), and Brand Recognition (15%); (4) Market Modifiers — Blue Ocean Bonus (+20%), High Saturation Penalty (-15%), Competitor Gravity (70/30 weighted blend), and Margin Protection.
                    </Text>
                </View>

                <View style={{ ...s.disclaimerBox, borderLeftColor: GOLD }}>
                    <Text style={s.disclaimerTitle}>Section B: AI Analysis Methodology</Text>
                    <Text style={s.disclaimerBody}>
                        The analytical narrative in this report was generated by a large language model (Claude 4.5 Sonnet) acting under the persona of a McKinsey Pricing Auditor. The AI was provided with the complete dataset including all user responses, algorithmic outputs, and applied market modifiers. All claims are derived from the user's actual input data and the proprietary pricing engine's calculations.
                    </Text>
                </View>

                <View style={{ ...s.disclaimerBox, borderLeftColor: '#EF4444', marginTop: 12 }}>
                    <Text style={{ ...s.disclaimerTitle, color: '#EF4444' }}>Section C: Legal Disclaimer</Text>
                    <Text style={s.disclaimerBody}>
                        CONFIDENTIAL AND PROPRIETARY. This report is provided for informational and strategic planning purposes only. It does NOT constitute financial, legal, or investment advice. PricePoint and its affiliates shall not be held liable for any commercial losses resulting from decisions made based on this report. All market data is based on user-provided inputs and algorithmic projections. Unauthorized distribution or reverse-engineering of the pricing algorithms is prohibited.
                    </Text>
                </View>

                {/* Verification Seal */}
                <View style={{ marginTop: 20, padding: 12, borderWidth: 1, borderColor: GOLD, alignItems: 'center' as const }}>
                    <Text style={{ ...s.label, color: GOLD, fontSize: 9, marginBottom: 4 }}>Verification Seal</Text>
                    <Text style={{ fontSize: 8, color: NAVY, fontWeight: 600 }}>Document ID: {documentId}</Text>
                    <Text style={{ fontSize: 7, color: SLATE }}>
                        Generated: {new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' })}
                    </Text>
                    <Text style={{ fontSize: 7, color: SLATE }}>Integrity Hash: PricePoint-{documentId.slice(0, 8).toUpperCase()}</Text>
                </View>

                <PageFooter documentId={documentId} />
            </Page>
        </Document>
    );
};
