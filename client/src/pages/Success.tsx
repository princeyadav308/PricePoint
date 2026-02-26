import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
// useSessionStore no longer needed — data comes from DB via savedSessionData
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PricingReportPDF } from '../components/PricingReportPDF';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck, X } from 'lucide-react';

export default function Success() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const documentId = searchParams.get('documentId');

    const [status, setStatus] = useState<'polling' | 'generating' | 'ready' | 'error'>('polling');
    const [pollCount, setPollCount] = useState(0);
    const [reportPayload, setReportPayload] = useState<{ claudeData: any } | null>(null);

    const [savedSessionData, setSavedSessionData] = useState<any>(null);

    // Poll the backend to check if Dodo Webhook arrived
    useEffect(() => {
        if (!documentId) {
            setStatus('error');
            return;
        }

        if (status !== 'polling') return;

        const checkStatus = async () => {
            try {
                const res = await fetch(`http://127.0.0.1:3000/api/reports/status/${documentId}`);
                const data = await res.json();

                if (data.paymentStatus === 'Paid') {
                    // Payment confirmed! Store data and generate narrative
                    setSavedSessionData(data.sessionData);
                    setStatus('generating');
                } else {
                    // Still waiting (Max 30 retries = 90 seconds)
                    if (pollCount >= 30) {
                        setStatus('error');
                    } else {
                        setTimeout(() => setPollCount(p => p + 1), 3000);
                    }
                }
            } catch (error) {
                console.error("Polling error:", error);
                if (pollCount >= 30) setStatus('error');
                else setTimeout(() => setPollCount(p => p + 1), 3000);
            }
        };

        checkStatus();
    }, [documentId, status, pollCount]);


    // Once Paid, hit the AI Generation endpoint
    useEffect(() => {
        if (status !== 'generating' || !savedSessionData) return;

        const generateNarrative = async () => {
            try {
                // Fetch the generated AI narrative based on Tier
                const res = await fetch('http://127.0.0.1:3000/api/generate-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionData: savedSessionData,
                        pricingResult: savedSessionData.pricingResult,
                        appliedModifiers: savedSessionData.pricingResult?.appliedModifiers || [],
                        tier: 'Investor'
                    })
                });

                const data = await res.json();

                // Even if Claude returned fallback text (no credits), still show PDF
                setReportPayload({
                    claudeData: data.claudeData || {
                        executiveSummary: 'AI analysis temporarily unavailable. Please retry once credits are loaded.',
                        marketAnalysis: 'Data pending.',
                        competitivePositioning: 'Data pending.',
                        pricingDefensibility: 'Data pending.',
                        riskFactors: 'Data pending.',
                        implementationRoadmap: 'Data pending.',
                        methodology: 'Data pending.'
                    },
                });

                setStatus('ready');

            } catch (error) {
                console.error("AI Generation Error:", error);
                // NON-FATAL: Still show PDF with fallback text
                setReportPayload({
                    claudeData: {
                        executiveSummary: 'AI analysis could not be generated due to a network error. Your pricing data is still available below.',
                        marketAnalysis: 'Unavailable.',
                        competitivePositioning: 'Unavailable.',
                        pricingDefensibility: 'Unavailable.',
                        riskFactors: 'Unavailable.',
                        implementationRoadmap: 'Unavailable.',
                        methodology: 'Unavailable.'
                    },
                });
                setStatus('ready');
            }
        };

        generateNarrative();

    }, [status]);


    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-lg bg-background-light dark:bg-background-dark outer-shadow-lg rounded-3xl p-10 text-center animate-in fade-in zoom-in duration-500">

                {status === 'polling' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center outer-shadow mb-8 relative">
                            <Loader2 size={40} className="animate-spin" />
                            <div className="absolute inset-0 border-4 border-primary/20 rounded-2xl animate-pulse"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3">
                            Verifying Payment
                        </h2>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            Waiting for secure confirmation from Dodo Payments.
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mb-2 inner-shadow overflow-hidden">
                            <div className="bg-primary h-2 rounded-full animate-progress" style={{ width: `${(pollCount / 30) * 100}%` }}></div>
                        </div>
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Attempt {pollCount}/30</span>
                    </div>
                )}

                {status === 'generating' && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-[#00897B]/10 text-[#00897B] flex items-center justify-center outer-shadow mb-8 relative">
                            <ShieldCheck size={40} className="animate-bounce" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3">
                            Payment Confirmed
                        </h2>
                        <p className="text-slate-500 mb-6 leading-relaxed">
                            Securing your financial data... This usually takes 10-20 seconds while our AI Intelligence synthesizes your strategy.
                        </p>
                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Loader2 size={16} className="animate-spin" />
                            Synthesizing Analysis...
                        </div>
                    </div>
                )}

                {status === 'ready' && reportPayload && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-2xl bg-[#DFA81C]/20 text-[#DFA81C] flex items-center justify-center outer-shadow mb-8">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-text-light dark:text-text-dark mb-3 tracking-tight">
                            Intelligence Ready
                        </h2>
                        <p className="text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
                            Your bespoke pricing strategy has been assembled securely. Download your premium PDF below.
                        </p>

                        <PDFDownloadLink
                            document={
                                <PricingReportPDF
                                    documentId={documentId || 'PPRT-0000'}
                                    claudeData={reportPayload.claudeData}
                                    pricingResult={savedSessionData?.pricingResult || { budget: 0, recommended: 0, premium: 0, analysis: { costPlusBase: 0, valueMultiplier: 1, totalUnitCost: 0 } }}
                                    sessionData={savedSessionData || {}}
                                    journeyType={savedSessionData?.journeyType || 'Pricing Strategy'}
                                />
                            }
                            fileName={`PricePoint_Intelligence_${documentId}.pdf`}
                            className="w-full py-5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-lg outer-shadow transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide mb-4"
                        >
                            {/* @ts-ignore */}
                            {({ loading }) => (
                                <>
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'Download Premium Report'}
                                </>
                            )}
                        </PDFDownloadLink>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 rounded-full bg-background-light dark:bg-background-dark text-slate-500 hover:text-text-light dark:hover:text-text-dark font-bold text-sm outer-shadow transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            Return to Dashboard
                            <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center text-red-500">
                        <div className="w-20 h-20 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center outer-shadow mb-8">
                            <X size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-red-600">
                            Verification Timeout
                        </h2>
                        <p className="text-red-400 mb-8 leading-relaxed">
                            We couldn't verify your payment structure or the network timed out. Please check your email for the receipt or contact support.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-sm outer-shadow transition-all active:scale-95"
                        >
                            Return Home
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
