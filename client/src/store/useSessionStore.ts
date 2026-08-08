import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    SessionData,
    SessionStage,
    JourneyType,
    ProductType,
    AnswerRecord,
    defaultJourneyAContext,
    defaultJourneyBContext,
} from '../types/session';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ============================================================
// Session Store — Business Logic State
//
// Draft Save & Resume:
// - Anonymous users: state persists to localStorage automatically
// - Authenticated users: syncs to backend on each card completion
// - On login: conflict resolution merges local + server drafts
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

/** Generate a UUID v4 for client-side session IDs */
function generateUUID(): string {
    return crypto.randomUUID();
}

interface SessionActions {
    setJourneyType: (type: JourneyType) => void;
    setProductType: (type: ProductType) => void;
    addAnswer: (questionId: string, value: unknown) => void;
    setCurrentStage: (stage: SessionStage) => void;
    completeStage: (stage: SessionStage) => void;
    unlockQuote: (email: string) => void;
    resetSession: () => void;

    // Auth
    user: User | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;

    // Draft sync
    syncDraftToBackend: () => Promise<void>;
    hydrateDraft: (draft: Partial<SessionData>) => void;
    hasProgress: () => boolean;
}

type SessionStore = SessionData & SessionActions;

const initialState: SessionData = {
    sessionId: null,
    journeyType: null,
    productType: null,
    currentStage: 'journey_selection',
    answers: {},
    journeyAContext: { ...defaultJourneyAContext },
    journeyBContext: { ...defaultJourneyBContext },
    completedStages: [],
    isUnlocked: false,
    createdAt: null,
    updatedAt: null,
    user: null,
    isAuthenticated: false,
};

// ── AbortController for in-flight sync cancellation ──────────
let activeSyncController: AbortController | null = null;

export const useSessionStore = create<SessionStore>()(
    persist(
        (set, get) => ({
            ...initialState,

            setJourneyType: (type) => {
                const state = get();
                set({
                    journeyType: type,
                    updatedAt: Date.now(),
                    createdAt: state.createdAt ?? Date.now(),
                    // Generate sessionId on first meaningful interaction
                    sessionId: state.sessionId ?? generateUUID(),
                });
            },

            setProductType: (type) =>
                set({
                    productType: type,
                    updatedAt: Date.now(),
                }),

            addAnswer: (questionId, value) => {
                const record: AnswerRecord = {
                    questionId,
                    value,
                    timestamp: Date.now(),
                };
                set({
                    answers: { ...get().answers, [questionId]: record },
                    updatedAt: Date.now(),
                });
            },

            setCurrentStage: (stage) =>
                set({
                    currentStage: stage,
                    updatedAt: Date.now(),
                }),

            completeStage: (stage) => {
                const completed = get().completedStages;
                if (!completed.includes(stage)) {
                    set({
                        completedStages: [...completed, stage],
                        updatedAt: Date.now(),
                    });
                }

                // Sync to backend if authenticated (hybrid approach: save on each card completion)
                if (get().isAuthenticated) {
                    get().syncDraftToBackend();
                }
            },

            unlockQuote: (_email) => {
                set({
                    isUnlocked: true,
                    updatedAt: Date.now(),
                });
            },

            resetSession: () => set({ ...initialState }),

            setUser: (user) =>
                set({
                    user,
                    isAuthenticated: !!user,
                    updatedAt: Date.now(),
                }),

            // ── Draft Sync ───────────────────────────────────────
            syncDraftToBackend: async () => {
                const state = get();

                // Nothing to sync if no journey has been started
                if (!state.sessionId || !state.journeyType) return;

                // Cancel any in-flight sync request
                if (activeSyncController) {
                    activeSyncController.abort();
                }
                activeSyncController = new AbortController();

                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session?.access_token) {
                        console.warn('[DraftSync] No auth session available, skipping sync.');
                        return;
                    }

                    const payload = {
                        sessionId: state.sessionId,
                        lastUpdatedAt: state.updatedAt,
                        journeyType: state.journeyType,
                        productType: state.productType,
                        currentStage: state.currentStage,
                        answers: state.answers,
                        journeyAContext: state.journeyAContext,
                        journeyBContext: state.journeyBContext,
                        completedStages: state.completedStages,
                        isUnlocked: state.isUnlocked,
                        createdAt: state.createdAt,
                    };

                    const res = await fetch(`${API_BASE}/api/user/draft`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify(payload),
                        signal: activeSyncController.signal,
                    });

                    if (res.status === 401) {
                        // Token might be expired — try refreshing once
                        console.warn('[DraftSync] Got 401, attempting token refresh...');
                        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                        if (refreshError || !refreshData.session) {
                            console.error('[DraftSync] Token refresh failed. Draft queued in localStorage for next auth.');
                            return;
                        }

                        // Retry with fresh token
                        const retryRes = await fetch(`${API_BASE}/api/user/draft`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${refreshData.session.access_token}`,
                            },
                            body: JSON.stringify(payload),
                            signal: activeSyncController.signal,
                        });

                        if (!retryRes.ok) {
                            console.error('[DraftSync] Retry after refresh failed:', retryRes.status);
                        }
                    } else if (!res.ok && res.status !== 409) {
                        // 409 = stale write, not an error worth logging loudly
                        console.error('[DraftSync] Sync failed:', res.status);
                    }
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        // Expected when a new sync supersedes this one
                        return;
                    }
                    console.error('[DraftSync] Network error:', err.message);
                } finally {
                    activeSyncController = null;
                }
            },

            // ── Hydrate draft from server or conflict resolution ─
            hydrateDraft: (draft: Partial<SessionData>) => {
                set({
                    ...draft,
                    // Preserve current auth state — never overwrite from draft
                    user: get().user,
                    isAuthenticated: get().isAuthenticated,
                });
            },

            // ── Check if the session has meaningful progress ─────
            hasProgress: () => {
                const state = get();
                return !!(
                    state.journeyType ||
                    state.completedStages.length > 0 ||
                    Object.keys(state.answers).length > 0
                );
            },
        }),
        {
            name: 'pricepoint-session-draft',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            // Never persist auth state — stale tokens in localStorage are dangerous
            partialize: (state) => {
                const { user, isAuthenticated, ...rest } = state;
                return rest;
            },
            // Migration function for future schema changes
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // v0 → v1: no changes needed yet, but the structure is in place
                    return persistedState;
                }
                return persistedState;
            },
        }
    )
);
