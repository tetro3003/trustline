# Trustline

**Credit decisions for freelancers, based on income we can prove.**

A freelance designer has no payslip, so a bank can't tell whether she can repay a loan. Screenshots and PDFs are easy to fake. Trustline connects to the places where her money and her work actually live (payment emails, Wise, crypto wallets, her bank, Figma, Canva, Webflow, Miro, Dribbble), verifies every payment at the source, checks that real design work stands behind the income, and turns it into a 300–850 score with plain-language reasons. A bank officer reviews the report, reads an explanation written by Claude from verified facts only, and makes the decision. Trustline never decides.

**Try it:** run it locally in demo mode in two commands (see [Run it locally](#run-it-locally)) · **Track:** AI in Finance

## Documentation

| Document | What's inside |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System diagram, layers, the 7-step pipeline, sequence diagrams of the main flows, the daily robot, demo mode, data model, testing, deployment, how to add a source |
| [Scoring engine](docs/SCORING.md) | Every factor with its points and formula, weight split, risk flags, bands, the officer suggestion, a worked example, what-if scenarios, next steps with partner banks |
| [API reference](docs/API.md) | Every endpoint with its body and response, auth, errors and rate limits |
| [Security and privacy](docs/SECURITY.md) | What is read and stored per source, encryption, sessions, consent, AI safeguards, the fraud each check catches |
| [Connecting real accounts](docs/CONNECTORS.md) | What each connection is for, setup steps and redirect URLs per provider, who can sign in before approval |

---

## What it can do

**For the freelancer**
- Connect income sources: Gmail (payment emails from Upwork, Fiverr, PayPal, Payoneer…), Wise, crypto wallets (EVM chains, Tron, Solana), a monthly bank statement.
- Connect work tools: Figma, Canva, Webflow, Miro, Dribbble.
- Prove identity: confirmation by the bank through open banking, or an in-browser passport/ID check with a live selfie.
- See the score, the verified monthly income, each reason with its points, and every step the system took ("Behind the scenes").
- Share the report with a chosen bank, revoke it, and see who looked at it.

**For the bank officer**
- A list of applicants who shared their report.
- The full report: score and band, reasons, risk flags, verified payments, work found, identity.
- A short explanation written by Claude from verified facts only, plus the system's suggestion.
- A human decision (approve with an amount, request info, decline) recorded in an audit trail.

**Behind it**
- Every payment verified at the source: DKIM signatures on emails, wallet ownership by signature, genuine stablecoin contracts only.
- De-duplication across sources and a fraud check that income is backed by real design work.
- A daily robot that refreshes every connection, so the report stays current.

## Try the demo

The demo runs with `DEMO_MODE=1`. Every outside service is replaced by a local stand-in with synthetic data for one fictional designer, Nino Beridze, and every sign-in screen is a clearly labelled mock consent page. Crypto wallets are the exception: if you connect your own wallet, its public blockchain history is read for real. Everything else is the real pipeline: signature checks (one payment email is deliberately forged and gets rejected), de-duplication, scoring, the Claude explanation and the human decision.

1. Open the demo and **Create account → Freelancer**. Use the name **Nino Beridze** (the stand-in accounts belong to her; another name triggers the "name doesn't match" check), any email and a password of 8+ characters.
2. Connect the sources: Gmail, Figma, Wise, Canva, Webflow, Miro, Dribbble, **Confirm with your bank**. For the bank statement, upload [`public/samples/tbc-test-transactions.csv`](public/samples/tbc-test-transactions.csv). Every API call shows live in **Behind the scenes** on the right.
3. Open **Apply for credit**, choose **City Bank**, click **Share my report**. Log out.
4. Log in as the bank officer: **ana@citybank.demo** / **password123**. Open the applicant: score, reasons, risk flags, verified payments, Claude's explanation, the system's suggestion.
5. Approve, request info or decline. The decision lands in the audit trail, and the freelancer sees who looked at her data.

Optional: **Add wallet** works with MetaMask, Phantom or TronLink. The **ID check** is real (it needs a camera and a passport or ID card); in the demo it compares your document's name with Nino's accounts and raises a "name doesn't match" flag, which is the fraud check working. The bank confirmation already proves Nino's identity, so the ID check can be skipped.

## What's real and what's synthetic

| Real (runs the same with real accounts) | Synthetic in the demo |
|---|---|
| OAuth 2.0 sign-in flows (PKCE, state), token vault (AES-256-GCM) | The accounts and data behind each service |
| DKIM signature check of every payment email, forged-email rejection | Provider sign-in pages (mock consent screens) |
| Payment extraction (Claude, with a rule-based fallback) | The bank's open-banking sandbox |
| De-duplication across sources, payout and own-wallet rules | |
| Work-vs-income matching, scoring, risk flags, suggestion | |
| Claude's explanation for the officer, human decision, audit trail | |
| ID check: MRZ check digits, liveness, face match (in the browser) | |

Without demo mode, the same app reads real accounts. Each provider needs its own developer app; see [docs/CONNECTORS.md](docs/CONNECTORS.md).

## How the score works

A transparent points scorecard: it starts at 500, and ten factors add or remove points (income level, regularity, stability, client spread, track record, design work, work matching income, clients seen in both, identity). Risk flags cap the score. The result is 300–850 with bands A–E, a suggested repayment limit of 30% of verified income, and a suggestion for the officer. About 55% of the weight is ability to pay and 28% is the real work behind the income. Full details, weights and next steps: [docs/SCORING.md](docs/SCORING.md).

The current weights are a demo-stage expert scorecard. **After the demo stage, the scoring model will be co-created with partner banks:** their credit teams set the policy and cut-offs, and their repayment data calibrates the weights.

## How AI is used

- **Reading payment emails.** After an email passes the DKIM signature check, Claude extracts the amount, currency, client and date, whatever the wording or language. Without a key, built-in rules handle Upwork, Fiverr, PayPal and Payoneer.
- **Explaining the decision to the officer.** Claude writes a short memo using only the verified facts it is given: what supports lending, the main risk, and the system's suggestion. It is told never to invent numbers or decide. If Claude is unavailable or refuses, a rule-based memo is shown and labelled as such.
- **What AI does not do:** it does not score and it does not decide. The score is a transparent, deterministic points model, and a person makes every decision.

## Run it locally

Needs Node 20+.

```bash
npm install
npm run demo        # demo mode → http://localhost:3000
npm run dev         # real mode (needs provider keys in .env.local, see .env.example)
```

Optional: put `ANTHROPIC_API_KEY=...` in `.env.local` to have Claude write the explanation and read emails.

| Command | What it does |
|---|---|
| `npm test` | Vitest: sources end to end, signature checks, scoring, ID check, lender review |
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint |
| `npm run build` / `npm start` | Production build / serve |
| `npm run reset-db` | Delete the local database |

## Deploy

[`render.yaml`](render.yaml) deploys two services to [Render](https://render.com) (**New → Blueprint →** pick this repo **→ Apply**):

- **`trustline`** (real mode) reads real accounts. Figma, Wise and Webflow tokens, crypto wallets, bank statements, the ID check and Claude work right away. Each "Sign in with …" button needs that company's developer app; add its keys in the service's **Environment** page ([docs/CONNECTORS.md](docs/CONNECTORS.md)). To try the bank side, sign up a second account as **Lender**.
- **`trustline-demo`** (demo mode) is the walkthrough above, with no keys needed.

Both need a host that keeps a Node server running, because data lives in a SQLite file and a background job refreshes connections daily. On Render's free plan a service sleeps when idle and starts with an empty database after a restart; for lasting real accounts, use a paid instance with a persistent disk and set `TRUSTLINE_DB_PATH` to a file on it.

## Architecture

Next.js (App Router) serves both the UI and the API from one Node process, with SQLite for storage. Full description: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
app/beta/              Pages: freelancer and bank-officer views (one page, by role), mock consent screen
app/api/beta/          One route handler → server/beta/http.ts
components/beta/       UI: source cards, timeline, score panel, lender review, ID check, wallets
lib/beta/              Shared logic: scoring, reconciliation, suggestion, MRZ, FX, browser API client
server/beta/           Service, HTTP API, SQLite store, vault, auth, daily robot, Claude memo, demo stand-ins
server/beta/providers/ One file per source: Gmail, Figma, Wise, wallets, bank import, bank identity, OAuth, work tools
tests/                 Vitest suites
```

## Security and privacy

- Read-only scopes everywhere; passwords for outside services never reach Trustline.
- Access tokens are encrypted (AES-256-GCM) before they touch the database.
- Only emails from payment companies are requested, and only signature-verified ones count.
- ID photos and the selfie never leave the browser; only the check results are sent.
- The freelancer chooses which bank sees the report and can revoke access; every view and decision is logged.

## Guardrails in the code

Where each control lives, so it can be checked against the implementation:

| Guardrail | Where |
|---|---|
| Only signature-verified emails count and reach Claude (DKIM or Google's delivery stamp) | `server/beta/providers/gmail.ts` (`verifyPaymentEmail`) |
| Claude extraction is constrained: strict JSON schema, email text treated as data, refusal handled, rule-based fallback | `server/beta/providers/email-extract.ts` |
| Claude never scores: the score is a deterministic scorecard with plain-language reasons and risk flags | `lib/beta/score.ts`, [docs/SCORING.md](docs/SCORING.md) |
| The officer memo uses verified facts only; refusal or error falls back to a labelled rule-based memo | `server/beta/explain.ts` |
| The system only suggests; a person decides, and overriding the suggestion is recorded | `lib/beta/decision.ts`, `decide()` in `server/beta/service.ts` |
| Consent: only lenders with an active, unrevoked share can open a report; roles are checked | `requireShare()` / `requireRole()` in `server/beta/service.ts` |
| Audit trail of shares, revocations, report views, memos and decisions, visible to the freelancer | `store.audit(...)` in `server/beta/service.ts` |
| Fraud controls: cross-source de-duplication, platform payouts counted once, own-wallet transfers ignored, official stablecoin contracts only, dust ignored | `lib/beta/reconcile.ts`, `server/beta/providers/wallets.ts` |
| Wallet ownership by one-time signed challenge | `walletChallenge()` / `walletVerify()` in `server/beta/service.ts` |
| Access keys encrypted with AES-256-GCM; scrypt passwords; hashed session tokens | `server/beta/vault.ts`, `server/beta/auth.ts`, `server/beta/store.ts` |
| Same-origin JSON-only writes and rate limits on sign-up and login | `server/beta/http.ts` |
| ID photos never leave the browser; the server re-checks MRZ check digits, expiry and age | `lib/beta/id-capture.ts`, `server/beta/idcheck.ts` |
| Fairness: no gender, age, ethnicity or location among the score's inputs (age is only checked as 18+ on the ID) | `lib/beta/score.ts` (`BetaScoreInput`, `features`) |
| Tests covering the above (forged and edited emails, signatures, vault tampering, consent, decisions, audit) | `tests/` |

Full description: [docs/SECURITY.md](docs/SECURITY.md).

## Third-party components and licences

| Component | Used for | Licence |
|---|---|---|
| Next.js, React, React DOM | Web app and API | MIT |
| @anthropic-ai/sdk | Calls to the Claude API | Apache-2.0 |
| better-sqlite3 | SQLite storage | MIT |
| mailauth, mailparser | DKIM verification, email parsing | MIT |
| viem | EVM wallet signature verification | MIT |
| tesseract.js | In-browser OCR of the ID's machine-readable zone | Apache-2.0 |
| @vladmandic/human | In-browser face detection, liveness and face match | MIT |
| zod | Validating the JSON Claude returns | MIT |
| Radix UI (dialog, slot), class-variance-authority, clsx, tailwind-merge, lucide-react, next-themes | UI components, styling helpers, icons, theme | MIT · Apache-2.0 (class-variance-authority) · ISC (lucide-react) |
| Tailwind CSS | Styling | MIT |
| TypeScript, ESLint, Vitest | Build, lint, tests | Apache-2.0 (TypeScript) · MIT |
| Inter, Manrope (via `next/font`) | Typefaces | SIL Open Font License 1.1 |

External services: the Claude API (Anthropic, under Anthropic's commercial terms), and in real mode the read-only APIs of Google (Gmail), Wise, Figma, Canva, Webflow, Miro, Dribbble, public blockchain explorers (Blockscout, TronGrid, Solana RPC) and banks' open-banking sandboxes. The face and OCR models are downloaded from public CDNs on first use under the licences of the libraries above.

## Limitations

- On the live app, "Sign in with" Figma, Canva and Gmail work for the team and listed test users until each provider finishes reviewing the app (Figma and Canva review public apps; Google verifies the read-only Gmail scope). Anyone can already connect Figma and Webflow with a personal token, plus Wise, wallets and bank statements.
- The scoring weights are expert judgement, not yet calibrated on repayment outcomes; they will be co-created with partner banks after the demo stage. See [docs/SCORING.md](docs/SCORING.md#limitations-and-next-steps).
- Currency conversion uses approximate fixed rates (override with `FX_<CODE>_USD`).
- SQLite fits a single server; the store is behind one interface, so a Postgres version is a contained change.
