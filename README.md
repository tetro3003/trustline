# Trustline

**Credit decisions for freelancers, based on income we can prove.**

A freelance designer has no payslip, so a bank can't tell whether she can repay a loan. Screenshots and PDFs are easy to fake. Trustline connects to the places where her money and her work actually live (payment emails, Wise, crypto wallets, her bank, Figma, Canva, Webflow, Miro, Dribbble), verifies every payment at the source, checks that real design work stands behind the income, and turns it into a 300–850 score with plain-language reasons. A bank officer reviews the report, reads an explanation written by Claude from verified facts only, and makes the decision. Trustline never decides.

**Live demo:** _link added after deployment_ · **Track:** AI in Finance

---

## Try the demo

The demo runs with `DEMO_MODE=1`. Every outside service is replaced by a local stand-in with synthetic data for one fictional designer, Nino Beridze, and every sign-in screen is a clearly labelled mock consent page. Everything else is the real pipeline: signature checks (one payment email is deliberately forged and gets rejected), de-duplication, scoring, the Claude explanation and the human decision.

1. Open the demo and **Create account → Freelancer**. Use the name **Nino Beridze** (the stand-in accounts belong to her; another name triggers the "name doesn't match" check), any email and a password of 8+ characters.
2. Connect the sources: Gmail, Figma, Wise, Canva, Webflow, Miro, Dribbble, **Confirm with your bank**. For the bank statement, upload [`public/samples/tbc-test-transactions.csv`](public/samples/tbc-test-transactions.csv). Every API call shows live in **Behind the scenes** on the right.
3. Open **Apply for credit**, choose **City Bank**, click **Share my report**. Log out.
4. Log in as the bank officer: **ana@citybank.demo** / **password123**. Open the applicant: score, reasons, risk flags, verified payments, Claude's explanation, the system's suggestion.
5. Approve, request info or decline. The decision lands in the audit trail, and the freelancer sees who looked at her data.

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

[`render.yaml`](render.yaml) deploys the demo to [Render](https://render.com): **New → Blueprint →** pick this repo **→ Apply**, and enter an Anthropic key when asked (optional). It needs a host that keeps a Node server running, because data lives in a SQLite file and a background job refreshes connections daily. On the free plan the server sleeps when idle and the demo data resets on restart; the demo bank officer is recreated automatically.

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

## Limitations

- Canva and Miro only let a developer's own team sign in until the integration is reviewed; Gmail needs Google's verification for the read-only Gmail scope before it opens to everyone.
- Currency conversion uses approximate fixed rates (override with `FX_<CODE>_USD`).
- SQLite fits a single server; the store is behind one interface, so a Postgres version is a contained change.
