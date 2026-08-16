/**
 * Floria Centralized Motion System Tokens & Timing Configuration
 * Bounded by Floria Motion Principles:
 * Level 1 — Micro (100–180ms)
 * Level 2 — Interaction (180–300ms)
 * Level 3 — Content (300–500ms)
 * Level 4 — Ambient (6–15s)
 */

export const motionTokens = {
  duration: {
    instant: 100, // Level 1
    fast: 150,    // Level 1
    normal: 200,  // Level 2
    medium: 280,  // Level 2
    content: 350, // Level 3
    slow: 450,    // Level 3
    ambient: 10000, // Level 4 (10 seconds)
  },

  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",   // ease-out
    enter: "cubic-bezier(0, 0, 0.2, 1)",      // decelerate
    exit: "cubic-bezier(0.4, 0, 1, 1)",       // accelerate
    ambient: "cubic-bezier(0.4, 0, 0.6, 1)",  // ease-in-out
  },

  stagger: {
    fast: 60,
    normal: 120,
    content: 180,
  },
} as const;

export type MotionDurationKey = keyof typeof motionTokens.duration;
