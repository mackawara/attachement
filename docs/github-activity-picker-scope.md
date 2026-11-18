# Scope: pick daily tasks from the student's GitHub activity

**Goal:** On the New Week form, each day (Mon–Fri) gets a dropdown listing the
student's commits and pull requests from that day. Picking items fills the
brief note for that day, and the existing "Expand with AI" step turns the notes
into logbook text.

## Where the app stands today

| Area | Current state | Gap |
| --- | --- | --- |
| GitHub OAuth scope | Default from next-auth: `read:user user:email` | Public data only. Private repos need more access (see options). |
| Access token | Not kept. The `jwt` callback in `src/lib/auth.ts` drops `account.access_token`. | It must be saved so the server can call GitHub for the student. |
| GitHub username | Not stored. `githubId` holds the numeric ID. | Search queries need the `login`. Save `profile.login` at sign-in. |
| Students using Google | Allowed (`Google` provider) | They have no GitHub link. They need a "Connect GitHub" step, or the feature is hidden for them. |
| Week dates | `weekEnding` is a Friday. `src/lib/weekDates.ts` now has UTC date helpers. | Mon–Thu are `addDays(weekEnding, -4..-1)`, so the date range for each day is easy to get. |
| UI | MUI v9 is already installed | `Autocomplete` (multi-select, grouped by repo) covers the dropdown. |

## Options for getting the data

### A. Public activity only (smallest change)
* Save `login` and the OAuth token in the JWT. The scope stays the same.
* `GET /search/commits?q=author:{login}+author-date:{from}..{to}`
* `GET /search/issues?q=author:{login}+type:pr+created:{from}..{to}`
* **Limits:** public repos only. Commit search only covers default branches.
  The search API allows 30 requests per minute per token.
* **Risk:** most attachment work is in **private company repos**. If so, the
  dropdown will often be empty.

### B. The student's own OAuth token with the `repo` scope
* Change the GitHub provider to request `read:user user:email repo`. Students
  who are already signed in have to approve again.
* Use GraphQL `viewer.contributionsCollection(from, to)` to find which repos had
  activity, plus `pullRequestContributions` for PR titles. Then call
  `GET /repos/{owner}/{repo}/commits?author={login}&since=&until=` on each
  active repo to get commit messages.
* **Limits:** OAuth Apps have no read-only scope for private repos. `repo`
  grants **full read/write** on every repo the student can reach, which is a
  big thing to ask for. Company orgs often restrict OAuth Apps, so an org admin
  has to approve the app before its repos show up.

### C. A GitHub App (best long-term option)
* Fine-grained, read-only permissions: `Metadata`, `Contents: read`,
  `Pull requests: read`.
* The student installs the app on their account, or the company installs it
  on its org. User tokens expire after 8 hours and come with refresh tokens,
  so token storage and refresh are needed. That points to a DB-backed
  `GitHubConnection` model rather than the JWT.
* **Costs:** more setup (a second app, refresh logic, an install flow). Org
  approval is still out of our hands.

**Recommendation:** ship **A** first, using the student's own token. It is
cheap and shows whether students use the feature. Before building B or C, ask
students where their attachment repos live. If most are private org repos, go
straight to **C** and skip B, because a read-only app is easier for companies
to approve than a broad `repo` grant.

## Proposed design (phase 1)

1. **Auth (`src/lib/auth.ts`, `src/types/next-auth.d.ts`)**: in `jwt`, save
   `profile.login` and `account.access_token` when signing in with GitHub.
   Keep the token **server-side only**: expose `githubLogin` on the session,
   never the token.
2. **API `GET /api/github/activity?weekEnding=YYYY-MM-DD&tz=Africa/Harare`**
   * Reads the token from the JWT (`getToken`) on the server.
   * Gets commits and PRs for Mon–Fri of that week and normalizes each one to
     `{ type: "commit" | "pr", repo, title, url, at, day }`.
   * Puts each item in a day using the student's time zone. Commit dates carry
     their own offsets, so items near midnight can otherwise land on the
     wrong day.
   * Drops merge commits ("Merge branch …", "Merge pull request …").
     Optionally hides commits that are already part of a listed PR.
   * Caches results for each student and week for about 10 minutes, so
     reopening the form doesn't use up the rate limit.
   * Handles 401 (token revoked → ask to reconnect), 403 or 429 (rate
     limited → show a message), and empty results.
3. **UI (`src/app/week/new/page.tsx`, and later the edit page)**
   * A multi-select `Autocomplete` above each day's note field, grouped by
     repo, showing `repo · title · time`.
   * Picking items adds them to that day's note, for example
     `"Fixed auth redirect (PR #12, attachement); add docker setup"`.
     The student can still edit the note.
   * The list loads after the week-ending date is filled in (it is prefilled
     now) and reloads when the date changes.
   * Google-only students see a "Connect GitHub to pick tasks" hint instead.
4. **AI expand (`src/app/api/expand/route.ts`)**: no change is needed at
   first, because the picked items become the brief notes. Later, sending the
   PR body or changed file paths would give the model better context.

## Effort estimate

| Work | Estimate |
| --- | --- |
| Save login and token, types, re-login handling | 0.5 day |
| Activity API: fetch, normalize, sort into days, cache, errors | 1–1.5 days |
| Per-day Autocomplete UI and adding picks to the note | 1 day |
| Testing (time zones, empty weeks, revoked token, rate limits) | 0.5–1 day |
| **Phase 1 total (public data)** | **≈ 3–4 days** |
| Phase 2: private repos with a GitHub App (C) | +3–5 days, plus waiting on org admins |
| Phase 2 alternative: `repo` scope (B) | +1–2 days, plus re-consent and the trust cost |

## Risks and open questions

* **Where are the repos?** Personal public repos, personal private repos, or
  company orgs? This decides between A, B and C.
* **Privacy:** commit messages from private company code would go into a
  logbook that the university and supervisors read, and to OpenAI if the
  student expands them. The student should pick items explicitly (no
  auto-fill), and the UI should say where the text goes.
* **Token storage:** a JWT cookie works for long-lived OAuth App tokens. GitHub
  App refresh tokens need a database record, encrypted at rest.
* **Supervisor credibility:** optionally keep the commit or PR URLs on the
  `Week` record so supervisors can check the work. This needs a small schema
  addition (`days.<day>.sources: [{url, title}]`).
