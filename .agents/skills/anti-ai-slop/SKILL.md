---
name: anti-ai-slop
description: >-
  Enforces production UI design constraints that eliminate common AI-generated
  design patterns. Use this skill whenever building, modifying, or reviewing any
  web interface, frontend component, or UI code. Covers colour, depth, icons,
  typography, motion, scale, layout, placeholder content, and code craft rules.
---

# Anti-AI Slop Design Constraints

These rules are constraints, not suggestions. When a rule conflicts with what you were about to generate, the rule wins.

The goal is not "avoid a list of things." It is to make a deliberate choice in each place where the default would be decoration. If you remove a banned element and put nothing considered in its place, the result is worse, not better.

For the full, detailed ruleset, read [DESIGN_RULES.md](file:///d:/AI/forest-fire-project/DESIGN_RULES.md).

## Quick reference

### Colour
- ONE accent colour. Everything else is neutral greys (consistent temperature).
- Second colour only for semantic meaning (destructive, success, warning).
- **Banned:** blue→purple gradients, gradient text, per-section hues, default framework palettes.
- Accent under 10% of visible surface.

### Depth
- **Banned:** shadows on anything not genuinely floating (cards, inputs, static buttons).
- Shadows only on overlays (dropdowns, modals, toasts): tight, low-opacity.
- Separate with 1px border, background step, or whitespace.
- One border-radius value and one border colour everywhere.

### Icons and emoji
- **Banned:** sparkle icons (✦ ✧ 🪄), emoji as UI, icon containers (tinted squares/circles).
- One icon set, one stroke weight, monochrome, currentColor, text-sized.

### Typography and copy
- **Banned words:** unleash, supercharge, elevate, transform, revolutionise, empower, seamless, effortless, cutting-edge, game-changing, next-level, unlock, harness, robust, leverage, powerful, delve, paradigm, synergy.
- **Banned:** em dash (—) in UI copy. Use two sentences or a comma.
- Concrete nouns and real numbers. Sentence case. One type family. Left-align body text.

### Motion
- **Banned:** sliding arrows in buttons, hover glow/lift/scale, scroll fade-ins, parallax, typewriter effects.
- Hover: background or border colour change only, 120-160ms ease-out.
- Animate opacity and transform only. 120-200ms for feedback, up to 300ms for enter.
- Honour prefers-reduced-motion.

### Scale
- Hero: 40-56px desktop, 28-34px mobile. Body: 15-16px. Buttons: 36-44px tall.
- Section padding: 64-96px vertical desktop. Content max-width: 1100-1280px.
- Every spacing value is a multiple of 4. Nothing oversized.

### Layout
- **Banned:** eyebrow badges, default template order.
- Build only the sections the product needs. Not everything centred, not everything a card.

### Code craft
- Semantic HTML. Visible :focus-visible. Meaningful alt text. 4.5:1 contrast.
- Design tokens, component reuse, no dead code.

## Pre-delivery checklist

Before marking UI work as done, verify all 14 points in [DESIGN_RULES.md](file:///d:/AI/forest-fire-project/DESIGN_RULES.md#pre-delivery-checklist).
