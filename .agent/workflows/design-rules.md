---
description: Hard rules for PricePoint UI — never change locked component layout or styles
---

# PricePoint v2 — Locked Design System

> [!CAUTION]
> These rules are LOCKED. No AI agent or developer may change colors, shadows, transitions, fonts, or hover effects without explicit user approval. All new components MUST follow this system exactly.

---

## 1. Color Palette

All colors live in `tailwind.config.js` and `index.css`. Use only these — never introduce new colors.

| Token | Value | Usage |
|---|---|---|
| `primary` | `#DFA81C` | Gold/Mustard — CTA, accents, selected edges |
| `primary-dark` | `#b88a14` | Hover state of primary |
| `secondary` | `#5EC6B3` | Teal — "established" journey icon, highlights |
| `background-light` | `#E0E5EC` | Page + card background (light mode) |
| `background-dark` | `#2D3748` | Page + card background (dark mode) |
| `text-light` | `#4A5568` | Body text (light mode) |
| `text-dark` | `#E2E8F0` | Body text (dark mode) |
| Navy accent | `#002147` | Mind map edges to classification card |
| Inactive/dimmed | `#CBD5E1` | Dimmed edge color |

> [!IMPORTANT]
> Card backgrounds MUST use `bg-background-light dark:bg-background-dark` — NEVER `bg-white`. The neumorphic shadow only renders correctly when the card color matches the page background.

---

## 2. Typography

- **Font family:** `'Plus Jakarta Sans'`, fallback `Inter`, then `sans-serif`
- Defined in `tailwind.config.js` under `fontFamily.sans` and `fontFamily.display`
- Do NOT introduce Google Fonts or any other font

| Role | Class |
|---|---|
| Headings | `font-bold` or `font-extrabold`, `tracking-tight` |
| Card titles | `font-bold text-gray-800 dark:text-gray-100 text-sm` |
| Card subtitles | `text-xs text-gray-500 dark:text-gray-400 leading-relaxed` |
| Page headline | `text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight` |

---

## 3. Shadow System

CSS variables are defined in `index.css` `:root`. **Never override these values.**

```css
/* Light mode */
--outer-shadow:    3px 3px 3px #d0d0d0, -3px -3px 3px #f8f8f8;
--inner-shadow:    inset 3px 3px 3px #d0d0d0, inset -3px -3px 3px #f8f8f8;
--outer-shadow-lg: 6px 6px 10px #c8ccd4, -6px -6px 10px #ffffff;
--inner-shadow-lg: inset 6px 6px 10px #c8ccd4, inset -6px -6px 10px #ffffff;
```

### Utility Classes

| Class | When to use |
|---|---|
| `.outer-shadow` | Small raised elements (badges, icon buttons) |
| `.outer-shadow-lg` | Large raised elements (non-interactive cards) |
| `.inner-shadow` | Inset/recessed elements (icon wells, inputs) |
| `.hover-in-shadow` | Small interactive elements (buttons, icon chips) |
| `.hover-in-shadow-lg` | **Large interactive cards (journey cards, landing cards)** |
| `.active-pressed` | Element is selected/chosen — permanently pressed in |

> [!IMPORTANT]
> `.hover-in-shadow-lg` is the ONLY correct hover class for cards. Do NOT use `hover:shadow-*` Tailwind utilities — they bypass the neumorphic system. The press-in effect (outer → inner on hover) must come from `.hover-in-shadow-lg`.

---

## 4. Hover & Transition Rules

### The Press-In Effect (`.hover-in-shadow-lg`)
- **Default state:** Outer shadow visible — card appears raised from surface
- **Hover state:** Outer shadow fades to 0, inner shadow appears via `::after` — card appears pressed in
- **Transition:** `all 0.3s ease` — do not change timing or easing
- **Selected/active state:** Use `.active-pressed` — permanently sunken, no hover transition needed

### Standard Transition
```css
transition: all 0.3s ease;
```
Applied via the `.hover-in-shadow-*` classes. For non-shadow transitions use Tailwind `transition-all duration-300`.

---

## 5. Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-xl` | `20px` | Icon wells, small chips |
| `rounded-2xl` | `24px` | Cards (journey, landing, classification) |
| `rounded-full` | 9999px | Root node circle, avatars |

---

## 6. Mind Map — Node Rules

Node dimensions are locked in `useAutoLayout.ts` `NODE_DIMS`. Do NOT change them — Dagre spacing depends on exact sizes.

| Node type | Width | Height |
|---|---|---|
| `rootNode` | 200px | 200px |
| `journeyNode` | 320px | 180px |
| `classificationNode` | 400px | 520px |

**Dagre graph settings (locked):**
- `rankdir: 'LR'` (left-to-right)
- `nodesep: 100`
- `ranksep: 280`

---

## 7. Mind Map — Edge Rules

| Edge type | Class / Style | Usage |
|---|---|---|
| `animatedEdge` | Gold (`#DFA81C`), dashed, animated dot | Root → Journey connections |
| `smoothstep` | Navy (`#002147`), solid, `strokeWidth: 3` | Journey → Classification card |

**AnimatedEdge color priority:**
1. `style.stroke` (inline override, highest)
2. `data.color` key into `COLOR_MAP` (`gold`, `blue`, `teal`, `navy`, `inactive`)
3. Gold fallback

---

## 8. Mind Map — Visual State Rules

| State | Node `data` | Visual |
|---|---|---|
| Default | `selected: false, dimmed: false` | `hover-in-shadow-lg` — raised, interactive |
| Selected (chosen journey) | `selected: true` | `active-pressed` — permanently pressed |
| Dimmed (unchosen journey) | `dimmed: true` | `opacity-30 grayscale pointer-events-none` |

**On landing page card click → `goToMap(type)`:**
- The unchosen journey node: `dimmed: true`, opacity 0.3, grayscale filter
- The chosen journey node: stays raised (`hover-in-shadow-lg`) until clicked inside the mind map
- `selected: true` is ONLY set by `expandJourney(parentId)` when the user clicks inside the mind map

---

## 9. React Flow Canvas

```tsx
fitViewOptions={{ padding: 0.4, maxZoom: 0.7 }}
minZoom={0.5}
maxZoom={1.5}
nodesDraggable={false}
nodesConnectable={false}
```
Background: `.react-flow__background` is forced to `#E0E5EC` (light) / `#2D3748` (dark) via `index.css` overrides. Do NOT remove these overrides.

---

## 10. What Is Forbidden

> [!CAUTION]
> The following are **banned** in all future development:
> - Using `bg-white` for any card or panel — use `bg-background-light`
> - Using Tailwind `shadow-*` utilities on interactive cards — use `.hover-in-shadow-lg`
> - Using `hover:scale-*` transforms — cards use shadow transitions, not scale
> - Introducing new fonts or importing from Google Fonts directly in components
> - Changing `NODE_DIMS` in `useAutoLayout.ts` without adjusting Dagre `nodesep`/`ranksep`
> - Adding new CSS color variables that aren't in the locked palette above