import { useState } from 'react';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import { LandingView } from './components/LandingView';
import { MindMap } from './components/MindMap/MindMap';
import { useMindMapStore } from './store/useMindMapStore';

function App() {
  const isExpanded = useMindMapStore((s) => s.isExpanded);
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark((prev) => !prev);
  };

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
