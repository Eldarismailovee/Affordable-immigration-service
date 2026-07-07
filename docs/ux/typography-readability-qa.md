# Typography / Readability QA

Manual checklist for typography and trust-focused readability on the public site.

## Font usage

- [ ] Body text uses sans-serif (Inter), not monospace.
- [ ] Long paragraphs are not monospace.
- [ ] Legal pages are readable at 16px+ with comfortable line-height.
- [ ] Pricing descriptions and caveats are readable sans-serif.
- [ ] Monospace is limited to short labels, badges, step markers, and price numbers.

## Readability

- [ ] Body text is at least 16px (`text-base` / `1rem`).
- [ ] Paragraph line-height is comfortable (`leading-7` / ~1.75).
- [ ] Long text max-width is around 65–75ch (`max-w-prose`, `max-w-3xl`, `readable-prose`).
- [ ] No all-caps long paragraphs.
- [ ] No wide tracking on paragraph body copy.

## Mobile

- [ ] 375px readable (hero, pricing, FAQ, legal intro).
- [ ] 390px readable.
- [ ] 430px readable.
- [ ] 768px readable.

## Trust

- [ ] Typography feels professional and human, not like a developer tool.
- [ ] Legal disclaimers are not hidden or tiny.
- [ ] CTA and pricing text are easy to scan.
- [ ] Hero subheadline and notices use sans-serif body sizing.

## Key pages to spot-check

- [ ] Homepage (hero, who-this-is-for, pricing, FAQ)
- [ ] `/case-review`
- [ ] `/terms`, `/privacy`, `/disclaimer`, `/accessibility`
- [ ] Intake flow (`/intake/*`)
- [ ] Cookie banner and `/cookie-preferences`

## Allowed monospace accents

Eyebrows, step labels (`Step 01`), package badges, price numbers, small metadata labels.

## Not allowed monospace

Paragraphs, FAQ answers, legal disclaimers, pricing descriptions, form consent text, hero subheadline.
