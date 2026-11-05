# Animation Overhaul — "The System Awakens"

A record of the animation work shipped in this change set, plus what is planned next.

## Dependencies added

| Package | Purpose |
| --- | --- |
| `motion` (v14) | Springs, layout animations, `AnimatePresence`, in-view triggers, number animation |
| `canvas-confetti` | Particle bursts for level-ups, rank-ups, and quest claims |
| `@types/canvas-confetti` | TypeScript types (dev) |

All motion is wrapped in `MotionConfig reducedMotion="user"`, so the OS
"reduce motion" preference disables the animations automatically. The existing
CSS `prefers-reduced-motion` block still covers the CSS keyframes.

## Completed

### Foundations
- `src/components/motion/motion-provider.tsx` — global `MotionConfig` (reduced-motion aware).
- `src/components/motion/reveal.tsx` — `Reveal`, `StaggerGroup`, `StaggerItem` scroll-reveal primitives.
- `src/components/motion/count-up.tsx` — game-HUD number roll-ups; supports `number`, `minutes`, `hours`, `decimal` formats. SSR-safe (renders the final value first, animates after hydration).
- `src/components/motion/animated-bar.tsx` — spring-filled progress bars used across stats, quests, achievements, subjects.
- `src/components/motion/goal-ring.tsx` — animated SVG daily-goal ring with count-up minutes.
- `src/lib/confetti.ts` — themed reward burst (blue/gold) and a smaller mint quest burst; no-ops under reduced motion.

### App shell & routing
- `src/app/template.tsx` — every route entrance fades/rises out of a blur, plus a top scanline sweep.
- `src/app/loading.tsx` + `src/components/system-loader.tsx` — animated boot screen: counter-rotating rings, pulsing sigil, scanning progress beam.
- `src/app/layout.tsx` — wraps the app in `MotionProvider`.
- `src/components/navigation.tsx` — desktop + mobile active-tab indicators now slide between items using `layoutId` springs.

### Big moments
- `src/components/reward-overlay.tsx` — fully cinematic sequence:
  - full-screen flash and two expanding shockwave rings
  - spinning light rays (faster on rank-up)
  - "LEVEL UP" / "RANK UP" title animates letter by letter out of a blur
  - XP and level count up
  - achievements cascade in
  - gold confetti burst on rank-up, blue burst otherwise
  - spring exit animation via `AnimatePresence`
- `src/components/focus-timer.tsx`
  - breathing aura behind the ring while running/breaking (mint while on break)
  - phase-change pulse ring, start-of-session shockwave burst
  - digits pulse red during the final 10 seconds
  - session-review dialog enters with a spring and exits through `AnimatePresence`
- `src/components/quest-card.tsx`
  - card hover lift and entrance blur-rise
  - claim button pulses with a green glow when the quest is complete
  - "Cleared" stamp slams in with a spring (scale 2.4 → 1, rotating)
  - confetti burst on claim
- `src/components/system-toast.tsx` — spring enter/exit (replaces the CSS-only slide).

### Dashboard / HUD
- `src/components/xp-bar.tsx` — spring width fill.
- `src/components/status-window.tsx` — count-ups for level, XP, streak, today, total study, quests cleared; metric cards lift on hover.
- `src/app/page.tsx` — animated goal ring + spring progress bar + percent count-up.
- `src/components/stats-grid.tsx` — spring attribute bars.
- `src/components/heatmap.tsx` — 12-week tiles cascade in with staggered delays and pop on hover.
- `src/components/activity-chart.tsx` — seven-day bars grow from the baseline; minute totals count up.
- `src/components/xp-trend.tsx` — 14-day line draws itself, points fade in, area fades in.
- `src/components/subject-breakdown.tsx` — rows rise in stagger; subject bars spring to width.
- `src/components/rank-ladder.tsx` — rank steps reveal in sequence.
- `src/components/achievement-card.tsx` — hover lift plus spring progress bars.

### Sessions & settings
- `src/components/session-row.tsx` — now a client motion row with staggered entry, exit animation, and hover slide.
- `src/components/session-history.tsx` — `AnimatePresence` list so deleted/edited records animate out; filter results animate in.
- `src/components/session-edit-dialog.tsx` — spring dialog enter/exit.
- `src/components/onboarding-gate.tsx` — spring awakening panel and rotating rays.

### CSS polish (`src/app/globals.css`)
- button shine sweep on hover and press-down feedback
- `reward-flash`, `reward-shockwave`, `reward-shockwave--late`
- `heat-in`, `bar-rise`, `reveal-up`, `draw-line` keyframes
- `session-row` hover, `achievement-card` hover
- `.xp-line`/`.xp-area`/`.xp-point` hook classes for the trend chart
- reduced-motion guards for flash/shockwave

## Verification done
- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm test` — 79 tests passing
- `npm run build` — production build succeeds
- Browser walkthrough (status, focus, sessions, quests, progress) — no console errors, no hydration warnings

## TODO / future work

- [ ] Add count-ups to the remaining static metrics on the progress page (`Metric`) and settings page (`CoreInfo`).
- [ ] Animate the streak-freeze panel (flame flicker, shield charge) and the streak ribbon.
- [ ] Add exit transitions for route changes (Next.js View Transitions API or an `AnimatePresence` router wrapper); currently entrances only.
- [ ] Optional subtle parallax on the decorative orbits in the status window.
- [ ] Evaluate `LazyMotion` + `domAnimation` to trim the motion bundle once the animation set is final.
- [ ] Add a dedicated skeleton shimmer to replace the generic `animate-pulse` blocks.
- [ ] Consider a "critical time" heartbeat sound cue synced with the timer pulse (opt-in).
- [ ] Add visual regression screenshots for the reward overlay states (level-up, rank-up, achievement).
