# WCAG 2.2 AA Manual QA Checklist

Target: practical accessibility improvements oriented toward **WCAG 2.2 AA**. Automated fixes and linting reduce obvious issues, but **do not replace manual verification**.

> **TODO:** Run manual screen reader + keyboard QA before claiming WCAG 2.2 AA conformance.

> **TODO:** Validate generated PDFs with Acrobat Accessibility Checker or equivalent PDF/UA tooling before claiming accessible PDF compliance.

## Before you start

- Use latest frontend build (`cd frontend && npm run build && npm run preview`)
- Test in Chrome/Firefox with keyboard only (unplug mouse or avoid pointer)
- Test with at least one screen reader (VoiceOver on macOS, NVDA on Windows)

## Keyboard-only navigation

- [ ] Skip link appears on Tab and moves focus to `#main-content`
- [ ] All header links, mobile menu toggle, and menu items are reachable and activatable
- [ ] Cookie banner: Accept all, Reject optional, Manage preferences, and Privacy link work with keyboard
- [ ] Login / register forms: Tab order is logical; submit works with Enter
- [ ] Full intake flow (package → client → case → add-ons → agreement preview → booking → success) works without mouse
- [ ] FAQ accordion toggles with Enter/Space; focus remains visible
- [ ] Admin tables and action buttons are reachable
- [ ] No keyboard traps in cookie banner, mobile menu, or document pages

## Screen reader pass

- [ ] Page title updates per route (check browser tab / screen reader announcement)
- [ ] Landmarks announced: `main`, `nav`, `footer`, legal page structure
- [ ] Form fields have audible names (not placeholder-only)
- [ ] Login/register/intake validation errors announced (`role="alert"`)
- [ ] Cookie preference save confirmation announced (`role="status"`)
- [ ] FAQ expanded/collapsed state announced (`aria-expanded`)
- [ ] Package selection announced as radio group
- [ ] Icon-only controls have accessible names (mobile menu button)
- [ ] Document HTML views (agreement/onboarding) have meaningful region labels

## Zoom and reflow

- [ ] Zoom browser to **200%** — content readable without horizontal scrolling on key pages
- [ ] Test at **320px** viewport width — intake and auth forms remain usable
- [ ] Sticky header does not fully obscure focused elements

## Contrast

- [ ] Body text and button labels meet **4.5:1** against background (spot-check with browser devtools or contrast checker)
- [ ] Large headings meet **3:1** minimum
- [ ] Focus ring visible on buttons, links, inputs (amber outline)
- [ ] Error messages are not conveyed by color alone (text + border/background)

## Forms and errors

- [ ] Required fields have visible labels and programmatic names
- [ ] Booking step payment notes help text associated via `aria-describedby`
- [ ] Submit errors on booking/login/register are announced once, not on every keystroke
- [ ] File upload on site settings has keyboard-accessible control

## Modals, menus, and status

- [ ] Mobile navigation opens/closes; focus not trapped incorrectly
- [ ] Cookie banner does not block entire page unless intended
- [ ] Async loading states do not spam live regions

## PDF accessibility

- [ ] Download agreement/onboarding PDF and run **Acrobat Accessibility Checker** (or PAC/PDF/UA validator)
- [ ] Confirm document title and reading order in PDF viewer
- [ ] Compare with in-app HTML view as accessible alternative
- [ ] Note: Puppeteer-generated PDFs may not be fully tagged PDF/UA without additional remediation

## Automated checks (dev)

```bash
cd frontend
npm run lint    # includes eslint-plugin-jsx-a11y recommended rules
npm test
npm run build
```

## Sign-off

| Area              | Tester | Date | Pass/Fail | Notes |
|-------------------|--------|------|-----------|-------|
| Keyboard          |        |      |           |       |
| Screen reader     |        |      |           |       |
| Zoom/reflow       |        |      |           |       |
| Contrast          |        |      |           |       |
| Forms/errors      |        |      |           |       |
| PDFs              |        |      |           |       |
