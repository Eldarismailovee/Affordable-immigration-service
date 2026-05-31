# Generated PDF accessibility notes

## What we generate

PDFs are rendered server-side from HTML via Puppeteer (`backend/src/services/pdf.service.js`):

- Fee agreements and onboarding packets (lead documents)
- DSAR export summaries (`backend/src/services/dsar-pdf-export.service.js`)

## Improvements in source HTML

The PDF wrapper template includes:

- `<html lang="en">`
- Document `<title>` from payload
- Semantic `<main>` wrapper
- Styled headings (`h1`–`h4`), paragraphs, lists, and tables
- High-contrast body text (`#111827` / `#1f2937` on white)
- DSAR summary uses semantic table with `<thead>` / `<tbody>`

In-app **accessible HTML alternatives**:

- `/agreement/:leadId` — fee agreement HTML view
- `/onboarding/:leadId` — onboarding packet HTML view
- DSAR exports also provide JSON as the canonical machine-readable export

## Known limitations

> Puppeteer-generated PDFs may **not** produce fully tagged PDF/UA output by default.

- Tag structure, reading order, and bookmarks may be incomplete in the PDF viewer.
- Screen reader support in PDF viewers varies.
- Images embedded in agreement HTML depend on upstream content having appropriate alt text.

Do **not** claim PDFs are fully accessible until validated.

## Validation TODO

Before any formal accessibility claim for PDFs:

1. Run **Adobe Acrobat Accessibility Checker**, PAC, or equivalent PDF/UA validator on sample outputs.
2. Verify document title and language in PDF properties.
3. Compare PDF reading order with the in-app HTML view.
4. Have privacy counsel review DSAR export presentation copy.

## Recommendations

- Prefer the in-app HTML views for screen-reader users when available.
- Provide JSON/machine-readable exports where applicable (DSAR).
- If PDF/UA is required for a jurisdiction, plan remediation or a dedicated tagged-PDF pipeline separately — not in scope for this YAGNI pass.
