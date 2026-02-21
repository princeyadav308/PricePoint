import { create } from 'zustand';
import {
    SessionData,
    SessionStage,
    JourneyType,
    ProductType,
    AnswerRecord,
    defaultJourneyAContext,
    defaultJourneyBContext,
} from '../types/session';

// ============================================================
// Session Store — Business Logic State
// ============================================================

interface SessionActions {
    setJourneyType: (type: JourneyType) => void;
    setProductType: (type: ProductType) => void;
    addAnswer: (questionId: string, value: unknown) => void;
    setCurrentStage: (stage: SessionStage) => void;
    completeStage: (stage: SessionStage) => void;
    unlockQuote: (email: string) => void;
    resetSession: () => void;
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
};

export const useSessionStore = create<SessionStore>((set, get) => ({
    ...initialState,

    setJourneyType: (type) =>
        set({
            journeyType: type,
            updatedAt: Date.now(),
            createdAt: get().createdAt ?? Date.now(),
        }),

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
    },

    unlockQuote: (_email) => {
        set({
            isUnlocked: true,
            updatedAt: Date.now(),
        });
    },

    resetSession: () => set({ ...initialState }),
}));
