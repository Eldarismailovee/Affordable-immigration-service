# DAST (OWASP ZAP baseline)

## CI workflow

Pull requests and weekly schedules run `.github/workflows/dast-baseline.yml`:

1. Build backend and frontend Docker images
2. Start full stack via `docker compose up -d`
3. Wait for `GET /api/health` through nginx
4. Run OWASP ZAP baseline scan against `http://127.0.0.1`
5. Upload report artifact

The workflow is **warn-only** (`continue-on-error: true`) until the baseline is tuned. Review artifacts before making the job blocking.

## Manual staging scan

If CI cannot mirror production (TLS, WAF, external IdP):

```bash
# From repo root with stack running
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t https://staging.example.com \
  -a \
  -r zap-report.html
```

TODO: Replace staging URL when environment is available.

## Tuning

After the first CI report:

1. Fix confirmed false positives in app config or ZAP rules
2. Address high/medium findings with engineering owners
3. Consider `zap-baseline` `-c` config file for ignored paths (health-only endpoints, etc.)
4. When noise is low, remove `continue-on-error` from the workflow

## Limitations

- CI scan targets HTTP on localhost without TLS; HSTS and some cookie flags differ from production HTTPS.
- Authenticated admin flows are not fully exercised in baseline mode.
- For deep coverage, run authenticated scan against staging separately (out of scope for default CI).

## Related documents

- [security-hardening-checklist.md](./security-hardening-checklist.md)
