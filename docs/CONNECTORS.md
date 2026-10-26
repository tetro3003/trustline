# Connecting real accounts

Without `DEMO_MODE`, Trustline reads real accounts. Copy `.env.example` to `.env.local` (or set the variables on your host), fill in what you have, and restart. In the tables, `<origin>` is the app's address: `http://localhost:3000` on a laptop, or your hosted address (also set it as `PUBLIC_URL`).

## What each connection is for

| Connection | Evidence it gives | Score factors it feeds |
|---|---|---|
| Gmail | Client payments from Upwork, Fiverr, PayPal, Payoneer (signature-verified) | Income, months with income, stability, client spread, track record |
| Wise | Incoming transfers on every currency balance | Same as Gmail; also the account holder's name for the name check |
| Crypto wallets | Incoming USDT/USDC on the address the user proved they own | Same as Gmail |
| Bank statement | Credits from the uploaded statement, labelled as uploaded | Same as Gmail; payouts from connected platforms count once |
| Confirm with your bank | The account holder's name from the bank | Identity (+20) |
| ID check | Verified name, document validity, age, live person | Identity (+20, or +10 next to the bank) and the name check |
| Figma | The user's own edits (version history) and comments by others | Design work, work matches income, clients in both |
| Canva | Design creation and edit dates | Design work, work matches income |
| Webflow | Sites, publishes, client domains, page edits | Design work, work matches income, clients in both |
| Miro | The user's board edits and board members | Design work, work matches income, clients in both |
| Dribbble | Published shots | Track record (portfolio), not weekly work |

When hosted, `<origin>` is the public address, for example `https://your-host.example/api/beta/oauth/canva/callback`.

## Works without any setup

| Source | How |
|---|---|
| **Figma** | *Use a personal access token*: Figma → avatar → **Settings → Security → Personal access tokens → Generate** (read: File content, File versions, Comments). Paste it, then paste 1–3 links to files with client work. |
| **Wise** | Wise → **Settings → Developer tools → API tokens → Add new token → Read only**. Paste it into the Wise card. |
| **Webflow** | *Use a site token*: Site settings → **Apps & integrations → API access → Generate API token** (read-only Sites and Pages). |
| **Crypto wallets** | **Add wallet** → pick the network → **Connect & sign** with MetaMask, Phantom or TronLink (free, moves no money). No extension? **Sign manually**. |
| **TBC Bank statement** | **Upload statement** monthly: a CSV with `date, amount, currency, counterparty`, or the bank's open-banking JSON. Example: [`public/samples/tbc-test-transactions.csv`](../public/samples/tbc-test-transactions.csv). |
| **ID check** | **Start** → ID card or passport → photograph the code lines (`<<<`), the photo, then a live selfie. Needs a camera; photos never leave the device. |

## "Sign in with …" (one developer app per company)

Set the redirect URL in each app exactly as shown.

| Company | Where | Scopes | Redirect URL | Variables |
|---|---|---|---|---|
| **Google (Gmail)** | console.cloud.google.com → new project → enable **Gmail API** → **Google Auth Platform → Get started** (Audience: External) → **Audience → Test users** → **Clients → Create client → Web application** | `gmail.readonly` (requested by the app) | `<origin>/api/beta/oauth/google/callback` | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Canva** | canva.com/developers → **Your integrations → Create** (needs two-factor sign-in on the account) | `design:meta:read`, `profile:read` | `<origin>/api/beta/oauth/canva/callback` | `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET` |
| **Miro** | miro.com/app/settings → **Your apps → Create new app** | `boards:read` | `<origin>/api/beta/oauth/miro/callback` | `MIRO_CLIENT_ID`, `MIRO_CLIENT_SECRET` |
| **Dribbble** | dribbble.com/account/applications/new | `public` (requested by the app) | `<origin>/api/beta/oauth/dribbble/callback` | `DRIBBBLE_CLIENT_ID`, `DRIBBBLE_CLIENT_SECRET` |
| **Webflow** | Workspace settings → **Apps & Integrations → Develop → Create an App** | Sites read, Pages read, Authorized user read | `<origin>/api/beta/oauth/webflow/callback` | `WEBFLOW_CLIENT_ID`, `WEBFLOW_CLIENT_SECRET` |
| **Figma** (optional) | figma.com/developers/apps → new app | File content, versions, comments | `<origin>/api/beta/figma/callback` | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` |

### Who can sign in before an app is approved

- **Google:** while the app is in Testing, only the test users you add (up to 100), and their sign-in lasts 7 days. Opening the Gmail read scope to everyone requires Google's verification and a security assessment.
- **Canva:** until Canva reviews the integration, only accounts on your own Canva team.
- **Miro:** until the app is published, only your developer team, unless you turn on sharing outside the team in the app settings.
- **Canva on a laptop:** Canva doesn't accept `localhost`. Use `http://127.0.0.1:3000/api/beta/oauth/canva/callback` and open the app at `http://127.0.0.1:3000/beta`.

## Confirm with your bank (open banking)

TBC Bank or Bank of Georgia confirms the account holder's name (Berlin Group NextGenPSD2, `allAccountsWithOwnerName`: no balances, no transactions). Set the bank's sandbox details: `TBC_OB_BASE_URL`, `TBC_OB_TOKEN_URL`, `TBC_OB_CLIENT_ID`, `TBC_OB_CLIENT_SECRET`, `TBC_OB_API_KEY` (and the same with `BOG_`). See `server/beta/providers/bank-identity.ts`.

## Claude

`ANTHROPIC_API_KEY`: Claude reads signature-verified payment emails and writes the officer's explanation. Without it, built-in rules are used and labelled.

## Other settings

| Variable | Meaning |
|---|---|
| `PUBLIC_URL` | Public address when hosted (used for redirect URLs). On Render, `RENDER_EXTERNAL_URL` is used automatically. |
| `TRUSTLINE_SECRET` | Vault key, 64 hex characters. Empty: a key file is created next to the database. |
| `TRUSTLINE_DB_PATH` | SQLite file (default `data/trustline.db`). |
| `TRONGRID_API_KEY`, `SOLANA_RPC_URL` | Optional blockchain readers. |
| `ROBOT_CHECK_MINUTES`, `ROBOT_MAX_AGE_HOURS` | How often the daily robot checks, and how old data must be before it re-reads. |
| `FX_<CODE>_USD` | Override a currency rate, e.g. `FX_GEL_USD=0.37`. |
