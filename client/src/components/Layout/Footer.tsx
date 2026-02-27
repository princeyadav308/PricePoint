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

            {/* Zoom controls are rendered inside MindMap component */}
        </footer>
    );
};

export default Footer;
