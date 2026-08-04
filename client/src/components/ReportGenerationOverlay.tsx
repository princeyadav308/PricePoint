import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';

interface ReportGenerationOverlayProps {
    isGenerating: boolean;
    children: React.ReactNode;
}

const GENERATION_STEPS = [
    { threshold: 0, text: 'Initializing intelligence engine...' },
    { threshold: 15, text: 'Analyzing unit economics...' },
    { threshold: 35, text: 'Applying Van Westendorp models...' },
    { threshold: 55, text: 'Cross-referencing competitor pricing...' },
    { threshold: 75, text: 'Building Trinity Quote...' },
    { threshold: 90, text: 'Formatting Investor-Grade PDF...' },
    { threshold: 100, text: 'Report generated successfully.' },
];

export const ReportGenerationOverlay: React.FC<ReportGenerationOverlayProps> = ({ isGenerating, children }) => {
    const [progress, setProgress] = useState(0);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!isGenerating) {
            setProgress(0);
            setIsReady(false);
            return;
        }

        // Simulate progress
        const duration = 3500; // 3.5 seconds total
        const interval = 50;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
            
            // Add a little randomness to make it feel real
            const jitterValue = Math.random() > 0.8 ? 0 : newProgress;
            setProgress(prev => Math.max(prev, jitterValue));

            if (newProgress >= 100) {
                clearInterval(timer);
                setTimeout(() => setIsReady(true), 600);
            }
        }, interval);

        return () => clearInterval(timer);
    }, [isGenerating]);

    if (!isGenerating) return null;

    const currentStepText = GENERATION_STEPS.slice().reverse().find(s => progress >= s.threshold)?.text || GENERATION_STEPS[0].text;

    return (
        <div className="w-full mt-8 animate-in slide-in-from-top-4 fade-in duration-500">
            {!isReady ? (
                // ==========================================
                // GENERATING STATE
                // ==========================================
                <div className="w-full outer-shadow-lg rounded-3xl p-10 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark text-center min-h-[400px]">
                    <div className="relative w-20 h-20 mb-8">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
                        <div 
                            className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                            style={{ animationDuration: '1.5s' }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-primary">
                            <FileText size={24} />
                        </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-text-light dark:text-text-dark mb-4">
                        Compiling Intelligence Report
                    </h3>
                    
                    <div className="w-full max-w-md bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4 overflow-hidden inner-shadow">
                        <div 
                            className="bg-primary h-full rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    
                    <p className="text-sm text-slate-500 font-medium h-6 animate-pulse">
                        {currentStepText}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        {progress}% Complete
                    </p>
                </div>
            ) : (
                // ==========================================
                // READY / BLURRY PAYWALL STATE
                // ==========================================
                <div className="relative w-full rounded-3xl overflow-hidden outer-shadow-lg bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700">
                    
                    {/* Fake Document Background (Blurred) */}
                    <div className="absolute inset-0 p-8 opacity-40 filter blur-sm pointer-events-none select-none overflow-hidden">
                        {/* Fake Header */}
                        <div className="flex justify-between items-center border-b border-slate-300 dark:border-slate-600 pb-6 mb-6">
                            <div className="w-32 h-8 bg-slate-300 dark:bg-slate-600 rounded"></div>
                            <div className="w-16 h-6 bg-slate-300 dark:bg-slate-600 rounded"></div>
                        </div>
                        {/* Fake Title */}
                        <div className="w-3/4 h-10 bg-slate-300 dark:bg-slate-600 rounded mb-8"></div>
                        {/* Fake Grid */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-3">
                                <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                <div className="w-5/6 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                <div className="w-4/5 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                                <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                            </div>
                            {/* Fake Chart */}
                            <div className="w-full h-40 bg-slate-300 dark:bg-slate-600 rounded-xl"></div>
                        </div>
                        {/* Fake Paragraphs */}
                        <div className="space-y-3">
                            <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                            <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                            <div className="w-3/4 h-4 bg-slate-300 dark:bg-slate-600 rounded"></div>
                        </div>
                    </div>

                    {/* Gradient Overlay to make the text pop */}
                    <div className="absolute inset-0 bg-gradient-to-b from-background-light/80 to-background-light dark:from-background-dark/80 dark:to-background-dark pointer-events-none"></div>

                    {/* Content (Paywall Pitch + Tiers) */}
                    <div className="relative z-10 p-6 md:p-10 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center mb-6 outer-shadow animate-in zoom-in duration-500">
                            <CheckCircle2 size={32} />
                        </div>
                        
                        <h3 className="text-2xl md:text-3xl font-extrabold text-text-light dark:text-text-dark text-center mb-3">
                            Your Pricing Report is Ready
                        </h3>
                        <p className="text-sm md:text-base text-slate-500 text-center max-w-xl mb-10 leading-relaxed">
                            We've compiled your data into a comprehensive, investor-ready document. 
                            Select a tier below to unlock your full PDF and detailed analytics.
                        </p>

                        <div className="w-full">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
