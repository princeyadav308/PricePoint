import { useState } from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { LandingView } from './components/LandingView';
import { MindMap } from './components/MindMap/MindMap';
import { useMindMapStore } from './store/useMindMapStore';
import { useSessionStore } from './store/useSessionStore';
import { supabase } from './lib/supabase';
import { useEffect } from 'react';

function App() {
  const isExpanded = useMindMapStore((s) => s.isExpanded);
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark((prev) => !prev);
  };

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      useSessionStore.getState().setUser(session?.user ?? null);
    });

    // Listen for auth changes (login, logout, etc)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      useSessionStore.getState().setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark relative transition-theme selection:bg-primary selection:text-white">
      {/* Header & Footer are absolute overlays — they don't push content */}
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />

      {isExpanded ? (
        <div className="w-full h-full">
          <MindMap />
        </div>
      ) : (
        <LandingView />
      )}

      <Footer />
    </div>
  );
}

export default App;
