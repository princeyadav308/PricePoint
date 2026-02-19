# PricePoint v2.0 — Design System & Immutable Rules

> **Approved**: 15 Feb 2026  
> **Flow**: Wizard (guided journey selection, no manual node creation)  
> **Aesthetic**: Neumorphic light — soft shadows, rounded corners, Plus Jakarta Sans

---

## 🚫 Immutable Constraints

1. **DO NOT** change the layout structure of `LandingView.tsx`, `Header.tsx`, or `Footer.tsx`
2. **DO NOT** change shadow classes (`hover-in-shadow`, `hover-in-shadow-lg`, `inner-shadow`, `outer-shadow`, `outer-shadow-lg`, `active-pressed`)
3. **DO NOT** change color tokens in `tailwind.config.js` unless the user provides a new palette
4. **DO NOT** swap fonts — `Plus Jakarta Sans` is the sole typeface
5. **DO NOT** add builder buttons (ADD_NODE, EXPORT_CSV, PARAMS) — this is a wizard, not a builder
6. **DO NOT** add debug text, status codes (`[Status:]`), path codes (`_PATH_`), or technical pills (`AT_PRICING_CORE`)
7. **DO NOT** change the Header alignment — `px-6 py-4`, pill `py-1.5`, dark mode button `p-2.5`

---

## 🎨 Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#DFA81C` | Gold/Mustard — CTAs, highlights, accents |
| `primary-dark` | `#b88a14` | Hover state for primary |
| `secondary` | `#5EC6B3` | Teal — Journey B accents, icons |
| `background-light` | `#E0E5EC` | Light mode background |
| `background-dark` | `#2D3748` | Dark mode background |
| `text-light` | `#4A5568` | Light mode body text |
| `text-dark` | `#E2E8F0` | Dark mode body text |

---

## 🔲 Shadow System (CSS Custom Properties)

| Class | Effect | Usage |
|---|---|---|
| `outer-shadow` | Raised, 3px bilateral | Buttons, pills, small elements |
| `outer-shadow-lg` | Raised, 6px bilateral | Cards, center node rings |
| `inner-shadow` | Pressed inward, 3px | Icon containers, pressed buttons |
| `hover-in-shadow` | Raised → pressed on hover | Small interactive elements |
| `hover-in-shadow-lg` | Raised → pressed on hover (larger) | Card-level interactive elements |
| `active-pressed` | Permanently pressed | Currently active toggle (pan_tool) |

Auto-adapts to dark mode via `.dark` CSS variable overrides.

---

## 📐 Layout Architecture

```
┌──────────────────────────────────────────────────┐
│  Header (absolute, z-50, px-6 py-4)             │
│  [v2.0 Alpha]  [System Name]     [🌙] [STATUS]  │
├──────────────────────────────────────────────────┤
│                                                  │
│  "What are you pricing today?"  (headline, top)  │
│  "Select your path to begin analysis." (sub)     │
│                                                  │
│  ┌─────────┐                     ┌─────────┐    │
│  │  Card A  │ ── solid line ──── │  Card B  │    │
│  │ Optimise │    ┌───────┐       │  Launch  │    │
│  │ Existing │    │PRICE- │       │   New    │    │
│  │ Product  │    │POINT  │       │ Product  │    │
│  └─────────┘    └───────┘       └─────────┘    │
│                                                  │
├──────────────────────────────────────────────────┤
│  Footer (absolute, z-50)                        │
│  [PricePoint > Pricing Strategy]        [Zoom]   │
└──────────────────────────────────────────────────┘
```

---

## 📋 Approved Copy

| Element | Text |
|---|---|
| Headline | "What are you pricing today?" |
| Sub-headline | "Select your path to begin analysis." |
| Card A title | "Optimise Existing Product" |
| Card A subtitle | "Audit my current price & find lost margin." |
| Card B title | "Launch New Product" |
| Card B subtitle | "Build a data-backed price from scratch." |
| Center node | "PRICEPOINT" (no pill, no path code) |
| Breadcrumbs | "PricePoint > Pricing Strategy" |
| Header pill | "v2.0 Alpha" |
| Header system | "Pricepoint_Intelligence_System" |
| Header status | "SYS_ACTIVE_LIVE" |

---

## 🔤 Typography

| Property | Value |
|---|---|
| Font family | `Plus Jakarta Sans`, `Inter`, `sans-serif` |
| Headline | `text-3xl font-bold text-slate-800` |
| Sub-headline | `text-base font-medium text-slate-500` |
| Card titles | `text-sm font-bold` |
| Card subtitles | `text-xs text-gray-500 leading-relaxed` |
| System text | `text-xs font-bold tracking-wider uppercase` |

---

## 🧩 Component Registry

| Component | File | Status |
|---|---|---|
| Header | `src/components/Layout/Header.tsx` | 🔒 Locked |
| Footer | `src/components/Layout/Footer.tsx` | 🔒 Locked (wizard: breadcrumbs + zoom only) |
| LandingView | `src/components/LandingView.tsx` | 🔒 Locked |
| RootNode | `src/components/MindMap/nodes/RootNode.tsx` | 🔒 Locked |
| JourneyNode | `src/components/MindMap/nodes/JourneyNode.tsx` | 🔒 Locked |
| StageNode | `src/components/MindMap/nodes/StageNode.tsx` | ✏️ Editable (stages expand) |
| AnimatedEdge | `src/components/MindMap/edges/AnimatedEdge.tsx` | ✏️ Editable (new edge types) |
| MindMap | `src/components/MindMap/MindMap.tsx` | ✏️ Editable (new node types) |

---

## ✅ What IS Allowed

- Adding **new** node/edge types for the React Flow mind map
- Adding **new** stage wizard step components
- Modifying **state management** logic (Zustand stores)
- Adding **new routes/pages** that follow these design tokens
- Extending CSS with **new utility classes** using existing variables
- Expanding stages within the wizard flow
