# Contrast test notes

Target ratios (WCAG 2.2 AA):

| Content                         | Minimum ratio |
|---------------------------------|---------------|
| Normal text (&lt; 18pt / 14pt bold) | 4.5:1         |
| Large text (≥ 18pt / 14pt bold)     | 3:1           |
| UI components / focus indicators  | 3:1           |

## How to test

1. Use browser DevTools → Accessibility → Contrast (or a checker such as WebAIM Contrast Checker).
2. Spot-check on `#040816` page background and `bg-white/5` card surfaces.
3. Test at 200% zoom — text must remain readable.

## Areas audited (May 2026)

| Area                    | Class / element              | Action taken |
|-------------------------|------------------------------|--------------|
| Body copy               | `text-slate-300` on dark bg  | Default body; meets 4.5:1 |
| Muted helper text       | `text-slate-400`             | Used for secondary only; bumped critical copy to `text-slate-300` where needed |
| Footer copyright        | `text-slate-400`             | Secondary; acceptable on `#040816` (~7:1) |
| Unsubscribe disclaimer  | `text-slate-500`             | Changed to `text-slate-400` |
| Error messages          | `text-red-200` + border/bg   | Not color-only |
| Focus ring              | `#fbbf24` outline            | High contrast on dark UI |
| Placeholder text        | browser default              | Never sole label |
| Secondary buttons       | border + text                | Border provides non-color cue |
| Admin table dates       | `text-slate-400`             | Supplementary data only |

## Likely low-contrast areas to re-check manually

- `text-amber-300` links on `bg-amber-400/5` notice boxes
- Disabled buttons (`opacity-60` / `opacity-70`) — ensure label still readable
- Form borders `border-white/10` — non-text contrast for boundaries
- Legal page long-form `text-slate-300` on `bg-white/5`

## Fixes applied in code pass

- Global `:focus-visible` amber outline (3px, offset 3px) in `frontend/src/index.css`.
- Critical form errors use text + `role="alert"` + border, not color alone.
- Unsubscribe page secondary text lightened from `text-slate-500` to `text-slate-400`.

## TODO

- [ ] Full contrast audit with automated tool on production build.
- [ ] Re-check after any theme/token changes.
