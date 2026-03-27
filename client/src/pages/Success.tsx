import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, ArrowRight, ShieldCheck, X, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Success() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const documentId = searchParams.get('documentId');

    const [status, setStatus] = useState<'polling' | 'verified' | 'generating' | 'ready' | 'error'>('polling');
    const [pollCount, setPollCount] = useState(0);
    const [reportPayload, setReportPayload] = useState<{ claudeData: any } | null>(null);
    const [savedTier, setSavedTier] = useState<string>('Basic');
    const [pdfLoading, setPdfLoading] = useState(false);

    const [savedSessionData, setSavedSessionData] = useState<any>(null);

    // Non-blocking email sender — fires and forgets
    const sendReportEmail = async (docId: string) => {
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData.session?.access_token;
            if (!token) return; // Not authenticated, skip email

            await fetch('http://127.0.0.1:3000/api/reports/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ documentId: docId })
            });
        } catch (err) {
            console.warn('Email send failed (non-blocking):', err);
        }
    };

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
                    // Payment confirmed! Store data and show checkmark first
                    setSavedSessionData(data.sessionData);
                    setSavedTier(data.tier || 'Basic');
                    setStatus('verified');

                    // ── DEBUG: Log raw MindMap answer keys ──
                    console.log('═══ MINDMAP RAW KEYS ═══');
                    console.log('savedSessionData:', JSON.stringify(data.sessionData, null, 2));
                    if (data.sessionData?.answers) {
                        console.log('Answer keys:', Object.keys(data.sessionData.answers));
                    }
                    console.log('═══ END MINDMAP KEYS ═══');
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


    // Once verified, auto-advance to generating after the checkmark animation
    useEffect(() => {
        if (status !== 'verified') return;
        const timer = setTimeout(() => setStatus('generating'), 2000);
        return () => clearTimeout(timer);
    }, [status]);

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
                        tier: savedTier
                    })
                });

                const data = await res.json();

                // Even if Claude returned fallback text (no credits), still show PDF
                setReportPayload({
                    claudeData: data.claudeData || {
                        report_meta: { journey_type: 'unknown', tier: savedTier.toLowerCase(), one_line_verdict: 'AI analysis temporarily unavailable.' },
                        executive_summary: { headline: 'Report Pending', summary: 'AI analysis temporarily unavailable. Please retry once credits are loaded.', pricing_verdict: {} },
                        next_steps: ['Retry report generation']
                    },
                });

                // ── DEBUG: Log Claude response keys ──
                console.log('═══ CLAUDE RESPONSE KEYS ═══');
                console.log('Claude data:', JSON.stringify(data.claudeData, null, 2));
                console.log('═══ END CLAUDE KEYS ═══');

                setStatus('ready');

                // Non-blocking: send report email to user
                sendReportEmail(documentId!);

            } catch (error) {
                console.error("AI Generation Error:", error);
                // NON-FATAL: Still show PDF with fallback text
                setReportPayload({
                    claudeData: {
                        report_meta: { journey_type: 'unknown', tier: savedTier.toLowerCase(), one_line_verdict: 'Network error occurred.' },
                        executive_summary: { headline: 'Report Unavailable', summary: 'AI analysis could not be generated due to a network error. Your pricing data is still available below.', pricing_verdict: {} },
                        next_steps: ['Retry report generation', 'Contact support if issue persists']
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
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 inner-shadow overflow-hidden">
                            <div className="bg-primary h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min((pollCount / 30) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                )}

                {status === 'verified' && (
                    <div className="flex flex-col items-center">
                        {/* GPay-style animated checkmark */}
                        <div className="w-24 h-24 mb-8 success-checkmark-container">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {/* Background circle fill */}
                                <circle cx="50" cy="50" r="45" fill="transparent" className="success-circle-fill" />
                                {/* Animated circle stroke */}
                                <circle
                                    cx="50" cy="50" r="45"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className="success-circle"
                                />
                                {/* Animated checkmark */}
                                <path
                                    d="M30 52 L44 66 L70 38"
                                    fill="none"
                                    stroke="#10B981"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="success-check"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark mb-3 animate-fade-in">
                            Payment Verified
                        </h2>
                        <p className="text-emerald-500 font-medium text-sm animate-fade-in">
                            Preparing your intelligence report...
                        </p>
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
                            Your bespoke pricing strategy has been assembled securely. You can download your premium PDF below, and a copy has also been sent to your email.
                        </p>

                        {(() => {
                            const cd = reportPayload.claudeData;
                            const FALLBACK_HEADLINES = ["Report Unavailable", "An error occurred", "Report generation failed", "Report Pending"];
                            const isReportReady = cd !== null &&
                                typeof cd?.executive_summary === 'object' &&
                                typeof cd.executive_summary.headline === 'string' &&
                                cd.executive_summary.headline.length > 10 &&
                                !FALLBACK_HEADLINES.some(f => cd.executive_summary.headline.includes(f));

                            const handleDownloadPDF = async () => {
                                setPdfLoading(true);
                                try {
                                    const res = await fetch('http://127.0.0.1:3000/api/generate-pdf', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            claudeData: reportPayload.claudeData,
                                            pricingResult: savedSessionData?.pricingResult || { budget: 0, recommended: 0, premium: 0, analysis: { costPlusBase: 0, valueMultiplier: 1, totalUnitCost: 0 } },
                                            sessionData: savedSessionData || {},
                                            tier: savedTier
                                        })
                                    });
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `PricePoint_Intelligence_${documentId}.pdf`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                } catch (err) {
                                    console.error('PDF download error:', err);
                                } finally {
                                    setPdfLoading(false);
                                }
                            };

                            return isReportReady ? (
                            <button
                                onClick={handleDownloadPDF}
                                disabled={pdfLoading}
                                className="w-full py-5 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-lg outer-shadow transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide mb-4 disabled:opacity-70"
                            >
                                {pdfLoading ? <><Loader2 size={24} className="animate-spin" /> Generating PDF...</> : <><Download size={24} /> Download Premium Report</>}
                            </button>
                            ) : (
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 font-bold text-lg flex items-center justify-center gap-2 mb-4 transition-all active:scale-95"
                            >
                                <X size={24} /> Generation Failed — Try Again
                            </button>
                            );
                        })()}

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
