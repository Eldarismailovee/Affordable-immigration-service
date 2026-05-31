# Legal Launch Checklist

Internal production blockers for public launch. Public legal pages use safe neutral copy until items below are confirmed.

**Last updated:** 2026-05-31

---

## Production blockers

- [ ] Confirm responsible attorney name.
- [ ] Confirm licensed jurisdiction(s).
- [ ] Confirm bar number if required for public disclosure.
- [ ] Confirm responsible attorney contact details (email, phone, office address if required).
- [ ] Confirm state-specific attorney advertising language and required labels/disclaimers.
- [ ] Confirm refund/cancellation process and exact refund windows.
- [ ] Confirm government/third-party fee non-refundable language matches engagement terms.
- [ ] Confirm production hosting vendor and region.
- [ ] Confirm production database host and region.
- [ ] Confirm email provider and DPA.
- [ ] Confirm payment provider (Stripe, LawPay, or other) and DPA/SCC/DPF status.
- [ ] Confirm Docketwise production integration timeline and DPA/SCC/DPF status.
- [ ] Confirm storage provider and region (local volume vs. object storage).
- [ ] Confirm all subprocessors/vendors in [vendor-subprocessor-matrix.md](./vendor-subprocessor-matrix.md).
- [ ] Confirm SCC/DPF status using vendor contracts and the [official DPF list](https://www.dataprivacyframework.gov/) — do not mark DPF certified without verification.
- [ ] Responsible attorney final review of Privacy Policy, Terms, Disclaimer, Availability, cookie consent, and subprocessor disclosures.

---

## Vendor confirmation (internal)

Track in [vendor-subprocessor-matrix.md](./vendor-subprocessor-matrix.md):

- TODO confirm production hosting provider
- TODO confirm production database region
- TODO confirm email provider DPA
- TODO confirm Docketwise DPA/SCC/DPF
- TODO confirm Stripe/LawPay/payment provider status
- TODO confirm storage provider and region

Public subprocessor matrix rows may show **Pending confirmation before launch** until verified.

---

## Attorney advertising (internal)

- BLOCKER: Confirm whether responsible attorney's state bar requires specific advertising labels, office address, responsible attorney name, prior results disclaimer, or other notices.
- Do not invent state-specific wording until jurisdiction is confirmed and rules are reviewed manually.

---

## Cookie consent (internal)

- [ ] Have cookie banner text, consent categories, and geo/legal assumptions reviewed by privacy counsel before production launch.

---

## After verification

When attorney details are confirmed:

1. Set `confirmedBeforeProduction: true` in `frontend/src/constants/responsibleAttorney.js` and `backend/src/constants/responsibleAttorney.js`.
2. Populate verified name, jurisdiction, bar number, and contact fields.
3. Add rows to `attorneyLicenses` / `licensedJurisdictions` in frontend and backend availability constants.
4. Update public legal pages if state bar rules require additional disclosures.
