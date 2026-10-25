# Security and privacy

Trustline handles people's income and identity, so it is built to collect as little as possible, prove everything it uses, and leave every decision to a person. This document describes what is collected, how it is protected, and which kinds of fraud the system catches.

## Data minimisation: what is read, what is stored

| Source | Read | Stored | Not kept |
|---|---|---|---|
| Gmail | Emails **from** Upwork, Fiverr, PayPal and Payoneer only (the filter runs on Google's side) | Per payment: date, amount in USD, payer, platform, proof of the signature check | Any other email; email bodies after extraction |
| Wise | Incoming transactions on balance statements | Date, amount, payer | Outgoing payments (dropped while reading) |
| Wallets | Incoming USDT/USDC transfers to the verified address | Date, amount, chain, sender address, explorer link | Private keys (the wallet only signs a one-time message) |
| Bank statement | Credits in the uploaded file | Date, amount, payer, labelled "from bank statement" | Debits (dropped while reading) |
| Bank identity | Account holder name (Berlin Group `allAccountsWithOwnerName`) | Bank, holder name, whether it matches | Balances, transactions |
| Figma, Canva, Webflow, Miro, Dribbble | Edit and publish dates, file or board titles, collaborators | Date, kind, title, collaborator name | The designs themselves |
| ID check | Done in the browser | Result only: name, document type, which checks passed | Photos and the selfie (never uploaded) |
| Account | Name, email, password | Name, email, scrypt hash | Plain-text password |

All provider access is **read-only**. Passwords for outside services never reach Trustline: sign-in happens on each provider's own page, or the user pastes a read-only token they created.

## Protection

- **Access keys at rest:** sealed with AES-256-GCM before they touch the database. The master key comes from `TRUSTLINE_SECRET`, or a key file kept next to the database with owner-only permissions. A stolen database alone reveals no keys, and a tampered ciphertext is rejected.
- **Passwords:** scrypt with a random 16-byte salt, compared in constant time.
- **Sessions:** a random 256-bit token in an HttpOnly, SameSite=Lax cookie (Secure over HTTPS). Only its SHA-256 is stored, so a database leak can't be replayed as a login. Sessions last 14 days.
- **Cross-site attacks:** every write must be JSON from the app's own origin; form posts from other sites are refused.
- **Brute force:** login is limited to 10 attempts per email per 15 minutes, sign-up to 20 per IP address.
- **OAuth:** a one-time `state` blocks hijacked callbacks, and PKCE (where the provider supports it) makes a stolen code useless. Codes are traded for keys server to server; expired keys are refreshed automatically.
- **Wallet ownership:** a one-time, expiring challenge signed by the wallet. A copied address without the key can't be connected.
- **Secrets never leave the server:** connection lists, reports and the lender view never include access keys.

## Consent and control

- The freelancer chooses which bank sees the report. Nothing is shared by default.
- A share can be revoked at any time; the bank loses access immediately (403).
- Disconnecting a source deletes the connection and every fact it produced.
- Every access is logged in an audit trail the freelancer can read: report shared, revoked, opened (with the officer's name), explanation written, decision made.

## AI safeguards

- **Claude never scores and never decides.** The score is a deterministic scorecard; the decision is made by a person, and the record shows whether the officer followed or overrode the system's suggestion.
- **Only verified emails reach Claude** for extraction. The email text is passed as data with an explicit instruction not to follow anything written in it, and the answer must match a strict JSON schema.
- **The officer's explanation is written from verified facts only** (a JSON summary, never raw emails), is told not to invent numbers or decide, and is limited to 110 words.
- **Fallback, clearly labelled:** if Claude is unavailable or refuses, rules take over for extraction and the memo, and the report says so.

## Fraud the system catches

| Attack | Defence |
|---|---|
| Fake or edited payment screenshots and PDFs | Not accepted: income comes only from sources that can be verified at the origin |
| Forged or edited payment email | DKIM signature check against the company's key in DNS; one changed character breaks it. The demo includes a forged PayPal email, which is rejected. |
| Claiming someone else's wallet | Ownership must be proven by signing a one-time message |
| Fake "USDT" tokens and dust spam ("address poisoning") | Only official token contracts count; transfers under $1 are ignored |
| Counting the same money twice | Cross-source de-duplication (7 days, 4%), platform payouts counted once, transfers between own wallets ignored |
| Income paid into someone else's account | "Name doesn't match" flag when a money account's holder differs from the verified ID; score capped at 599 |
| Money parked just before applying | "Sudden income jump" flag and −40 points |
| Income with no real work behind it | "Income without design work" flag; score capped at 599 |
| A stranger reading the report | Only lenders with an active, unrevoked share; every view logged |

## Known gaps (demo stage)

- No self-service account deletion yet (disconnecting sources deletes their data).
- Rate limits are kept in memory, so they reset when the server restarts.
- On the free hosting plan the database lives on temporary disk; production needs a persistent, encrypted disk or a managed database, and a `TRUSTLINE_SECRET` held in a secrets manager.
- The ID check runs in the browser and the server re-verifies everything it can prove (MRZ check digits, expiry, age), but liveness and face similarity are reported by the browser. For high-value loans, a certified identity provider or bank confirmation should be required.
