import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// ============================================================
// PricePoint — Voya-Grade Investment-Quality PDF Report
//
// Design System:
//   Font: Inter (10pt body, 24pt headings)
//   Margins: 25mm (≈71pt)
//   Grid: 12-column layout
//   Colors: Navy (#0A1628), Gold (#DFA81C), Slate (#4A5568)
//   Line Height: 2.5× for headings ("expensive" white space)
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
const MARGIN = 71; // 25mm ≈ 71pt

const COLUMNS = 12;
const colWidth = (span: number) => `${(span / COLUMNS) * 100}%`;

// ── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
    // Base page
    page: {
        fontFamily: 'Inter',
        fontSize: 10,
        color: SLATE,
        padding: MARGIN,
        paddingBottom: MARGIN + 25, // extra room for footer
        backgroundColor: '#FFFFFF',
    },

    // Typography
    h1: { fontSize: 24, fontWeight: 800, color: NAVY, lineHeight: 2.5, marginBottom: 4 },
    h2: { fontSize: 16, fontWeight: 800, color: NAVY, lineHeight: 2.5, marginTop: 8 },
    h3: { fontSize: 12, fontWeight: 600, color: NAVY, marginTop: 10, marginBottom: 6 },
    body: { fontSize: 10, color: SLATE, lineHeight: 1.6, marginBottom: 10 },
    label: { fontSize: 8, fontWeight: 600, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 1 },
    small: { fontSize: 8, color: '#9CA3AF' },

    // Grid
    row: { flexDirection: 'row' as const, flexWrap: 'wrap' as const },

    // Cover page
    cover: { flex: 1, backgroundColor: NAVY, padding: 60, justifyContent: 'center' as const },
    coverBrand: { fontSize: 12, fontWeight: 800, color: GOLD, letterSpacing: 3, marginBottom: 80, textTransform: 'uppercase' as const },
    coverTitle: { fontSize: 42, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 16 },
    coverSub: { fontSize: 14, color: '#E0E5EC', opacity: 0.85 },

    // Metric card
    metricCard: { borderBottomWidth: 1, borderBottomColor: BORDER, paddingVertical: 12, marginBottom: 8 },
    metricValue: { fontSize: 26, fontWeight: 800, color: GOLD, marginBottom: 2 },
    metricLabel: { fontSize: 8, fontWeight: 600, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: 0.5 },

    // Exhibit box
    exhibitBox: { borderWidth: 1, borderColor: BORDER, padding: 16, marginTop: 12, marginBottom: 12, backgroundColor: LIGHT_GRAY },
    exhibitHeader: { fontSize: 9, fontWeight: 800, fontFamily: 'Inter', color: '#000000', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 },

    // Sidebar callout
    sidebar: { padding: 14, backgroundColor: LIGHT_GRAY, borderLeftWidth: 3, borderLeftColor: GOLD },

    // Footer
    footer: { position: 'absolute' as const, bottom: 30, left: MARGIN, right: MARGIN, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
    footerText: { fontSize: 7, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 },

    // Audit table
    tableRow: { flexDirection: 'row' as const, borderBottomWidth: 0.5, borderBottomColor: BORDER, minHeight: 22 },
    tableCell: { fontSize: 8, color: SLATE, paddingVertical: 5, paddingHorizontal: 8 },
    tableCellBold: { fontSize: 8, fontWeight: 600, color: NAVY, paddingVertical: 5, paddingHorizontal: 8 },
    tableHeader: { fontSize: 7, fontWeight: 800, color: NAVY, textTransform: 'uppercase' as const, paddingVertical: 6, paddingHorizontal: 8, letterSpacing: 0.5 },

    // Disclaimer
    disclaimerBox: { marginTop: 20, padding: 14, backgroundColor: LIGHT_GRAY, borderLeftWidth: 3, borderLeftColor: '#9CA3AF' },
    disclaimerTitle: { fontSize: 9, fontWeight: 800, color: NAVY, marginBottom: 4, textTransform: 'uppercase' as const },
    disclaimerBody: { fontSize: 7, color: '#64748B', lineHeight: 1.5 },
});

// ── Grid Column Component ────────────────────────────────────
const Col = ({ span = 12, children, style }: { span?: number; children?: React.ReactNode; style?: any }) => (
    <View style={{ width: colWidth(span), paddingHorizontal: 6, ...style }}>
        {children}
    </View>
);

// ── Verification Seal Footer ─────────────────────────────────
const PageFooter = ({ documentId, pageNum, totalPages }: { documentId: string; pageNum: number; totalPages: number }) => (
    <View style={s.footer} fixed>
        <Text style={s.footerText}>{documentId}</Text>
        <Text style={s.footerText}>Confidential & Proprietary</Text>
        <Text style={s.footerText}>Generated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Page {pageNum} of {totalPages}</Text>
    </View>
);

// ── Props Interface ──────────────────────────────────────────
interface PricingReportPDFProps {
    documentId: string;
    claudeData: {
        executiveSummary: string;
        marketAnalysis: string;
        competitivePositioning: string;
        pricingDefensibility: string;
        riskFactors: string;
        implementationRoadmap: string;
        methodology: string;
    };
    pricingResult: {
        budget: number;
        recommended: number;
        premium: number;
        analysis: {
            costPlusBase: number;
            valueMultiplier: number;
            totalUnitCost?: number;
            vanWestendorp?: { opp: number; floor: number; ceiling: number };
        };
        appliedModifiers?: string[];
    };
    sessionData: Record<string, any>;
    journeyType: string;
}

// ── Main Component ───────────────────────────────────────────
export const PricingReportPDF: React.FC<PricingReportPDFProps> = ({
    documentId,
    claudeData,
    pricingResult,
    sessionData,
    journeyType
}) => {
    const isAudit = journeyType === 'Pricing Audit' || journeyType === 'established_seller';
    const ACCENT = isAudit ? '#B8860B' : GOLD;
    const TOTAL_PAGES = 6;

    // ── Extract answers for Part 7 audit ─────────────────────
    const answers = sessionData?.answers || {};
    const answerEntries = Object.entries(answers).map(([key, val]: [string, any]) => ({
        question: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        answer: typeof val?.value === 'object' ? JSON.stringify(val.value) : String(val?.value ?? 'N/A'),
    }));

    // Safe number formatting
    const fmt = (n: any) => {
        const num = Number(n);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    return (
        <Document>
            {/* ════════════════════════════════════════════════════
                PAGE 1: COVER
                ════════════════════════════════════════════════════ */}
            <Page size="A4" style={{ ...s.cover }}>
                <Text style={{ ...s.coverBrand, color: ACCENT }}>PricePoint Intelligence</Text>
                <Text style={s.coverTitle}>
                    Investment-Grade{'\n'}{isAudit ? 'Pricing Audit Verdict' : 'Launch Strategy Report'}
                </Text>
                <Text style={s.coverSub}>
                    Strictly Confidential • Prepared {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <Text style={{ ...s.coverSub, marginTop: 10, fontSize: 11 }}>
                    Document ID: {documentId}
                </Text>

                <View style={{ position: 'absolute', bottom: 40, left: 60, right: 60 }}>
                    <Text style={{ fontSize: 8, color: '#9CA3AF', fontFamily: 'Inter', fontWeight: 600 }}>
                        {documentId} | Confidential & Proprietary | Page 1 of {TOTAL_PAGES}
                    </Text>
                </View>
            </Page>

            {/* ════════════════════════════════════════════════════
                PAGE 2: STRATEGIC OVERVIEW — Metric Cards + Exec Summary
                ════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={s.h1}>Strategic Overview</Text>

                {/* 2×3 Metric Card Grid */}
                <View style={{ ...s.row, marginTop: 4, marginBottom: 16 }}>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={{ ...s.metricValue, color: ACCENT }}>${fmt(pricingResult.budget)}</Text>
                            <Text style={s.metricLabel}>Market Entry Floor</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={{ ...s.metricValue, color: ACCENT }}>${fmt(pricingResult.recommended)}</Text>
                            <Text style={s.metricLabel}>Optimal Price Point</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={{ ...s.metricValue, color: ACCENT }}>${fmt(pricingResult.premium)}</Text>
                            <Text style={s.metricLabel}>Premium Anchor</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={s.metricValue}>${fmt(pricingResult.analysis?.costPlusBase)}</Text>
                            <Text style={s.metricLabel}>True Cost Base</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={s.metricValue}>{Number(pricingResult.analysis?.valueMultiplier || 0).toFixed(2)}x</Text>
                            <Text style={s.metricLabel}>Value Multiplier</Text>
                        </View>
                    </Col>
                    <Col span={4}>
                        <View style={s.metricCard}>
                            <Text style={s.metricValue}>{pricingResult.appliedModifiers?.length || 0}</Text>
                            <Text style={s.metricLabel}>Active Modifiers</Text>
                        </View>
                    </Col>
                </View>

                {/* 8+4 Column Layout */}
                <View style={s.row}>
                    <Col span={8}>
                        <Text style={s.h2}>Executive Summary</Text>
                        <Text style={s.body}>{claudeData.executiveSummary}</Text>
                    </Col>
                    <Col span={4}>
                        <View style={s.sidebar}>
                            <Text style={s.label}>Pricing Thesis</Text>
                            <Text style={{ ...s.body, marginTop: 8, fontSize: 9 }}>
                                This structure ensures defensible margins while expanding market capture via the Anchor-Decoy effect. The Value Multiplier of {Number(pricingResult.analysis?.valueMultiplier || 0).toFixed(2)}x validates premium positioning.
                            </Text>
                        </View>
                    </Col>
                </View>

                <PageFooter documentId={documentId} pageNum={2} totalPages={TOTAL_PAGES} />
            </Page>

            {/* ════════════════════════════════════════════════════
                PAGE 3: MARKET ANALYSIS + COMPETITIVE POSITIONING
                ════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={s.h1}>Market Intelligence</Text>

                <View style={s.row}>
                    <Col span={6}>
                        <View style={s.exhibitBox}>
                            <Text style={s.exhibitHeader}>Exhibit 1: Competitive Market Analysis</Text>
                            <Text style={s.body}>{claudeData.marketAnalysis}</Text>
                        </View>
                    </Col>
                    <Col span={6}>
                        <View style={s.exhibitBox}>
                            <Text style={s.exhibitHeader}>Exhibit 2: Competitive Positioning</Text>
                            <Text style={s.body}>{claudeData.competitivePositioning}</Text>
                        </View>
                    </Col>
                </View>

                <View style={{ ...s.row, marginTop: 8 }}>
                    <Col span={12}>
                        <Text style={s.h2}>Pricing Defensibility</Text>
                        <Text style={s.body}>{claudeData.pricingDefensibility}</Text>
                    </Col>
                </View>

                <PageFooter documentId={documentId} pageNum={3} totalPages={TOTAL_PAGES} />
            </Page>

            {/* ════════════════════════════════════════════════════
                PAGE 4: RISK FACTORS + IMPLEMENTATION ROADMAP
                ════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={s.h1}>Risk & Implementation</Text>

                <View style={s.row}>
                    <Col span={6}>
                        <View style={s.exhibitBox}>
                            <Text style={s.exhibitHeader}>Exhibit 3: Risk Factor Analysis</Text>
                            <Text style={s.body}>{claudeData.riskFactors}</Text>
                        </View>
                    </Col>
                    <Col span={6}>
                        <View style={s.exhibitBox}>
                            <Text style={s.exhibitHeader}>Exhibit 4: 90-Day Implementation Roadmap</Text>
                            <Text style={s.body}>{claudeData.implementationRoadmap}</Text>
                        </View>
                    </Col>
                </View>

                <PageFooter documentId={documentId} pageNum={4} totalPages={TOTAL_PAGES} />
            </Page>

            {/* ════════════════════════════════════════════════════
                PAGE 5: PART 7 — FULL INPUT AUDIT
                ════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={s.h1}>Full Input Audit</Text>
                <Text style={{ ...s.body, marginBottom: 14 }}>
                    Complete record of all data points captured during the pricing intelligence assessment. This audit trail ensures full transparency and reproducibility of the pricing model.
                </Text>

                {/* Table Header */}
                <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                    <View style={{ width: '8%' }}>
                        <Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>#</Text>
                    </View>
                    <View style={{ width: '42%' }}>
                        <Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Data Point</Text>
                    </View>
                    <View style={{ width: '50%' }}>
                        <Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Captured Value</Text>
                    </View>
                </View>

                {/* Table Body — Zebra Stripe */}
                {answerEntries.map((entry, i) => (
                    <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                        <View style={{ width: '8%' }}>
                            <Text style={s.tableCell}>{i + 1}</Text>
                        </View>
                        <View style={{ width: '42%' }}>
                            <Text style={s.tableCellBold}>{entry.question}</Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={s.tableCell}>{entry.answer}</Text>
                        </View>
                    </View>
                ))}

                {/* Algorithm Output Summary */}
                <View style={{ marginTop: 16 }}>
                    <Text style={s.h3}>Algorithm Output Summary</Text>
                    <View style={{ ...s.tableRow, backgroundColor: NAVY }}>
                        <View style={{ width: '50%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Metric</Text></View>
                        <View style={{ width: '50%' }}><Text style={{ ...s.tableHeader, color: '#FFFFFF' }}>Value</Text></View>
                    </View>
                    {[
                        ['Entry Price (Budget)', `$${fmt(pricingResult.budget)}`],
                        ['Optimal Price (Recommended)', `$${fmt(pricingResult.recommended)}`],
                        ['Premium Anchor', `$${fmt(pricingResult.premium)}`],
                        ['Cost-Plus Base', `$${fmt(pricingResult.analysis?.costPlusBase)}`],
                        ['Value Multiplier', `${Number(pricingResult.analysis?.valueMultiplier || 0).toFixed(2)}x`],
                        ['Total Unit Cost', `$${fmt(pricingResult.analysis?.totalUnitCost)}`],
                        ['Applied Modifiers', (pricingResult.appliedModifiers || []).join(', ') || 'None'],
                    ].map(([label, value], i) => (
                        <View key={i} style={{ ...s.tableRow, backgroundColor: i % 2 === 0 ? '#FFFFFF' : LIGHT_GRAY }}>
                            <View style={{ width: '50%' }}><Text style={s.tableCellBold}>{label}</Text></View>
                            <View style={{ width: '50%' }}><Text style={s.tableCell}>{value}</Text></View>
                        </View>
                    ))}
                </View>

                <PageFooter documentId={documentId} pageNum={5} totalPages={TOTAL_PAGES} />
            </Page>

            {/* ════════════════════════════════════════════════════
                PAGE 6: METHODOLOGY APPENDIX + LEGAL DISCLAIMER
                (Hard-coded — cannot be skipped)
                ════════════════════════════════════════════════════ */}
            <Page size="A4" style={s.page}>
                <Text style={s.h1}>Appendices & Legal</Text>

                {/* Methodology */}
                <View style={s.disclaimerBox}>
                    <Text style={s.disclaimerTitle}>Section A: Methodology Appendix</Text>
                    <Text style={s.disclaimerBody}>
                        The pricing intelligence contained herein was algorithmically generated utilizing proprietary frameworks including, but not limited to: (1) Van Westendorp Price Sensitivity Modeling — a 4-line intersection methodology that derives the Optimal Price Point (OPP), Price Floor, and Price Ceiling from consumer willingness-to-pay data; (2) Cost-Plus Calculation — Total Unit Cost × (1 + Desired Margin%) × (1 + Tax Rate%) to establish the absolute margin floor; (3) Value-Based Multiplier Scoring — a composite 1.2x–2.0x multiplier derived from USP Strength (35% weight), Customer Retention Rate (25% weight), Willingness-to-Pay Premium (25% weight), and Brand Recognition (15% weight); and (4) Market Modifier Adjustments — including Blue Ocean Bonus (+20% multiplier expansion for zero-competitor markets), High Saturation Penalty (-15% multiplier compression for 4+ competitor markets), Competitor Gravity (70/30 weighted OPP blend when price exceeds 150% of competitor average), and Margin Protection (floor enforcement when cost-plus exceeds Van Westendorp floor).
                    </Text>
                </View>

                {/* AI-Generated Methodology Summary */}
                <View style={{ ...s.disclaimerBox, borderLeftColor: GOLD }}>
                    <Text style={s.disclaimerTitle}>Section B: AI Analysis Methodology</Text>
                    <Text style={s.disclaimerBody}>
                        {claudeData.methodology || 'The analytical narrative in this report was generated by a large language model (Claude 3.5 Sonnet) acting under the persona of a McKinsey Pricing Auditor. The AI was provided with the complete dataset including all user responses, algorithmic outputs, and applied market modifiers. All claims in the report are derived from the user\'s actual input data and the proprietary pricing engine\'s calculations. The AI does not have access to external real-time market data.'}
                    </Text>
                </View>

                {/* Legal Disclaimer — HARD CODED */}
                <View style={{ ...s.disclaimerBox, borderLeftColor: '#EF4444', marginTop: 12 }}>
                    <Text style={{ ...s.disclaimerTitle, color: '#EF4444' }}>Section C: Legal Disclaimer</Text>
                    <Text style={s.disclaimerBody}>
                        CONFIDENTIAL AND PROPRIETARY. This report and the pricing models contained within are provided strictly for informational and strategic planning purposes. They do NOT constitute guaranteed financial advice, legal advice, or a promise of exact revenue generation. The creator of this report, PricePoint, and its affiliates shall not be held liable for any commercial losses, market failures, competitive actions, regulatory changes, or downstream consequences resulting from the execution of this strategy. The user assumes full responsibility for all independent business decisions and market launches. Past pricing model accuracy does not guarantee future performance. All market data referenced is based on user-provided inputs and algorithmic projections, not live market feeds. This document contains trade secrets and proprietary methodologies protected under applicable intellectual property laws. Unauthorized distribution, reproduction, or reverse-engineering of the pricing algorithms described herein is strictly prohibited. By accessing this document, the recipient agrees to maintain its confidentiality.
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

                <PageFooter documentId={documentId} pageNum={6} totalPages={TOTAL_PAGES} />
            </Page>
        </Document>
    );
};
