import React from 'react';

/**
 * Footer — Wizard flow controls.
 * Only breadcrumbs (bottom-left) and zoom/pan (bottom-right).
 * No builder buttons (ADD_NODE, EXPORT_CSV, PARAMS removed for wizard flow).
 */
const Footer: React.FC = () => {
    return (
        <footer className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-50 pointer-events-none">
            {/* ── Breadcrumbs ── */}
            <div className="pointer-events-auto flex items-center gap-4 bg-background-light dark:bg-background-dark px-6 py-3 rounded-2xl outer-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <span className="material-icons-round text-sm">grid_view</span>
                    PricePoint
                </div>
                <span className="material-icons-round text-gray-400 dark:text-gray-600 text-xs">chevron_right</span>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">
                    <span className="text-primary material-icons-round text-sm">star</span>
                    Pricing Strategy
                </div>
            </div>

            {/* ── Right Section: Zoom/Pan Controls ── */}
            <div className="pointer-events-auto flex flex-col gap-4 items-end">
                <div className="flex items-center bg-background-light dark:bg-background-dark rounded-xl outer-shadow p-1">
                    <button className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer">
                        <span className="material-icons-round text-sm">add</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                    <button className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer">
                        <span className="material-icons-round text-sm">remove</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                    <button className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer">
                        <span className="material-icons-round text-sm">center_focus_weak</span>
                    </button>
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                    <button className="active-pressed w-10 h-10 flex items-center justify-center rounded-lg text-gray-800 dark:text-gray-200 cursor-pointer">
                        <span className="material-icons-round text-sm">pan_tool</span>
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
