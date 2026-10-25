# Scoring engine

How Trustline turns verified facts into a score, a band, a suggested repayment limit and a suggestion for the bank officer. Code: [`lib/beta/score.ts`](../lib/beta/score.ts) (score), [`lib/beta/decision.ts`](../lib/beta/decision.ts) (suggestion), [`lib/beta/reconcile.ts`](../lib/beta/reconcile.ts) (which payments count).

## Principles

- **Only proven facts.** Income comes from signature-verified payment emails, Wise, the blockchain and the bank. Work comes from the design tools' own servers. Bank-statement uploads are labelled and shown separately to the officer.
- **Deterministic and explainable.** It's a points scorecard, not a black box: the same facts and date always give the same score, and every point is shown to the freelancer and the officer as a plain-language reason.
- **Money first, but income must be explained by work.** Most of the weight is ability to pay. Income that no real design work explains is treated as a fraud signal.
- **AI never scores and never decides.** Claude only reads payment emails and writes the officer's explanation from these numbers. A person makes every decision.

## Before scoring: which payments count

`reconcile.ts` looks at all payments from every source together:

- the same payment seen twice (an Upwork email and the bank deposit) counts once;
- a payout from a platform (Upwork → bank, PayPal → bank, exchange → wallet) counts where the client paid, not twice;
- transfers between the freelancer's own wallets, top-ups and tiny spam transfers never count;
- currencies are converted to USD at fixed approximate rates (override with `FX_<CODE>_USD`).

## The score

The score starts at **500**. Each factor adds or removes points, the total is clamped to **300–850**, and a band is assigned. Most factors scale linearly between two anchors and stay flat outside them.

| Factor | What it measures | Points (worst → best) | Anchors |
|---|---|---|---|
| Verified monthly income | Median of the last 6 complete months, proven payments only | −10 → **+80** (−60 at $0) | $300 → $3,000, on a log scale (each doubling earns the same) |
| Months with income | Paid months out of the last 12 | −40 → **+70** | 3 → 12 months |
| Income stability | Coefficient of variation of monthly income | −40 → **+60** | CV 1.2 → 0.2 |
| Design work evidence | Weeks with real edits in the last 12 (comments and portfolio shots don't count) | −10 → **+50**; −30 with no work tool | 2 → 10 weeks |
| Track record | Months since the first proven payment or work | 0 → **+40** | 3 → 24 months |
| Work matches income | Share of paid months that also show design work | −20 → **+40** | 30% → 90% |
| Clients seen in work and payments | Same client paying and collaborating in files or boards | +10 → **+30** | 1 → 3 clients |
| Client spread | Number of distinct payers | −10 / +10 / **+25**; −10 more if one payer is over 85% | 1 / 2 / 3+ |
| Identity confirmed by bank | Open banking returned the account holder's name | **+20** | |
| ID verified | Passport or ID card, check digits, liveness, face match | **+20** (+10 when the bank already confirmed) | |

### Where the weight sits

Of the **+425** points available:

| Group | Factors | Points | Share |
|---|---|---|---|
| Ability to pay | income, months with income, stability, client spread | 235 | 55% |
| Real work behind the income | work evidence, work matches income, clients in both | 120 | 28% |
| Track record | track record | 40 | 9% |
| Identity | bank, ID | 30 | 7% |

### Risk flags

| Flag | Rule | Severity | Effect |
|---|---|---|---|
| Name doesn't match | A money account's holder name differs from the verified ID | High | Score capped at 599 |
| Income without design work | At least 3 paid months, and under 30% of them show any work | High | Score capped at 599 |
| Sudden income jump | Last month is over $1,000 and over 3× the median of the 6 months before (with at least 3 of those paid) | Medium | −40 points |

### Bands, repayment limit and suggestion

| Band | Score |
|---|---|
| A | 740–850 |
| B | 670–739 |
| C | 600–669 |
| D | 530–599 |
| E | 300–529 |

- **Suggested maximum monthly repayment:** 30% of verified monthly income.
- **Suggestion to the officer** (`decision.ts`): any flag → manual review; band A or B → approve; C → manual review; D or E → decline. The officer sees the reasons behind it and decides.

## Example: the demo applicant

Nino Beridze (synthetic) has verified income of $2,967 a month, was paid in 11 of the last 12 months, has 6 payers with the largest at 59%, shows design work in Figma every week, and is confirmed by her bank. She scores **843, band A**, with a suggested limit of **$890 a month** and the suggestion "approve". Her report shows each of these as a reason with its points.

## Limitations and next steps

The weights are expert judgement, set from how lenders assess income stability, concentration and history. They are not learned from repayment data yet, because Trustline has none. The structure is built to change that.

**After the demo stage, the model will be co-created with partner banks.** Their credit teams set the policy (risk appetite, band cut-offs, repayment limits, which flags block a loan), and their repayment data calibrates the weights. Trustline keeps doing the collecting, verifying and explaining; the bank owns the credit policy and the decision.

1. **Calibrate on outcomes with partner banks.** Once loans repay or default, fit a logistic regression on the same features and express it in standard scorecard form (points to double the odds), so each factor's weight reflects real risk.
2. **Use the whole range.** The best case adds up to 925 and is clamped to 850, so strong profiles bunch near the top. Rescaling the points would separate good from excellent.
3. **Repayment limit by risk and existing debt.** Replace the flat 30% with a share that depends on the band, minus obligations visible in the bank statement (loans, rent).
4. **Count gaps once.** Months without income currently lower both "months with income" and "stability". Measuring stability on paid months only removes the overlap.
5. **Require identity.** A report without a confirmed identity can still score high today. It should be capped or sent to manual review.
6. **Fix a message.** The "income without design work" flag always names Figma, even when the work comes from Canva, Webflow or Miro.
