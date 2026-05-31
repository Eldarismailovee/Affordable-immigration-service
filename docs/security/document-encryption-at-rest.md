# Document encryption at rest

## Scope

This application stores data in two primary locations:

| Data | Storage | Sensitivity | Encryption approach |
|------|---------|-------------|---------------------|
| Agreements, onboarding packets, intake records | PostgreSQL (`html_content`, case fields) | High | **Provider-managed** database encryption at rest (TDE / disk encryption) |
| DSAR export PDF summaries | Local disk (`backend/var/dsar-exports/`) | High | **Application-level** AES-256-GCM when `DOCUMENT_ENCRYPTION_KEY_BASE64` is set |
| Admin marketing/logo uploads | Local disk (`backend/uploads/`) | Low (public images) | Filesystem/volume encryption; images served publicly without app-level encryption |

## PostgreSQL (legal documents in database)

Agreements and onboarding packets are stored as HTML in PostgreSQL, not on the filesystem.

**Production requirement:**

- TODO: Confirm production database provider (e.g. RDS, Cloud SQL, managed Postgres).
- Enable provider-managed encryption at rest (default on most managed services).
- Use TLS for connections (`DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true`).
- Restrict network access to the database subnet / private network.

Do **not** add custom column-level encryption for HTML content unless counsel and engineering agree on key management and search/backup implications.

## Local disk — sensitive exports (DSAR PDFs)

When `DOCUMENT_ENCRYPTION_KEY_BASE64` is configured, DSAR export PDFs are written as AES-256-GCM encrypted files (`*.pdf.enc`):

- Random 96-bit IV per file
- Auth tag stored in the file prefix
- Key loaded from environment only (never stored in DB or logs)
- Decryption on authenticated download only

### Configure encryption key

Generate a 32-byte key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set in production secret manager / environment:

```txt
DOCUMENT_ENCRYPTION_KEY_BASE64=<output>
```

Store the key in your platform secret manager. Do not commit it to git.

### Production recommendation

For production, prefer migrating sensitive file storage to object storage (S3, R2, GCS, Azure Blob) with:

- Server-side encryption (SSE-S3, SSE-KMS, or provider default)
- Private bucket (no public ACL)
- Signed URLs or authenticated proxy download
- No public document URLs

Application-level env key encryption is acceptable for early production on a single host; plan migration to cloud KMS / secret manager for key rotation.

## Local disk — public image uploads

`backend/uploads/` stores admin branding images (logo, marketing). These are validated (MIME + magic bytes), optionally virus-scanned, and served via controlled API routes.

- Volume/filesystem encryption at the hosting provider is recommended.
- App-level encryption is **not** applied because files are intentionally public.
- TODO: Confirm production storage location and snapshot/versioning policy.

## Encrypting existing plaintext DSAR exports

If encryption was enabled after plaintext files already exist:

1. **Back up** `backend/var/dsar-exports/` before any migration.
2. Run the migration script (dry-run first):

```bash
cd backend
node src/scripts/encrypt-existing-documents.js --dry-run
node src/scripts/encrypt-existing-documents.js
```

3. Verify DSAR PDF download for a test request.
4. Remove plaintext `.pdf` files only after verification.

Do not silently migrate without backup.

## Implementation files

- `backend/src/utils/documentEncryption.js` — AES-256-GCM helpers
- `backend/src/services/document-storage.service.js` — encrypted read/write
- `backend/src/services/dsar-pdf-export.service.js` — DSAR PDF persistence

## Key rotation (future)

Current design uses a single env key (`key_id: v1`). For rotation:

1. Deploy new key as `DOCUMENT_ENCRYPTION_KEY_BASE64` (document dual-key support before implementing).
2. Re-encrypt existing `.enc` files with the new key via maintenance script.
3. Retire old key after verification.

TODO: Implement dual-key decryption before production key rotation.
