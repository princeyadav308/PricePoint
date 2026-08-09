import { useState, useEffect, useCallback } from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { LandingView } from './components/LandingView';
import { MindMap } from './components/MindMap/MindMap';
import { useMindMapStore } from './store/useMindMapStore';
import { useSessionStore } from './store/useSessionStore';
import { useIntelligenceStore } from './store/useIntelligenceStore';
import { DraftConflictModal } from './components/DraftConflictModal';
import { supabase } from './lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

// ── Types for draft conflict resolution ──────────────────────
interface ServerDraft {
  sessionId: string | null;
  journeyType: string | null;
  lastUpdatedAt: string | null;
  rawData: any;
}

interface ConflictState {
  localDraft: {
    sessionId: string | null;
    journeyType: string | null;
    completedStages: string[];
    updatedAt: number | null;
  };
  serverDraft: {
    sessionId: string | null;
    journeyType: string | null;
    completedStages: string[];
    updatedAt: number | null;
  };
  serverRawData: any;
}

function App() {
  const isExpanded = useMindMapStore((s) => s.isExpanded);
  const [isDark, setIsDark] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [conflictState, setConflictState] = useState<ConflictState | null>(null);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark((prev) => !prev);
  };

  // ── Draft Conflict Resolution on Login ─────────────────────
  const handleLoginDraftSync = useCallback(async (accessToken: string) => {
    try {
      const sessionStore = useSessionStore.getState();
      const localHasProgress = sessionStore.hasProgress();

      // Fetch server draft
      const res = await fetch(`${API_BASE}/api/user/draft`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        // If fetch fails, just sync local to server if we have progress
        if (localHasProgress) {
          sessionStore.syncDraftToBackend();
        }
        return;
      }

      const { draft: serverDraft }: { draft: ServerDraft | null } = await res.json();
      const serverHasProgress = !!(
        serverDraft?.rawData?.journeyType ||
        (serverDraft?.rawData?.completedStages?.length > 0) ||
        (serverDraft?.rawData?.answers && Object.keys(serverDraft.rawData.answers).length > 0)
      );

      // ── Case 1: Only one side has progress → auto-resolve ──
      if (localHasProgress && !serverHasProgress) {
        // Push local to server
        console.log('[DraftSync] Only local has progress → pushing to server');
        sessionStore.syncDraftToBackend();
        return;
      }

      if (!localHasProgress && serverHasProgress) {
        // Pull server to local
        console.log('[DraftSync] Only server has progress → hydrating local');
        sessionStore.hydrateDraft({
          sessionId: serverDraft!.sessionId,
          journeyType: serverDraft!.rawData.journeyType,
          productType: serverDraft!.rawData.productType,
          currentStage: serverDraft!.rawData.currentStage || 'journey_selection',
          answers: serverDraft!.rawData.answers || {},
          journeyAContext: serverDraft!.rawData.journeyAContext,
          journeyBContext: serverDraft!.rawData.journeyBContext,
          completedStages: serverDraft!.rawData.completedStages || [],
          isUnlocked: serverDraft!.rawData.isUnlocked || false,
          createdAt: serverDraft!.rawData.createdAt,
          updatedAt: new Date(serverDraft!.lastUpdatedAt || 0).getTime() || Date.now(),
        });
        return;
      }

      if (!localHasProgress && !serverHasProgress) {
        // Neither has progress — nothing to do
        return;
      }

      // ── Both have progress ─────────────────────────────────
      const localSessionId = sessionStore.sessionId;
      const serverSessionId = serverDraft!.sessionId;

      // ── Case 2: Same session (local was synced from this account) ──
      if (localSessionId && localSessionId === serverSessionId) {
        const localTs = sessionStore.updatedAt || 0;
        const serverTs = new Date(serverDraft!.lastUpdatedAt || 0).getTime() || 0;

        if (localTs >= serverTs) {
          console.log('[DraftSync] Same session, local is newer → pushing to server');
          sessionStore.syncDraftToBackend();
        } else {
          console.log('[DraftSync] Same session, server is newer → hydrating local');
          sessionStore.hydrateDraft({
            sessionId: serverDraft!.sessionId,
            journeyType: serverDraft!.rawData.journeyType,
            productType: serverDraft!.rawData.productType,
            currentStage: serverDraft!.rawData.currentStage || 'journey_selection',
            answers: serverDraft!.rawData.answers || {},
            journeyAContext: serverDraft!.rawData.journeyAContext,
            journeyBContext: serverDraft!.rawData.journeyBContext,
            completedStages: serverDraft!.rawData.completedStages || [],
            isUnlocked: serverDraft!.rawData.isUnlocked || false,
            createdAt: serverDraft!.rawData.createdAt,
            updatedAt: serverTs,
          });
        }
        return;
      }

      // ── Case 3: Different sessions — genuinely ambiguous → show modal ──
      console.log('[DraftSync] Different sessions with progress → showing conflict modal');
      setConflictState({
        localDraft: {
          sessionId: localSessionId,
          journeyType: sessionStore.journeyType,
          completedStages: sessionStore.completedStages,
          updatedAt: sessionStore.updatedAt,
        },
        serverDraft: {
          sessionId: serverSessionId,
          journeyType: serverDraft!.rawData.journeyType,
          completedStages: serverDraft!.rawData.completedStages || [],
          updatedAt: new Date(serverDraft!.lastUpdatedAt || 0).getTime() || null,
        },
        serverRawData: serverDraft!.rawData,
      });
    } catch (err) {
      console.error('[DraftSync] Error during login sync:', err);
    }
  }, []);

  // ── Conflict resolution handlers ──────────────────────────
  const handleChooseLocal = useCallback(() => {
    console.log('[DraftSync] User chose local draft');
    setConflictState(null);
    // Push local state to server (overwrites the server draft)
    useSessionStore.getState().syncDraftToBackend();
  }, []);

  const handleChooseServer = useCallback(() => {
    if (!conflictState) return;
    console.log('[DraftSync] User chose server draft');
    const sd = conflictState.serverRawData;
    useSessionStore.getState().hydrateDraft({
      sessionId: conflictState.serverDraft.sessionId,
      journeyType: sd.journeyType,
      productType: sd.productType,
      currentStage: sd.currentStage || 'journey_selection',
      answers: sd.answers || {},
      journeyAContext: sd.journeyAContext,
      journeyBContext: sd.journeyBContext,
      completedStages: sd.completedStages || [],
      isUnlocked: sd.isUnlocked || false,
      createdAt: sd.createdAt,
      updatedAt: conflictState.serverDraft.updatedAt,
    });
    setConflictState(null);
  }, [conflictState]);

  const handleDismissConflict = useCallback(() => {
    // Dismissing keeps local state as-is (doesn't overwrite either)
    setConflictState(null);
  }, []);

  useEffect(() => {
    // Fire geolocation silently on app load (non-blocking)
    useIntelligenceStore.getState().runGeolocate();

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      useSessionStore.getState().setUser(session?.user ?? null);
      setAuthLoading(false);

      // If already logged in on mount, sync drafts
      if (session?.access_token) {
        handleLoginDraftSync(session.access_token);
      }
    });

    // Listen for auth changes (login, logout, etc)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      useSessionStore.getState().setUser(session?.user ?? null);

      // Clear the URL fragment (e.g. #access_token=...) after successful login
      if (event === 'SIGNED_IN' && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      }

      // Trigger draft sync on login
      if (event === 'SIGNED_IN' && session?.access_token) {
        handleLoginDraftSync(session.access_token);
      }
    });

    return () => subscription.unsubscribe();
  }, [handleLoginDraftSync]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark relative transition-theme selection:bg-primary selection:text-white">
      {/* Header & Footer are absolute overlays — they don't push content */}
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />

      {authLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : isExpanded ? (
        <div className="w-full h-full">
          <MindMap />
        </div>
      ) : (
        <LandingView />
      )}

      <Footer />

      {/* Draft Conflict Resolution Modal */}
      {conflictState && (
        <DraftConflictModal
          isOpen={true}
          localDraft={conflictState.localDraft}
          serverDraft={conflictState.serverDraft}
          onChooseLocal={handleChooseLocal}
          onChooseServer={handleChooseServer}
          onDismiss={handleDismissConflict}
        />
      )}
    </div>
  );
}

export default App;
