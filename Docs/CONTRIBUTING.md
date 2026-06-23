# Contributing to C Square Club Website

Read this fully before writing your first line of code. Every rule here exists for a reason. When in doubt, ask — don't assume.

---

## Ownership Boundaries

The most important rule on this project. Respect folder ownership at all times.

| Area | Owner | Scope |
|---|---|---|
| `/backend` | Backend lead | Django models, DRF endpoints, migrations, auth, QR logic, admin config |
| `/frontend` | Frontend dev | Next.js pages, components, API calls, styles, UI logic |
| `API_SPEC.md` | Backend writes, frontend reads | The contract between both sides. Never deviate from it without updating it first. |
| Root config files | Project lead only | `ARCHITECTURE.md`, `DB_SCHEMA.md`, `CONVENTIONS.md`, CI/CD pipelines, Azure config |

**If a file is outside your folder, do not touch it without explicitly asking first.**

---

## Getting Started on a New Task

Follow these steps in order, every time, without skipping.

**1. Pull latest main**
```bash
git checkout main
git pull origin main
```
Never start work on a stale branch.

**2. Pick a GitHub Issue**

All work must be tracked in GitHub Issues. If a task has no Issue, create one before starting. Assign it to yourself and move it to In Progress.

**3. Create a feature branch**
```bash
git checkout -b backend/event-registration
```
Follow the branch naming convention below. Never work directly on main.

**4. Read the relevant docs before opening Antigravity**

Before opening your agent, read:
- `ARCHITECTURE.md` — understand how the system fits together
- `DB_SCHEMA.md` — understand the data model
- `API_SPEC.md` — understand the existing endpoints

Feed these files to Antigravity at the start of every session.

**5. Work in your folder only**

Backend dev works in `/backend`. Frontend dev works in `/frontend`. Cross-boundary changes require a conversation with the other dev first.

**6. Open a Pull Request when done**

PR against main. Link the GitHub Issue. Fill the PR checklist. Request review from the other dev.

---

## Branch Naming

```
# New features
backend/event-registration
frontend/qr-scanner-ui
frontend/event-listing-page

# Bug fixes
fix/qr-token-collision
fix/registration-duplicate
fix/attendance-timestamp

# Docs and config
docs/update-api-spec
docs/db-schema-v2
chore/update-deps
```

One branch per task. Never bundle multiple features into one branch.

---

## Commit Message Format

```
feat: add POST /api/events/{id}/register/ endpoint
fix: resolve QR token collision on concurrent registrations
docs: update API_SPEC with attendance check-in endpoint
chore: add django-allauth to requirements.txt
refactor: extract QR generation into utils/qr.py
test: add unit tests for registration duplicate check
```

Format: `type: short description in lowercase`. No capital letters. No period at the end. Keep it under 72 characters. Be specific — "add endpoint" is bad, "add POST /api/events/{id}/register/" is good.

---

## Using Antigravity — Rules for Every Session

### Start every session with context

```
# Always do this first
cd backend   # or frontend
agy

# First message to the agent — always include context
@ARCHITECTURE.md @API_SPEC.md

My task today: [your specific task here]
```

Never start a session without feeding context files. The agent has no memory between sessions.

### How to write a good task prompt

**Bad prompt:**
```
build the event registration feature
```

**Good prompt:**
```
In backend/registrations/, create:
1. models.py — Registration model with fields: id (UUID), user (FK to
   users.User), event (FK to events.Event), registered_at (datetime),
   qr_token (UUID unique), status (choices: pending/confirmed/cancelled)
2. serializers.py — RegistrationSerializer with all fields read-only
   except status
3. views.py — RegisterView (POST, auth required),
   MyRegistrationsView (GET, auth required)
4. urls.py — wire up both views

Do not touch any other app. Refer to DB_SCHEMA.md for field types.
```

Name exact files. List all fields explicitly. Say what not to touch. Reference docs.

### After the agent finishes

- Run `/diff` — read every changed file before accepting
- Run tests — backend: Django test suite, frontend: TypeScript build + component tests
- Test the feature manually end to end
- Only then commit

### Hard rules for Antigravity

- Never use `always-proceed` mode — always use `request-review`
- Never let the agent touch files outside your assigned folder
- Never commit agent output you haven't read line by line
- One bounded task per session — don't give the agent multiple unrelated goals
- Check `/usage` after subagent-heavy sessions to monitor quota

---

## Pull Request Checklist

All of the following must be true before you request a review. If any box is unchecked, do not open the PR.

- [ ] All tests pass locally
- [ ] You have read every line of the diff
- [ ] No hardcoded secrets, API keys, or credentials anywhere in the code
- [ ] `API_SPEC.md` is updated if you added or changed an endpoint
- [ ] GitHub Issue is linked in the PR description (`Closes #12`)
- [ ] PR only touches your assigned folder (`/backend` or `/frontend`)
- [ ] Commit messages follow the format above

### Decision Violations
You must confirm that your code does not violate any of the 14 rules in the Active Decisions table (see `AGENT_CONTEXT.md`). Check these critical ones specifically:
- [ ] Error format strictly follows `{ error: { code, message, fields } }`
- [ ] UUID v4 used for all new models (no auto-increment integers)
- [ ] Soft delete used only where explicitly approved (e.g., team members), otherwise hard delete
- [ ] Role checks enforced on all protected endpoints
- [ ] QR tokens generated *only* on registration approval
- [ ] Attendance records created *only* on registration approval

**Mixed PRs — PRs that touch both `/backend` and `/frontend` — are automatically rejected.** Split them into two PRs.

---

## Code Review Rules

**As a reviewer:**
- Review within 24 hours of being requested. Don't leave your teammate blocked.
- Check that the PR checklist and Decision Violations section are complete before reviewing the code.
- Cross-reference the Active Decisions table in `AGENT_CONTEXT.md` during your review to catch any deviations from the established rules before approving.
- Approve only if you understand every change. "Looks fine" is not a review.
- Leave specific comments — don't just say "this is wrong", say why and what to do instead.

**As the PR author:**
- Address every comment before re-requesting review.
- Don't resolve someone else's comment — let the reviewer resolve it.
- If you disagree with a comment, explain why. Don't silently ignore it.

---

## Do and Don't

**Always do this:**
- Pull main before starting any work
- Work in your assigned folder only
- Read `/diff` before every commit
- Update `API_SPEC.md` the same day you write a new endpoint
- Link every PR to a GitHub Issue
- Run tests before opening a PR
- Ask before crossing ownership boundaries

**Never do this:**
- Push directly to main — ever
- Commit without reading agent output
- Hardcode secrets or API keys in any file
- Touch the other dev's folder without asking
- Modify `ARCHITECTURE.md` or `DB_SCHEMA.md` unilaterally
- Use `always-proceed` mode in Antigravity
- Open a PR without running tests first
- Merge your own PR

---

## Environment Variables

Never commit secrets. All configuration goes in environment variables.

```bash
# Backend — copy .env.example and fill in your values
cp backend/.env.example backend/.env

# Frontend — same
cp frontend/.env.example frontend/.env.local
```

`.env` and `.env.local` are in `.gitignore`. They will never be committed. If you accidentally commit a secret, tell the project lead immediately so it can be rotated.

---

## The Golden Rule

**main is always deployable.**

If your change breaks main, fixing it is your immediate priority — above all other work. Every developer on this project is responsible for the stability of main at all times.

---

## Questions?

Open a GitHub Issue with the label `question`. Don't DM — keep conversations in the repo so everyone has context.
