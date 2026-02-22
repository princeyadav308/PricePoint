import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        }
                    }
                });
                if (error) throw error;
                // Since this is a simple demo, we'll assume signup auto-logs in or prompts verification
                onSuccess();
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'An error occurred with Google login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm animate-fade-in">
            {/* Modal Container */}
            <div className="relative w-full max-w-md p-8 bg-background-light dark:bg-background-dark rounded-3xl outer-shadow-lg mx-auto border border-white/20 dark:border-white/5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-text-light dark:hover:text-text-dark bg-background-light dark:bg-background-dark rounded-full inner-shadow transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-2xl font-bold text-center text-text-light dark:text-text-dark mb-2">
                    {isSignUp ? 'Create Account' : 'Sign In'}
                </h2>
                <p className="text-center text-slate-500 mb-8 text-sm">
                    {isSignUp ? 'Join to unlock detailed pricing intelligence.' : 'Access your personalized reports.'}
                </p>

                <form onSubmit={handleAuth} className="space-y-6">
                    {/* Full Name Input (Only on Sign Up) */}
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                required={isSignUp}
                                className="w-full px-5 py-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark rounded-2xl inner-shadow border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    )}

                    {/* Email Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-5 py-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark rounded-2xl inner-shadow border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2 ml-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            minLength={6}
                            className="w-full px-5 py-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark rounded-2xl inner-shadow border-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-500 text-sm font-medium text-center px-2">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-semibold rounded-2xl hover-in-shadow active:active-pressed focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                    </button>
                </form>

                <div className="relative mt-8 mb-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 text-slate-400 bg-background-light dark:bg-background-dark">Or</span>
                    </div>
                </div>

                {/* Google OAuth Button */}
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-4 bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark font-semibold rounded-2xl hover-in-shadow active:active-pressed flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                </button>

                {/* Toggle Mode */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-sm font-medium text-[#1E90FF] dark:text-[#55aaff] hover:underline transition-colors focus:outline-none"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create one'}
                    </button>
                </div>
            </div>
        </div>
    );
};
