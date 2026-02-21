import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register Inter font
Font.register({
    family: 'Inter',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhjp-Ek-_EeA.woff2' }, // Regular
        { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZJhjp-Ek-_EeA.woff2', fontWeight: 700 } // Bold
    ]
});

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Inter',
        padding: 40,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0A1628',
        marginBottom: 20,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0057B8',
        marginTop: 20,
        marginBottom: 10,
    },
    text: {
        fontSize: 11,
        color: '#374151',
        lineHeight: 1.5,
        marginBottom: 10,
    },
    coverPage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A1628',
    },
    coverTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#DFA81C',
        marginBottom: 10,
    },
    coverSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    chartContainer: {
        width: '100%',
        marginVertical: 15,
        alignItems: 'center',
    },
    disclaimer: {
        fontSize: 8,
        color: '#9CA3AF',
        marginTop: 'auto',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10,
    }
});

interface PricingReportPDFProps {
    documentId: string;
    claudeData: {
        executiveSummary: string;
        marketJustification: string;
        defensibility: string;
    };
    chartUrls: {
        pieChartUrl: string;
        barChartUrl: string;
    };
    pricingResult: {
        budget: number;
        recommended: number;
        premium: number;
    };
}

export const PricingReportPDF: React.FC<PricingReportPDFProps> = ({ documentId, claudeData, chartUrls, pricingResult }) => (
    <Document>
        {/* Part 1: Cover Page */}
        <Page size="A4" style={styles.coverPage}>
            <Text style={styles.coverTitle}>PricePoint Intelligence</Text>
            <Text style={styles.coverSubtitle}>Investment-Grade Pricing Strategy</Text>
            <Text style={{ ...styles.coverSubtitle, marginTop: 40, fontSize: 10 }}>Document ID: {documentId}</Text>
        </Page>

        {/* Part 2 & 5: Executive Summary & The Trinity Quote */}
        <Page size="A4" style={styles.page}>
            <Text style={styles.header}>Executive Summary</Text>
            <Text style={styles.text}>{claudeData.executiveSummary}</Text>

            <Text style={styles.subHeader}>The Trinity Quote</Text>
            <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 4, marginVertical: 10 }}>
                <Text style={{ ...styles.text, fontWeight: 'bold', color: '#0057B8' }}>Recommended Price: ${pricingResult.recommended.toFixed(2)}</Text>
                <Text style={styles.text}>Budget Floor: ${pricingResult.budget.toFixed(2)}</Text>
                <Text style={styles.text}>Premium Ceiling: ${pricingResult.premium.toFixed(2)}</Text>
            </View>

            {/* Part 3: Cost Breakdown */}
            <Text style={styles.subHeader}>Cost Composition</Text>
            <View style={styles.chartContainer}>
                <Image src={chartUrls.pieChartUrl} style={{ width: 250, height: 250 }} />
            </View>
        </Page>

        {/* Part 4 & 6 & 7: Market, AI, Disclaimer */}
        <Page size="A4" style={styles.page}>
            <Text style={styles.subHeader}>Market Range & Positioning</Text>
            <View style={styles.chartContainer}>
                <Image src={chartUrls.barChartUrl} style={{ width: 400, height: 240 }} />
            </View>

            <Text style={styles.subHeader}>Market Justification</Text>
            <Text style={styles.text}>{claudeData.marketJustification}</Text>

            <Text style={styles.subHeader}>Investor Defensibility</Text>
            <Text style={styles.text}>{claudeData.defensibility}</Text>

            <Text style={styles.disclaimer}>
                Methodology & Disclaimer: This report is generated algorithmically combining Von Westendorp Price Sensitivity analysis with live market inputs and LLM synthesis. It serves as strategic advisory content, not guaranteed financial outcomes.
            </Text>
        </Page>
    </Document>
);
