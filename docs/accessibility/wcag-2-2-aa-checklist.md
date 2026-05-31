# WCAG 2.2 AA Checklist

## Status

- Target: WCAG 2.2 AA
- Date: May 31, 2026
- Owner: Engineering / product
- Status: In progress
- Note: Manual QA required before conformance claim.

> **TODO:** Run manual keyboard, screen reader, contrast, and PDF accessibility QA before making any formal WCAG 2.2 AA conformance claim.

## Forms and labels

- [ ] Every input has accessible name.
- [ ] Visible labels exist where practical.
- [ ] Placeholder is not the only label.
- [ ] Required fields are marked visually and programmatically.
- [ ] Help/error text connected with `aria-describedby`.
- [ ] Errors use `aria-invalid` and are announced.

## Keyboard

- [ ] All interactive controls reachable by Tab.
- [ ] Enter/Space activates buttons.
- [ ] No keyboard traps.
- [ ] Modals trap focus and restore focus.
- [ ] Skip link works.
- [ ] Focus order follows visual/logical order.

## Focus

- [ ] Visible focus indicator exists.
- [ ] Focus indicator has adequate contrast.
- [ ] Focus is not hidden under sticky UI.
- [ ] Focus appearance meets WCAG 2.2 target where practical.

## Contrast

- [ ] Normal text at least 4.5:1.
- [ ] Large text at least 3:1.
- [ ] UI component boundaries/focus indicators at least 3:1.
- [ ] Errors are not color-only.

## Screen reader

- [ ] Page has one main landmark.
- [ ] Headings are meaningful and ordered.
- [ ] Icon-only buttons have accessible names.
- [ ] Status messages use `aria-live` / `role` where appropriate.
- [ ] Form error summary links to fields.

## PDFs

- [ ] Generated PDF source HTML has semantic headings.
- [ ] PDF has title/language where possible.
- [ ] Images have alt text or are decorative.
- [ ] Tables are semantic where possible.
- [ ] Accessible HTML alternative exists or is planned.
- [ ] PDF/UA validation TODO documented.

## Manual QA

- [ ] Keyboard-only walkthrough.
- [ ] NVDA/VoiceOver smoke test.
- [ ] 200% zoom/reflow.
- [ ] Contrast audit.
- [ ] Generated PDF accessibility check.

## Automated checks (dev)

```bash
cd frontend
npm run lint    # eslint-plugin-jsx-a11y recommended rules
npm test
npm run build
```

See also: [keyboard-test-plan.md](./keyboard-test-plan.md), [contrast-test-notes.md](./contrast-test-notes.md), [generated-pdf-accessibility-notes.md](./generated-pdf-accessibility-notes.md).

## Sign-off

| Area          | Tester | Date | Pass/Fail | Notes |
|---------------|--------|------|-----------|-------|
| Keyboard      |        |      |           |       |
| Screen reader |        |      |           |       |
| Zoom/reflow   |        |      |           |       |
| Contrast      |        |      |           |       |
| Forms/errors  |        |      |           |       |
| PDFs          |        |      |           |       |
