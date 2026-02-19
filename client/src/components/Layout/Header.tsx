import React from 'react';

interface HeaderProps {
    isDark: boolean;
    toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggleDarkMode }) => {
    return (
        <header className="absolute top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 pointer-events-none">
            <div className="flex items-center gap-4 pointer-events-auto">
                <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded shadow-md uppercase tracking-wide">
                    v2.0 Alpha
                </div>
                <h1 className="text-sm font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
                    Pricepoint_Intelligence_System
                </h1>
            </div>
            <div className="flex items-center gap-4 pointer-events-auto">
                <button
                    className="hover-in-shadow p-2.5 rounded-full bg-background-light dark:bg-background-dark text-gray-500 hover:text-primary transition-all cursor-pointer"
                    onClick={toggleDarkMode}
                    title="Toggle Dark Mode"
                >
                    <span className="material-icons-round text-xl">
                        {isDark ? 'light_mode' : 'dark_mode'}
                    </span>
                </button>
                <div className="outer-shadow px-4 py-2 rounded-xl bg-background-light dark:bg-background-dark flex items-center gap-2 border border-gray-100 dark:border-gray-700/30">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold tracking-wider text-gray-600 dark:text-gray-300">
                        SYS_ACTIVE_LIVE
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
