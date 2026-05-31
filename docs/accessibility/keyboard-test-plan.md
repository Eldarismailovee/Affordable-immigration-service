# Keyboard-only test plan

Target: WCAG 2.2 AA-oriented keyboard usability. Run against a fresh frontend build (`npm run build && npm run preview`) or dev server.

## Setup

- Use Chrome or Firefox.
- Do not use the mouse or trackpad.
- Start each flow from the home page unless noted.

## Flows

### Home page navigation

1. Tab — skip link appears and moves focus to `#main-content`.
2. Tab through header links, Sign in, Start intake.
3. On mobile viewport: open/close mobile menu with Enter/Space; Escape closes menu.
4. Tab through footer quick links and legal links (including Accessibility).

### Login / register / logout

1. `/login` — Tab through email, password, submit; submit with Enter.
2. Confirm focus ring visible on all controls.
3. Trigger an error (empty submit or bad credentials) — error announced once.
4. `/register` — same checks; password help text reachable.
5. Sign out from header — keyboard only.

### Contact / lead form

1. Home page intake section or `/start` — reach CTA and follow into intake if applicable.

### Intake / onboarding form

Full path: package → client → case → add-ons → agreement preview → booking → success.

- Package step: Tab to each package option; Space/Enter selects; Continue works.
- Client step: all fields labeled; Tab order left-to-right, top-to-bottom.
- Case step: case type and notes reachable.
- Add-ons: number input and expedited checkbox.
- Agreement preview: continue/back.
- Booking: all selects, inputs, checkboxes, submit; validation error announced.
- Success page: links reachable.

### Document upload

1. Admin `/admin/settings` — image URL fields and Upload image control reachable by keyboard.

### Cookie banner and preferences

1. Clear site data; reload home — banner appears.
2. Tab: Accept all, Reject optional, Manage preferences, Privacy link.
3. Manage preferences — toggle analytics/marketing; Save; confirm status message.
4. `/cookie-preferences` — same toggles; Save and Withdraw optional.

### Privacy / DSAR request

1. `/privacy` — scroll to privacy request form (Section 14).
2. Tab through request type, email (if guest), message, submit.
3. Submit error/success announced.

### Payment / hosted checkout link

1. Admin lead detail — hosted payment URL field labeled and editable by keyboard.

### Admin lead detail

1. `/admin` — filter select, table rows, lead links.
2. Lead detail — status buttons, conflict check fields, attorney review, file actions.

### Attorney conflict check / review

1. On lead detail — fill conflict check fields; submit.
2. Review notes field has visible label (not placeholder-only).
3. Responsible attorney checkbox reachable.

### Legal pages

1. `/terms`, `/privacy`, `/disclaimer`, `/availability`, `/accessibility` — heading structure; back home link.

### Email preferences / unsubscribe

1. `/email-preferences` (signed in) — checkboxes and save.
2. `/unsubscribe?token=…` — status message readable.

## Keyboard criteria

- Tab reaches every interactive element.
- Shift+Tab reverses logically.
- Enter/Space activates buttons and toggles.
- Escape closes mobile navigation menu.
- No keyboard trap in cookie banner or mobile menu.
- Focus is visible at all times.
- Focus returns sensibly after menu close (manual check).

## Sign-off

| Flow              | Tester | Date | Pass/Fail | Notes |
|-------------------|--------|------|-----------|-------|
| Home / nav        |        |      |           |       |
| Auth              |        |      |           |       |
| Intake            |        |      |           |       |
| Cookie / privacy  |        |      |           |       |
| Admin / attorney  |        |      |           |       |
| Legal / a11y page |        |      |           |       |
