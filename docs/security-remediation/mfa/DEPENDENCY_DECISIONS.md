# MFA Dependency Decisions

| Package | Version | Purpose | Why chosen | Alternatives | Audit |
| ------- | ------: | ------- | ---------- | ------------ | ----- |
| otplib | 13.3.0 | RFC 6238 TOTP generate/verify/URI | Actively maintained, ESM, audited crypto plugins, Node 26 compatible | speakeasy (less active), manual RFC impl (rejected) | 7 moderate in tree via dev tooling; otplib itself MIT |
| qrcode | 1.5.4 | QR PNG data URL for enrollment | Minimal, widely used, no native deps | qr-image, manual SVG | MIT, no known critical issues |

Encryption uses Node.js built-in `crypto` AES-256-GCM (`mfaEncryption.js`) — no extra dependency.

Recovery codes hashed with Node `scrypt` — same pattern as password hashing.
