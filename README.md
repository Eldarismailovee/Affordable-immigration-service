# Immigration Law Firm Intake & Operations Platform

A conversion-focused immigration law firm website and internal operations platform for flat-fee family-petition services.

This project combines a public-facing marketing site, a guided intake funnel, internal admin workflows, document generation, manual-payment operations, media management, and deploy-ready infrastructure in one product.

## Who this is for

This service is designed for:

- immigration law firms offering flat-fee family petition packages
- solo attorneys and small firms that want a cleaner, more automated intake experience
- operations teams that need a lightweight internal dashboard for lead review, document generation, payment follow-up, and matter handoff

## What I built

This is not just a brochure site. It is a small legal-ops product with a full client journey:

- public landing page with pricing, services, FAQ, intake CTA, and legal pages
- guided multi-step intake flow
- backend pricing calculation and validation
- automated fee agreement preview
- automated onboarding packet generation
- PostgreSQL-backed persistence for leads, intakes, documents, bookings, payments, and site settings
- admin dashboard with lead list and lead detail views
- document generation for older leads from inside admin
- Docketwise sync stub with visible sync status
- site settings editor for logo, contact info, language mode, and marketing images
- image upload flow for admin-controlled branding/media
- PDF export for agreement and onboarding packet
- Dockerized deployment with frontend, backend, Postgres, and Nginx reverse proxy

## Product roles

### 1) Public visitor / prospective client
Can:

- browse services, pricing, FAQ, and legal pages
- start intake
- choose package type
- enter contact and case information
- review agreement preview
- request consultation
- provide payment preference for manual follow-up

### 2) Firm admin / operations
Can:

- review leads in admin dashboard
- open detailed lead records
- view agreement and onboarding assets
- generate missing documents for older leads
- update payment status
- trigger Docketwise sync stub
- manage site settings and marketing assets

### 3) Attorney
The product currently supports the attorney workflow indirectly through intake review, generated documents, package selection, and consultation booking. A dedicated attorney-only role or auth layer can be added next.

## Core features

### Client-facing
- one-page landing experience
- transparent package pricing
- multi-step intake process
- agreement preview
- onboarding packet preview
- contact and consultation request flow
- legal pages: Terms, Privacy, Disclaimer

### Back-office
- lead dashboard
- detailed lead record page
- payment status workflow
- Docketwise sync status
- document regeneration for old records
- site settings editor
- media upload for logo and marketing images

### Documents
- HTML agreement rendering
- HTML onboarding packet rendering
- PDF export for both documents

## Pricing model implemented

The current logic supports:

- attorney reviewed / prepared guidance: `$1,000–$1,500`
- attorney-filed package: `$2,000–$2,500`
- each additional I-130: `+$500`
- expedited processing: `+$500`
- filing fees are separate
- engagement is not formalized until the first consultation confirms document adequacy
- matter filing target: within two weeks of complete document receipt

## Architecture

```text
Public Site (React/Vite)
        |
        v
Guided Intake Flow
        |
        v
Express API
  - validation
  - pricing
  - agreement generation
  - onboarding generation
  - payment workflow
  - site settings
  - uploads
  - Docketwise sync stub
        |
        v
PostgreSQL
  - leads
  - intakes
  - agreements
  - onboarding_packets
  - bookings
  - payments
  - docketwise_sync
  - site_settings
        |
        v
Admin Dashboard
```

## Tech stack

### Frontend
- React
- Vite
- React Router
- Tailwind-style utility classes
- Context-based state for intake and site settings

### Backend
- Node.js
- Express
- PostgreSQL
- pg
- zod
- multer
- puppeteer-core

### Ops / Infra
- Docker
- Docker Compose
- Nginx reverse proxy

## Screenshots

### 1. Homepage full view
![Homepage full view](docs/screenshots/01-homepage-full.png)

### 2. Alternate homepage view
![Alternate homepage view](docs/screenshots/02-homepage-alt.png)

### 3. Pricing section
![Pricing section](docs/screenshots/03-pricing-section.png)

### 4. Services section
![Services section](docs/screenshots/04-services-section.png)

### 5. Combined layout concept
![Combined layout concept](docs/screenshots/05-combined-layout.png)

### 6. Section collection
![Section collection](docs/screenshots/06-section-collection.png)

### 7. Site composite
![Site composite](docs/screenshots/07-site-composite.png)

### 8. Site composite alt
![Site composite alt](docs/screenshots/08-site-composite-alt.png)

## Demo layer

### Demo walkthrough GIF
![Demo walkthrough](docs/demo/demo-walkthrough.gif)

### Seeded demo data
Use the included seed script to create demo leads, generated documents, payment states, and site settings for screenshots or walkthroughs.

```bash
cd backend
node scripts/seed-demo.js
```

See also: [`docs/DEMO.md`](docs/DEMO.md)

## Project structure

```text
backend/
  src/
    controllers/
    routes/
    services/
    db/
    schemas/
    middleware/
    utils/
  tests/
  scripts/

frontend/
  src/
    components/
    pages/
    context/
    hooks/
    data/
    services/
  public/

deploy/
docker-compose.yml
```

## Local development

### Prerequisites
- Node.js 20+
- PostgreSQL
- Chromium (for PDF generation)
- npm

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Health check
```bash
curl http://127.0.0.1:5000/api/health
```

## Docker setup

### Start everything
```bash
docker compose up --build
```

### Rebuild from scratch
```bash
docker compose down -v
docker compose up --build
```

### Health check
```bash
curl http://127.0.0.1/api/health
```

## Environment variables

### Root `.env`
```env
POSTGRES_DB=immigration_firm
POSTGRES_USER=immigration
POSTGRES_PASSWORD=change-me

PORT=5000
CLIENT_URL=http://127.0.0.1
BASE_URL=http://127.0.0.1
DATABASE_URL=postgresql://immigration:change-me@postgres:5432/immigration_firm
CHROMIUM_PATH=/usr/bin/chromium

VITE_API_URL=/api
```

### Backend
Key variables:
- `PORT`
- `CLIENT_URL`
- `BASE_URL`
- `DATABASE_URL`
- `CHROMIUM_PATH`

### Frontend
Key variable:
- `VITE_API_URL`

## Testing

This repo should expose real, visible engineering proof:

- pricing calculation tests
- intake validation tests
- CI running install + test + build
- changelog
- demo seed data

Recommended scripts:

```json
{
  "scripts": {
    "test": "node --test",
    "test:watch": "node --test --watch"
  }
}
```

See:
- [`backend/tests/pricing.test.js`](backend/tests/pricing.test.js)
- [`backend/tests/intake.validation.test.js`](backend/tests/intake.validation.test.js)
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## Deployment

The project includes Docker + Nginx deployment primitives.

Deployment path:
1. configure production `.env`
2. deploy to VPS
3. point DNS
4. enable HTTPS
5. verify uploads, PDFs, and health checks

## Limitations / next steps

- admin auth still needs to be added
- Docketwise is currently a stub flow, not a production API integration
- media uploads use local disk storage, not object storage
- legal text should be reviewed by counsel before public launch
- live demo hosting and polished video walkthrough should be added next

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md).

## License

Private / portfolio project unless otherwise specified.
