import React, { useCallback } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useMindMapStore } from '../store/useMindMapStore';
import type { JourneyType } from '../types/session';

/**
 * LandingView — The initial neumorphic wizard layout.
 * Presents two journey paths for the user to choose from.
 */
export const LandingView: React.FC = () => {
    const setJourneyType = useSessionStore((s) => s.setJourneyType);
    const goToMap = useMindMapStore((s) => s.goToMap);

    const handleJourneyClick = useCallback(
        (type: JourneyType) => {
            setJourneyType(type);  // Store selected type in session
            goToMap(type);         // Navigate + immediately dim the other card
        },
        [setJourneyType, goToMap]
    );

    return (
        <main className="relative flex items-center justify-center w-full h-full p-8">

            {/* ── Headline Overlay ── */}
            <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2 text-center z-20">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    What are you pricing today?
                </h1>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Select your path to begin analysis.
                </p>
            </div>

            {/* ── Solid Connection Lines ── */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[720px] h-0.5 bg-gray-300 dark:bg-gray-600 opacity-50 -z-10"></div>

            {/* ── Three Core Nodes ── */}
            <div className="flex items-center gap-24 relative z-10">

                {/* ──── Left Card: Optimise Existing Product ──── */}
                <div
                    onClick={() => handleJourneyClick('established_seller')}
                    className="hover-in-shadow-lg w-80 h-48 rounded-2xl bg-background-light dark:bg-background-dark flex flex-col justify-between p-6 cursor-pointer"
                >
                    <div className="flex items-start gap-4">
                        <div className="inner-shadow w-12 h-12 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 flex-shrink-0">
                            <span className="material-icons-round">search</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                Optimise Existing Product
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                Audit my current price &amp; find lost margin.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end items-end">
                        <span className="material-icons-round text-gray-400 dark:text-gray-500 text-sm">arrow_forward</span>
                    </div>
                </div>

                {/* ──── Center Node: PRICEPOINT ──── */}
                <div className="relative w-64 h-64 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-0 rounded-full outer-shadow-lg"></div>
                    <div className="absolute inset-4 rounded-full inner-shadow border-4 border-transparent dark:border-gray-700/20"></div>
                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-1 bg-primary mb-3 rounded-full"></div>
                        <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white tracking-widest">
                            PRICEPOINT
                        </h2>
                    </div>
                    <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 dark:bg-gray-600 rounded-r shadow-sm"></div>
                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 dark:bg-gray-600 rounded-l shadow-sm"></div>
                </div>

                {/* ──── Right Card: Launch New Product ──── */}
                <div
                    onClick={() => handleJourneyClick('new_launcher')}
                    className="hover-in-shadow-lg w-80 h-48 rounded-2xl bg-background-light dark:bg-background-dark flex flex-col justify-between p-6 cursor-pointer"
                >
                    <div className="flex items-start gap-4">
                        <div className="inner-shadow w-12 h-12 rounded-xl flex items-center justify-center text-secondary flex-shrink-0">
                            <span className="material-icons-round">rocket_launch</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">
                                Launch New Product
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                Build a data-backed price from scratch.
                            </p>
                        </div>
                    </div>
                    <div className="flex justify-end items-end">
                        <span className="material-icons-round text-gray-400 dark:text-gray-500 text-sm">arrow_forward</span>
                    </div>
                </div>

            </div>
        </main>
    );
};
