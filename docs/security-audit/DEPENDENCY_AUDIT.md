# Dependency and Supply-Chain Audit

Audit date: 2026-07-06. Sources: exact lockfiles, installed `node_modules`, npm advisory endpoint, GitHub reviewed advisories, and the official CISA `cisagov/kev-data` mirror (catalog `2026.07.01`, 1631 entries).

## Ecosystems

| Project | Lock | Installed packages | npm audit all | production-only |
|---|---|---:|---:|---:|
| root | npm lockfile v3 | 26 | 0 | 0 |
| backend | npm lockfile v3 | 234 | 8 groups: 2 H, 6 M | 7 groups: 2 H, 5 M |
| frontend | npm lockfile v3 | 386 | 7 groups: 4 H, 2 M, 1 L | 4 groups: 3 H, 1 M |

All lock entries had integrity hashes; no Git or plain-HTTP dependencies were found. `fsevents` is the only `hasInstallScript` entry and is an optional platform package. Duplicate package names exist but do not by themselves establish a vulnerability.

## Manual reachability

| Package / advisory | Installed | Fixed | Scope | Reachability | Status |
|---|---:|---:|---|---|---|
| `multer` CVE-2026-5079 / GHSA-72gw-mp4g-v24j | 2.1.1 | 2.2.0 | backend direct prod | `upload.single()` parses attacker multipart; admin role required, but chainable with AUTH-001 | HIGH_CONFIDENCE / DEP-001 |
| `multer` CVE-2026-5038 / GHSA-3p4h-7m6x-2hcm | 2.1.1 | 2.2.0 | backend direct prod | diskStorage used; aborted upload cleanup path applies | HIGH_CONFIDENCE / DEP-001 |
| `ws` CVE-2026-48779 / GHSA-96hv-2xvq-fx4p | 8.20.0 | 8.21.0 | Puppeteer transitive | API does not accept WebSockets; client connects to local Chromium endpoint | NOT_REACHABLE from HTTP input |
| `ws` GHSA-58qx-3vcg-4xpx | 8.20.0 | 8.20.1 | Puppeteer transitive | requires control of WebSocket peer/preconditions absent | NOT_REACHABLE |
| `react-router` CVE-2026-42211 | 7.13.2 | 7.14.2 | frontend direct prod label | SPA uses `<BrowserRouter>`; no server deserialization/turbo-stream request handler | NOT_REACHABLE |
| `react-router` CVE-2026-42342 | 7.13.2 | 7.15.0 | frontend | no React Router server `__manifest` endpoint | NOT_REACHABLE |
| `react-router` CVE-2026-34077 | 7.13.2 | 7.14.0 | frontend | no single-fetch server runtime | NOT_REACHABLE |
| React Router open redirect / CSRF advisories | 7.13.2 | 7.14.1 / 7.15.1 | frontend | no affected document request/data-router server flow found | NOT_REACHABLE |
| `vite` CVE-2026-53571 | 8.0.10 | 8.0.16 | dev/build | Windows dev-server path issue; audited environment/container is Linux; Vite not in runtime image | NOT_REACHABLE |
| `qs` GHSA-q8mj-m7cp-5q26 | 6.14.2 | registry fix available | Express transitive | vulnerable `qs.stringify(... encodeValuesOnly)` not called | NOT_REACHABLE |
| `ip-address` GHSA-v2v4-37r5-5v8g | 10.1.0 | registry fix available | rate-limit/Puppeteer transitive | HTML-emitting Address6 helpers not called | NOT_REACHABLE |
| `brace-expansion` GHSA-jxxr-4gwj-5jf2 | 5.0.5 | 5.0.6 | nodemon dev-only | no untrusted glob range; absent production install | NOT_REACHABLE |
| `@babel/core`, `js-yaml` advisories | 7.29.0 / 4.1.1 | registry fix available | lint/build only | no untrusted source map/YAML in production runtime | NOT_REACHABLE |

GitHub advisories: [Multer nesting](https://github.com/advisories/GHSA-72gw-mp4g-v24j), [Multer aborted uploads](https://github.com/advisories/GHSA-3p4h-7m6x-2hcm), [ws memory exhaustion](https://github.com/advisories/GHSA-96hv-2xvq-fx4p), [React Router RCE](https://github.com/advisories/GHSA-49rj-9fvp-4h2h). CISA source: [official mirror](https://github.com/cisagov/kev-data).

No listed npm CVE matched CISA KEV catalog 2026.07.01. The Dockerfile installs an unpinned Debian Chromium package; its concrete version and exposure to Chromium KEV CVE-2026-11645 remain `NOT_VERIFIED` because the image/daemon could not be inspected.

## SBOM

`syft`, CycloneDX npm tooling and equivalent local generators were unavailable. A single truthful multi-project SBOM could not be generated without installing additional tooling, so `sbom.cdx.json` was intentionally not created (`NOT_EXECUTED_TOOL_UNAVAILABLE`). Do not interpret the absence of SBOM as absence of components.

## Supply-chain controls

- Positive: npm lock v3 integrity, `npm ci`, CodeQL, blocking npm audit at High, read-only workflow permissions.
- Gaps: GitHub Actions referenced by mutable major/version tags, images not digest-pinned, no SBOM/provenance/signing, no container/secret scan, DAST warn-only, floating `apt-get` package resolution.
