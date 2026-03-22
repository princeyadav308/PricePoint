# PricePoint Brand Guidelines

This document outlines the core visual identity, design system, and styling rules for the PricePoint platform. 

## 1. Design System philosophy

PricePoint strictly uses a **Neumorphic Soft UI Design System**. 
The design is heavily inspired by physical, tactile interfaces where elements appear to be extruded from or pressed into the background using sophisticated shadow interactions.
- **Physicality:** Elements should feel like physical buttons pushing into a soft surface, rather than flat elements floating above it.
- **Softness:** Interfaces use large border radiuses, soft colors, and gentle gradients to avoid harsh edges.
- **Consistency:** The background color must perfectly match the base color of the components for the neumorphic shadow illusions to work.

---

## 2. Typography

We use modern, legible, and friendly sans-serif typefaces to contrast the soft UI elements.

- **Primary Font Family:** `"Plus Jakarta Sans"`
- **Fallback Fonts:** `Inter`, `sans-serif`

**Usage:**
- **Headings:** Bold to Extrabold (700-800 weight), using generous tracking (tracking-widest) for the brand logo text.
- **Body Text:** Regular to Medium (400-500 weight), using secondary text colors to reduce eye strain.

---

## 3. Color Palette

The color system is heavily reliant on a specific light and dark theme base so that the soft UI shadows blend correctly.

### Base Backgrounds (Critical for Neumorphism)
- **Light Mode Background:** `#E0E5EC` (Soft grayish-blue)
- **Dark Mode Background:** `#2D3748` (Deep slate)

### Brand Accents
Used sparingly for highlights, primary actions, and brand identity.
- **Primary Accent (Gold/Mustard):** `#DFA81C`
- **Primary Dark Contrast:** `#b88a14`
- **Secondary Accent (Teal/Mint):** `#5EC6B3`

### Typography Colors
- **Text Light Mode (Primary):** `#4A5568`
- **Text Dark Mode (Primary):** `#E2E8F0`

### Legacy / Expanded Palette (Internal Use)
- **Navy:** `#0A1628`
- **Blue:** `#0057B8`
- **Classic Gold:** `#B8860B`
- **Classic Teal:** `#00897B`

---

## 4. Visual Effects & Shadows

Neumorphism completely relies on these standardized shadow tokens to produce the 3D effect. Flat borders or harsh drop-shadows should **never** be used.

### The Hover-In Interaction (`hover-in-shadow`)
Our signature interactive effect. 
- **Default State:** The element has an **outer shadow** (extrusion). It appears to sit above the surface. 
- **Hover/Active State:** The outer shadow disappears, and an **inner shadow** fades in. The element appears strictly pressed into the surface.

### CSS Shadow Tokens
*Note: The dark mode uses distinct shadow opacities (black for the dark shadow, dim white for the light edge).*

**Light Mode:**
- `outer-shadow`: `3px 3px 3px #d0d0d0, -3px -3px 3px #f8f8f8`
- `inner-shadow`: `inset 3px 3px 3px #d0d0d0, inset -3px -3px 3px #f8f8f8`
- `outer-shadow-lg`: `6px 6px 10px #c8ccd4, -6px -6px 10px #ffffff`

**Dark Mode:**
- `outer-shadow`: `3px 3px 5px rgba(0, 0, 0, 0.4), -3px -3px 5px rgba(60, 60, 60, 0.25)`
- `inner-shadow`: `inset 3px 3px 5px rgba(0, 0, 0, 0.4), inset -3px -3px 5px rgba(60, 60, 60, 0.25)`
- `outer-shadow-lg`: `6px 6px 12px rgba(0, 0, 0, 0.5), -6px -6px 12px rgba(60, 60, 60, 0.2)`

---

## 5. Shape & Corner Radiuses

To maintain the "soft" aesthetic, sharp corners are avoided.
- **Base Elements (Inputs, small buttons):** `12px` border radius
- **Medium Cards (Icons, badges):** `20px` border radius (`rounded-xl`)
- **Large Cards (Journey Nodes, Panels):** `24px` border radius (`rounded-2xl`)
- **Perfect Circles:** `rounded-full` is used for checkboxes, radio-style sliders, and the central logo node.

---

## 6. Logo & Brand Mark

1. **Text Treatment:** **PRICEPOINT**
2. **Font Weight:** Extrabold (`font-extrabold`)
3. **Tracking:** Widest (`tracking-widest`)
4. **Coloring:** Standard text color (`text-gray-800` in light mode, `text-white` in dark mode). 
5. **Surroundings:** The logo is often embedded inside a double-ring neumorphic node (a large outer soft extrusion with an inner debossed ring) and usually includes an accent dash (e.g., `#DFA81C` Gold) to anchor it visually.

---

## 7. Component Best Practices

- **Avoid Flat Colors:** Do not use solid blocks of flat color (like a blue button) unless it's explicitly an accent switch or slider thumb.
- **Scrollbars:** Use the custom rounded scrollbars defined in the global CSS to match the interface.
- **Transitions:** All interactive features should have a smooth transition (`duration-300 ease`) so the neumorphic pressing effect feels organic.
- **Animations:** Subtle animations like `pulse-ring` and `slide-up` are used to draw attention gently without distracting from the UI.
