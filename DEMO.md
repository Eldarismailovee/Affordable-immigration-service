# Demo Guide

This file describes how to show the project like a product, not just a repo.

## Demo goals

Show these flows:

1. Landing page and pricing
2. Guided intake flow
3. Agreement preview
4. Success state
5. Admin dashboard
6. Lead detail page
7. PDF export
8. Site settings + image upload

## Recommended demo script

### Flow 1 — Public experience
- open `/`
- scroll to pricing, services, FAQ
- click `Start Now`
- complete the intake
- show agreement preview
- submit
- open onboarding packet

### Flow 2 — Admin workflow
- open `/admin`
- open a lead
- show agreement
- show onboarding packet
- update payment status
- sync Docketwise
- update site settings

### Flow 3 — Content operations
- open `/admin/settings`
- upload a new logo
- update phone/email
- save settings
- refresh homepage and confirm branding changes

## Seed data
Run:

```bash
cd backend
node scripts/seed-demo.js
```

This creates:
- demo site settings
- multiple demo leads
- mixed payment states
- generated agreement records
- generated onboarding packet records

## Asset checklist
For a stronger portfolio presentation, add:

- a hosted demo URL
- a 30–60 second GIF or Loom video
- screenshots of admin flows
- screenshots of PDF export
