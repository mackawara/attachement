# Deployment

Push to `main` → GitHub Actions runs lint + build → SSHes to the VM → writes `.env` → `scripts/deploy.sh` rebuilds with Docker Compose, waits for the healthcheck, and rolls back to the previous image if it fails.

## One-time setup

VM: Docker + compose plugin installed, repo cloned at `~/repos/attachement` (override with repo variable `APP_DIR`), SSH user in the `docker` group.

GitHub → Settings → Environments → **production** (optionally add required reviewers) with secrets:

| Secret | Value |
| --- | --- |
| `ORACLE_VM_URL` | VM host/IP |
| `ORACLE_USERNAME` | SSH user |
| `ORACLE_VM_PRIVATE_KEY` | deploy key (private) |
| `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_*`, `OPENAI_API_KEY`, `ALLOWED_EMAILS` | one secret per key in `.env.example` |

## Env var management

- `.env.example` is the contract. Deploy fails if any key in it is missing/empty as a secret.
- The VM `.env` is overwritten on every deploy from the individual secrets; never hand-edit it. Change a value by editing the secret and re-running the workflow (Actions → Run workflow).
- Add a new var: update `.env.example` in the PR, then update the secret before merging.
- Production needs `NEXTAUTH_URL` set to the public URL; use `NEXTAUTH_SECRET` from `openssl rand -base64 32`; keep OAuth callback URLs in sync.

## Pushing secrets from a local file

Each var is its own secret (`MONGODB_URI` included). Put production values in a gitignored `.env.production`, then:

```bash
scripts/push-env-secrets.sh .env.production
```

(equivalent to `gh secret set --env production --env-file .env.production`; single-line values only). SSH secrets:

```bash
gh secret set ORACLE_VM_URL --env production --body "<host>"
gh secret set ORACLE_USERNAME --env production --body "<user>"
gh secret set ORACLE_VM_PRIVATE_KEY --env production < ~/.ssh/<deploy_key>
```
