# API reference

Every endpoint lives under `/api/beta/` and is served by one handler, [`server/beta/http.ts`](../server/beta/http.ts). The web app uses exactly this API; nothing is private to the UI.

## Conventions

- **Auth:** a session cookie `tl_beta` (HttpOnly, SameSite=Lax, Secure when served over HTTPS, 14 days) set by `signup` and `login`. Only the token's SHA-256 is stored on the server.
- **Writes** (`POST`, `DELETE`) must send `Content-Type: application/json`, and if the browser sends an `Origin`, it must be the app's own address. This blocks cross-site form attacks.
- **Rate limits:** sign-up 20 per 15 minutes per IP address; login 10 per 15 minutes per email.
- **Errors:** `{"error": "<message for the user>"}` with a matching status: 400 invalid input, 401 not logged in or wrong password, 403 wrong role, missing consent or cross-site request, 404 not found, 409 already exists, 413 file too big, 415 not JSON, 429 too many attempts or the provider asked us to slow down, 501 a provider isn't set up on this server, 502 a provider returned an error.
- **Roles:** `freelancer` (default) and `lender`. Lender-only endpoints are marked.

## Accounts

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `signup` | `email`, `name`, `password` (8+), `role` (`freelancer` or `lender`), `org` (lenders: bank name) | `201 {user}` and the session cookie |
| POST | `login` | `email`, `password` | `{user}` and the session cookie |
| POST | `logout` | `{}` | `{ok}`, cookie cleared |
| GET | `me` | | `{user, figmaOAuth, setup}`; `setup` says which providers, Claude, bank identity and demo mode are enabled on this server |

## Connecting sources

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `oauth/{google,canva,webflow,miro,dribbble}/start` | `{}` | `{url}`: the provider's consent page (the mock page in demo mode) |
| GET | `oauth/{provider}/callback` | query `code`, `state` | 302 to `/beta?connected=<id>` or `/beta?error=…` |
| POST | `figma/start` | `{}` | `{url}` for "Sign in with Figma" |
| GET | `figma/callback` | query `code`, `state` | 302 to `/beta?figma=<id>` |
| POST | `figma/token` | `token` (personal access token) | `201 {connectionId}` |
| POST | `wise/token` · `webflow/token` | `token` (read-only) | `201 {connectionId}` |
| POST | `wallets/challenge` | `family` (`evm`, `solana`, `tron`), `address` | `{challengeId, message, expiresAt}` |
| POST | `wallets/verify` | `challengeId`, `signature`, `walletName` | `201 {connectionId}` once the signature proves ownership |
| POST | `bank/import` | `filename`, `content` (CSV or open-banking JSON, max 5 MB) | `201 {connectionId}` |
| POST | `bank-id/{tbc,bog}/start` | `{}` | `{url}`: the bank's consent page |
| GET | `bank-id/{bank}/callback` | query `state` | 302 to `/beta?bankid=ok` or `/beta?error=…` |
| POST | `identity` | `mrz`, `liveness {blink, turn, realScore}`, `faceSimilarity` (0–1) | `{identity}`: the server re-checks MRZ check digits, expiry, age 18+, liveness and the face match (≥ 0.55) |

## Connections

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `connections` | | All the user's connections with status, last sync and last error (never secrets) |
| POST | `connections/{id}/files` | `files`: Figma file links | `202`; the files are read in the background |
| POST | `connections/{id}/sync` | `{}` | `202`; reads the source again now |
| DELETE | `connections/{id}` | | `{ok}`; the connection and every fact it produced are deleted |

## Results

| Method | Path | Returns |
|---|---|---|
| GET | `score` | `{score, history}`: the current report (score, band, verified income, max payment, reasons, flags, months, features, missing steps) and past scores |
| GET | `payments` | Every payment with its status (`income`, `duplicate`, `own_transfer`, …), note and proof link |
| GET | `work` | Every work fact (version, edit, publish, comment, shot) |
| GET | `timeline?after=<id>` | Timeline steps newer than `id` ("Behind the scenes") |
| GET | `identity` | `{identity, banks}`: ID check and bank confirmations |

## Sharing (freelancer)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `lenders` | | Lender accounts that can receive a report |
| GET | `shares` | | `{shares, decisions, audit}`: who has access, their decisions, and every access to the report |
| POST | `shares` | `lenderId` | `201 {shareId}`; 409 if already shared |
| POST | `shares/{id}/revoke` | `{}` | `{ok}`; the lender loses access immediately |

## Review (lender only)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `lender/applicants` | | Applicants with an active share: name, score, band, verified income, flag count, last decision |
| GET | `lender/applicants/{id}` | | The full report: score, reasons, flags, payments, work, identity, suggestion, explanation (`by`: `claude` or `rules`), decisions, audit trail. 403 without an active share. |
| POST | `lender/applicants/{id}/decision` | `decision` (`approve`, `request_info`, `decline`), `amountUsd` (required to approve), `note` (required unless approving) | `201 {ok}` |

## Example

```bash
B=https://trustline-bu58.onrender.com/api/beta
curl -c jar -H 'Content-Type: application/json' -d '{"email":"me@example.com","name":"Nino Beridze","password":"password123"}' $B/signup
curl -b jar -H 'Content-Type: application/json' -d '{"token":"<wise read-only token>"}' $B/wise/token
curl -b jar $B/score
```
