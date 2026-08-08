import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/useSessionStore';
import { supabase } from '../lib/supabase';
import {
    User, LogOut, FileText, Calendar, CreditCard,
    ChevronRight, ArrowLeft, Download, Loader2, Crown,
    Shield, Star, Mail
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

interface UserProfile {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    memberSince: string;
}

interface UserReport {
    documentId: string;
    tier: string;
    paymentStatus: string;
    createdAt: string;
    amountPaid: number | null;
    currency: string | null;
    journeyType: string;
}

type View = 'overview' | 'reports';

export default function ProfilePage() {
    const navigate = useNavigate();
    const user = useSessionStore((s) => s.user);
    const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [reports, setReports] = useState<UserReport[]>([]);
    const [view, setView] = useState<View>('overview');
    const [loading, setLoading] = useState(true);
    const [reportsLoading, setReportsLoading] = useState(false);

    // Redirect to home if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // Fetch profile on mount
    useEffect(() => {
        if (!user) return;
        fetchProfile();
    }, [user]);

    const getAuthToken = async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = await getAuthToken();
            const res = await fetch(`${API_BASE}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
            }
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        try {
            setReportsLoading(true);
            const token = await getAuthToken();
            const res = await fetch(`${API_BASE}/api/user/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setReports(data.reports);
            }
        } catch (err) {
            console.error('Failed to fetch reports:', err);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleViewReports = () => {
        setView('reports');
        fetchReports();
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        useSessionStore.getState().resetSession();
        navigate('/');
    };

    const getInitials = (name: string | null, email: string | undefined) => {
        if (name && name.length > 0) {
            return name.charAt(0).toUpperCase();
        }
        return email ? email.charAt(0).toUpperCase() : 'U';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="text-slate-500 text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between bg-background-light dark:bg-background-dark">
                <button
                    onClick={() => view === 'reports' ? setView('overview') : navigate('/')}
                    className="hover-in-shadow p-3 rounded-xl bg-background-light dark:bg-background-dark text-slate-500 hover:text-text-light dark:hover:text-text-dark transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-bold">{view === 'reports' ? 'Profile' : 'Dashboard'}</span>
                </button>
                <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded shadow-md uppercase tracking-wide">
                    Profile
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 pb-16">
                {view === 'overview' ? (
                    /* ──────────────── PROFILE OVERVIEW ──────────────── */
                    <div className="animate-fade-in">
                        {/* Profile Card */}
                        <div className="outer-shadow-lg rounded-3xl p-8 bg-background-light dark:bg-background-dark mb-6">
                            <div className="flex flex-col items-center text-center">
                                {/* Avatar */}
                                <div className="w-24 h-24 rounded-full inner-shadow bg-background-light dark:bg-background-dark flex items-center justify-center mb-5">
                                    <span className="text-4xl font-extrabold text-primary">
                                        {getInitials(profile?.fullName || null, profile?.email)}
                                    </span>
                                </div>

                                {/* Name & Email */}
                                <h2 className="text-xl font-extrabold text-text-light dark:text-text-dark tracking-tight mb-1">
                                    {profile?.fullName || 'PricePoint User'}
                                </h2>
                                <p className="text-sm text-slate-500 mb-1 flex items-center gap-1.5">
                                    <Mail size={13} />
                                    {profile?.email}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Member since {profile?.memberSince ? formatDate(profile.memberSince) : '—'}
                                </p>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-3">
                            {/* All Reports */}
                            <button
                                onClick={handleViewReports}
                                className="w-full hover-in-shadow-lg rounded-2xl p-5 bg-background-light dark:bg-background-dark flex items-center gap-4 text-left"
                            >
                                <div className="w-11 h-11 rounded-xl inner-shadow bg-background-light dark:bg-background-dark flex items-center justify-center text-primary">
                                    <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-light dark:text-text-dark">All Reports</p>
                                    <p className="text-xs text-slate-500">View and download your pricing reports</p>
                                </div>
                                <ChevronRight size={18} className="text-slate-400 flex-shrink-0" />
                            </button>

                            {/* Account Info */}
                            <div className="outer-shadow-lg rounded-2xl p-5 bg-background-light dark:bg-background-dark flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl inner-shadow bg-background-light dark:bg-background-dark flex items-center justify-center text-secondary">
                                    <User size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-text-light dark:text-text-dark">Account</p>
                                    <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
                                </div>
                            </div>

                            {/* Sign Out */}
                            <button
                                onClick={handleSignOut}
                                className="w-full hover-in-shadow rounded-2xl p-5 bg-background-light dark:bg-background-dark flex items-center gap-4 text-left group"
                            >
                                <div className="w-11 h-11 rounded-xl inner-shadow bg-background-light dark:bg-background-dark flex items-center justify-center text-red-400 group-hover:text-red-500 transition-colors">
                                    <LogOut size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-red-500">Sign Out</p>
                                    <p className="text-xs text-slate-500">Log out of your account</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* ──────────────── REPORTS LIST ──────────────── */
                    <div className="animate-fade-in">
                        <div className="mb-6">
                            <h2 className="text-2xl font-extrabold text-text-light dark:text-text-dark tracking-tight mb-1">
                                Your Reports
                            </h2>
                            <p className="text-sm text-slate-500">
                                {reports.length} report{reports.length !== 1 ? 's' : ''} generated
                            </p>
                        </div>

                        {reportsLoading ? (
                            <div className="flex flex-col items-center py-16 gap-4">
                                <Loader2 size={28} className="animate-spin text-primary" />
                                <p className="text-slate-500 text-sm">Loading reports...</p>
                            </div>
                        ) : reports.length === 0 ? (
                            <div className="outer-shadow-lg rounded-3xl p-12 bg-background-light dark:bg-background-dark text-center">
                                <div className="w-16 h-16 mx-auto rounded-2xl inner-shadow bg-background-light dark:bg-background-dark flex items-center justify-center mb-5 text-slate-400">
                                    <FileText size={28} />
                                </div>
                                <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-2">No Reports Yet</h3>
                                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                    Complete a pricing analysis to generate your first intelligence report.
                                </p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="outer-shadow px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:-translate-y-0.5 active:scale-95 transition-all"
                                >
                                    Start Analysis
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <ReportCard key={report.documentId} report={report} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}

/* ──────────────── REPORT CARD COMPONENT ──────────────── */

function ReportCard({ report }: { report: UserReport }) {
    const [loadingData, setLoadingData] = useState(false);

    const getAuthToken = async () => {
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token || '';
    };

    const handleDownload = async () => {
        setLoadingData(true);
        try {
            const token = await getAuthToken();
            const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

            // Step 1: Try the cache endpoint first (instant — no Claude or Puppeteer)
            const cacheRes = await fetch(`${API_BASE}/api/reports/${report.documentId}/pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (cacheRes.ok) {
                // Cache hit — open signed URL directly (instant download)
                const cacheData = await cacheRes.json();
                window.open(cacheData.url, '_blank');
                return;
            }

            if (cacheRes.status === 409) {
                // Another process is still generating — auto-retry up to 3 times (every 5s)
                for (let attempt = 0; attempt < 3; attempt++) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    const retryRes = await fetch(`${API_BASE}/api/reports/${report.documentId}/pdf`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (retryRes.ok) {
                        const retryData = await retryRes.json();
                        window.open(retryData.url, '_blank');
                        return;
                    }
                    if (retryRes.status !== 409) break; // no longer generating, fall through
                }
                // Exhausted retries — fall through to full generation
            }

            if (cacheRes.status === 403) {
                console.error('Access denied to report');
                return;
            }

            // Step 2: Cache miss (404) or retries exhausted — full generation flow
            // 2a. Fetch full report data from backend
            const res = await fetch(`${API_BASE}/api/user/reports/${report.documentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (!data.success) {
                console.error('Failed to fetch report data');
                return;
            }

            // 2b. Generate Claude narrative
            const genRes = await fetch(`${API_BASE}/api/generate-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    documentId: report.documentId,
                    sessionData: data.report.sessionData,
                    pricingResult: data.report.sessionData?.pricingResult,
                    appliedModifiers: data.report.sessionData?.pricingResult?.appliedModifiers || [],
                    tier: data.report.tier
                })
            });
            const genData = await genRes.json();

            const claudeData = genData.claudeData || {
                report_meta: { journey_type: 'unknown', tier: data.report.tier.toLowerCase(), one_line_verdict: 'Report data available.' },
                executive_summary: { headline: 'Report', summary: 'Report data loaded from archive.', pricing_verdict: {} },
                next_steps: ['Review pricing strategy']
            };
            const validationReport = genData.validationReport || null;

            // 2c. Generate PDF via Puppeteer — passes documentId so it gets cached
            const pdfRes = await fetch(`${API_BASE}/api/generate-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId: report.documentId,
                    claudeData,
                    pricingResult: data.report.sessionData?.pricingResult || { budget: 0, recommended: 0, premium: 0, analysis: { costPlusBase: 0, valueMultiplier: 1, totalUnitCost: 0 } },
                    sessionData: data.report.sessionData || {},
                    tier: report.tier,
                    validationReport
                })
            });
            const blob = await pdfRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const projectName = data.report.sessionData?.answers?.projectName?.value || 'PricePoint';
            a.download = `${projectName} Price Report.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error generating report PDF:', err);
        } finally {
            setLoadingData(false);
        }
    };

    const getTierIcon = (tier: string) => {
        switch (tier) {
            case 'Investor': return <Crown size={14} />;
            case 'Professional': return <Shield size={14} />;
            default: return <Star size={14} />;
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Investor': return 'bg-amber-500/15 text-amber-600';
            case 'Professional': return 'bg-blue-500/15 text-blue-600';
            default: return 'bg-emerald-500/15 text-emerald-600';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatPrice = (amount: number | null, currency: string | null) => {
        if (!amount) return 'Paid';
        const curr = currency || 'USD';
        return `${curr} ${amount.toFixed(2)}`;
    };

    return (
        <div className="outer-shadow-lg rounded-2xl bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Card Header */}
            <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                    {/* Tier Badge */}
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${getTierColor(report.tier)}`}>
                        {getTierIcon(report.tier)}
                        {report.tier}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                        #{report.documentId.slice(0, 8).toUpperCase()}
                    </span>
                </div>

                {/* Journey Type */}
                <p className="text-sm font-bold text-text-light dark:text-text-dark mb-3 capitalize">
                    {report.journeyType.replace(/_/g, ' ')} Report
                </p>

                {/* Details Row */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(report.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                        <CreditCard size={12} />
                        {formatPrice(report.amountPaid, report.currency)}
                    </span>
                </div>
            </div>

            {/* Download Section */}
            <div className="px-5 pb-5">
                <button
                    onClick={handleDownload}
                    disabled={loadingData}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm outer-shadow transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loadingData ? (
                        <><Loader2 size={16} className="animate-spin" /> Generating PDF...</>
                    ) : (
                        <><Download size={16} /> Download Report</>
                    )}
                </button>
            </div>
        </div>
    );
}
