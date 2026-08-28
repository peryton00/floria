# Floria Global Motion & Interaction System Documentation

## Overview

The Floria Motion System provides a restrained, organic, and calm interaction experience across the platform. Motion explains interaction, creates visual hierarchy, and makes the interface feel alive without demanding unneeded attention.

---

## 1. Motion Principles

- **Soft & Responsive**: Interactions acknowledge user input immediately (100–180ms).
- **Organic & Botanical**: Ambient motion is reserved for very subtle natural floats (e.g. background leaves, 10s ease-in-out sway).
- **Calm & Premium**: Bouncing, elastic spring effects, 3D card rotations, screen shakes, and particle explosions are strictly prohibited.
- **Productivity-First**: Admin and Operations portals use minimal, high-speed transitions so management workflows remain ultra-fast.

---

## 2. Motion Levels & Hierarchy

| Motion Level              | Duration     | Easing                         | Example Use Cases                                                                        |
| ------------------------- | ------------ | ------------------------------ | ---------------------------------------------------------------------------------------- |
| **Level 1 — Micro**       | 100–180ms    | `cubic-bezier(0.2, 0, 0, 1)`   | Button press scale (`0.98`), icon transitions, hover color shifts, badge count pulse     |
| **Level 2 — Interaction** | 180–300ms    | `cubic-bezier(0, 0, 0.2, 1)`   | Mobile drawers, dropdown menus, modal dialogs, wishlist heart pop (`1.15`), toast popups |
| **Level 3 — Content**     | 300–500ms    | `cubic-bezier(0, 0, 0.2, 1)`   | Hero headline entrance (`FadeUp`), major section reveals (`AnimatedSection`)             |
| **Level 4 — Ambient**     | 6–15 seconds | `cubic-bezier(0.4, 0, 0.6, 1)` | Botanical decorative background element sway (`BotanicalAmbient`)                        |

---

## 3. Component API Reference

```tsx
import {
  motionTokens,
  FadeUp,
  AnimatedSection,
  BotanicalAmbient,
  WishlistHeartButton,
  CartBadgeAnimation,
} from "@/components/ui/motion";
```

### `<FadeUp delay={60} duration={300}>`

- Applies `opacity: 0 -> 1` and `translateY: 6px -> 0`.
- Stagger delays: `0ms`, `60ms`, `120ms`, `180ms`.

### `<AnimatedSection delay={60}>`

- Viewport reveal component using `IntersectionObserver` (`useInView`), triggering once when scrolled into view.

### `<WishlistHeartButton active={isWishlisted} onToggle={handleToggle} />`

- Micro-interaction heart button with tactile `1.15` scale pop and smooth color transition.

### `<CountBadge count={cartCount} />`

- Automatic count badge scale pulse (`1 -> 1.12 -> 1`) when counter value updates.

---

## 4. Accessibility & Reduced Motion

In compliance with accessibility standards, all motion components and keyframe animations respect `@media (prefers-reduced-motion: reduce)`:

- Continuous ambient animations are disabled.
- Transform and translation values are suppressed.
- Transitions default to instantaneous `100ms` linear opacity changes.
