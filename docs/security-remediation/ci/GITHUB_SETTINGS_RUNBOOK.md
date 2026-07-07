# GitHub Settings Runbook (Manual)

Apply in repository Settings after merging CI changes. Not verified remotely as of 2026-07-06.

## Branch / ruleset (`main`)

- [ ] Require pull request before merging
- [ ] Require approvals (≥1)
- [ ] Dismiss stale approvals on new commits
- [ ] Require CODEOWNERS review (after replacing `@org/security-team` in CODEOWNERS)
- [ ] Require conversation resolution
- [ ] Require branch up to date (or enable merge queue)
- [ ] Block force pushes
- [ ] Block branch deletion

## Required status checks

Minimum:
- `ci-required`
- `Dependency Review` (PR workflows)
- `CodeQL`

Do not require every internal job name unless willing to update rules on renames.

## Actions settings

- [ ] Default `GITHUB_TOKEN`: read-only
- [ ] Allow only selected/verified actions (optional hardening)
- [ ] Require fork PR approval before workflows run
- [ ] Disable "Actions can create/approve PRs" unless needed

## Security settings

- [ ] Dependency graph enabled
- [ ] Dependabot alerts + security updates
- [ ] Secret scanning + push protection (if plan supports)
- [ ] Code scanning (CodeQL) + merge protection for chosen severities
- [ ] Private vulnerability reporting (if applicable)

## Merge queue (optional)

If enabled, ensure `ci.yml` includes:

```yaml
on:
  merge_group:
```

## Verification commands (read-only)

```bash
gh repo view
gh api repos/:owner/:repo/branches/main/protection
gh ruleset list
gh run list --workflow=ci.yml --limit 5
```
