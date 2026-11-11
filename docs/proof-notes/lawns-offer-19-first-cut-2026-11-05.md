# Lawns offer page $19 first-cut headline check — 2026-11-05 (~1:50s PM ET)

## Verdict: PASS (1 recommended fix; 2 needs-Sisto)

## Hashes (start = end; mode 444)
- index.html 0843a47fbd222c43b0739b34c3f7ede8bdfca63377a8ff1c289b57c4d034af56
- dist/index.html 6988aee774348cc18a60218a52f52ad955a6d1dfea049f0ab0bfb1005be800aa

## Sisto direction (Alexander chat 1c614ab4…)
- User cu:525478510 (Sisto): "offer should be 19 dollars first visit or wow 19 dollars first cut"
- Alexander labeled time: Nov 5, 1:41 PM ET; relayed same quote to Lawns.

## Stripe PI pi_REDACTED (test acct)
- amount 15400, status succeeded, livemode false
- description: "4-visit package $154 (first visit $19, then 3 at $45; recurring only)"
- setup_future_usage: off_session
- receipt_email null; billing_details.email null; metadata.placeholder=false

## Checker
- --test EXIT 0 (expected chrome flags)
- pre-deploy EXIT 0 BUILD_OK
- --deploy EXIT 1 BUILD_FAIL (pk not pk_live_)

## Recommended fix
- :319 payCatchupNote missing "The $19 first-visit package rate does not replace catch-up." (present at :275)

## Needs Sisto
- Zone 2 still pending (page flat $45; Make zone 2 $55)
- Optional awareness: pay defaults to $154 package (Lawns UI call matching headline)
