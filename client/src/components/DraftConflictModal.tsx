import React from 'react';
import { GitBranch, Monitor, Cloud, X } from 'lucide-react';

// ============================================================
// DraftConflictModal — Shown when login detects genuinely
// ambiguous drafts (local anonymous progress + existing
// backend draft from a different session).
// ============================================================

interface DraftInfo {
    sessionId: string | null;
    journeyType: string | null;
    completedStages: string[];
    updatedAt: number | null;
}

interface DraftConflictModalProps {
    isOpen: boolean;
    localDraft: DraftInfo;
    serverDraft: DraftInfo;
    onChooseLocal: () => void;
    onChooseServer: () => void;
    onDismiss: () => void;
}

function formatDate(ts: number | null): string {
    if (!ts) return 'Unknown';
    return new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatJourney(type: string | null): string {
    if (type === 'established_seller') return 'Audit Existing Price';
    if (type === 'new_launcher') return 'Set Launch Price';
    return 'In progress';
}

export const DraftConflictModal: React.FC<DraftConflictModalProps> = ({
    isOpen,
    localDraft,
    serverDraft,
    onChooseLocal,
    onChooseServer,
    onDismiss,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg p-8 bg-background-light dark:bg-background-dark rounded-3xl outer-shadow-lg mx-auto border border-white/20 dark:border-white/5">
                {/* Close */}
                <button
                    onClick={onDismiss}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-text-light dark:hover:text-text-dark bg-background-light dark:bg-background-dark rounded-full inner-shadow transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-background-light dark:bg-background-dark rounded-full inner-shadow flex items-center justify-center">
                        <GitBranch className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-light dark:text-text-dark">
                            Two Saved Drafts Found
                        </h2>
                        <p className="text-sm text-slate-500">
                            Choose which draft to continue with
                        </p>
                    </div>
                </div>

                {/* Draft Cards */}
                <div className="space-y-4 mb-8">
                    {/* Local Draft */}
                    <button
                        onClick={onChooseLocal}
                        className="w-full text-left p-5 bg-background-light dark:bg-background-dark rounded-2xl inner-shadow hover:outer-shadow transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-background-light dark:bg-background-dark rounded-xl outer-shadow flex items-center justify-center flex-shrink-0 group-hover:inner-shadow transition-all">
                                <Monitor className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-text-light dark:text-text-dark mb-1">
                                    This Device
                                </div>
                                <div className="text-sm text-slate-500 space-y-0.5">
                                    <div>{formatJourney(localDraft.journeyType)}</div>
                                    <div>{localDraft.completedStages.length} card{localDraft.completedStages.length !== 1 ? 's' : ''} completed</div>
                                    <div className="text-xs text-slate-400">Last updated: {formatDate(localDraft.updatedAt)}</div>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Server Draft */}
                    <button
                        onClick={onChooseServer}
                        className="w-full text-left p-5 bg-background-light dark:bg-background-dark rounded-2xl inner-shadow hover:outer-shadow transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-background-light dark:bg-background-dark rounded-xl outer-shadow flex items-center justify-center flex-shrink-0 group-hover:inner-shadow transition-all">
                                <Cloud className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-text-light dark:text-text-dark mb-1">
                                    Your Account
                                </div>
                                <div className="text-sm text-slate-500 space-y-0.5">
                                    <div>{formatJourney(serverDraft.journeyType)}</div>
                                    <div>{serverDraft.completedStages.length} card{serverDraft.completedStages.length !== 1 ? 's' : ''} completed</div>
                                    <div className="text-xs text-slate-400">Last updated: {formatDate(serverDraft.updatedAt)}</div>
                                </div>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Hint */}
                <p className="text-xs text-center text-slate-400">
                    The draft you don't pick will be discarded.
                </p>
            </div>
        </div>
    );
};
