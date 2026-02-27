import React, { useState } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { AuthModal } from '../AuthModal';
import { supabase } from '../../lib/supabase';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
    isDark: boolean;
    toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggleDarkMode }) => {
    const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
    const user = useSessionStore((s) => s.user);
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        useSessionStore.getState().resetSession();
    };

    return (
        <>
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
                        className="hover-in-shadow w-10 h-10 flex items-center justify-center rounded-full bg-background-light dark:bg-background-dark text-gray-500 hover:text-primary transition-all cursor-pointer"
                        onClick={toggleDarkMode}
                        title="Toggle Dark Mode"
                    >
                        <span className="material-icons-round text-xl">
                            {isDark ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>

                    {/* Auth Controls */}
                    {isAuthenticated ? (
                        <div className="flex items-center gap-2 outer-shadow rounded-xl bg-background-light dark:bg-background-dark border border-gray-100 dark:border-gray-700/30 p-1">
                            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg text-primary truncate max-w-[120px] md:max-w-[200px]">
                                <User size={14} />
                                <span className="text-xs font-bold truncate">{user?.email}</span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="hover-in-shadow p-2 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAuthModal(true)}
                            className="outer-shadow px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <User size={16} />
                            Sign In
                        </button>
                    )}
                </div>
            </header>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={() => setShowAuthModal(false)}
            />
        </>
    );
};

export default Header;
