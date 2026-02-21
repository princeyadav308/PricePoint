import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ── DEV HELPER: expose stores for console-driven testing ──
import { useMindMapStore } from './store/useMindMapStore'
import { useSessionStore } from './store/useSessionStore'
if (import.meta.env.DEV) {
  (window as any).__mindMapStore = useMindMapStore;
  (window as any).__sessionStore = useSessionStore;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
