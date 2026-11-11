> Recheck Nov 8, 2026, ~2:24 PM ET: PASS as internal market research on revised files
> scan sha `d301f0b0518a97fb24b3ad0af14e6f0ee3683a0865b6003104dd920adf18adc2`,
> packet sha `049b103fd4a79ce59e7496f58a1fa2eb1d5ca48124f4d037006878622d842403`.
> Notes: `/workspace/proof-notes/lawns-area-offers-scan-recheck-2026-11-08.md`.
> The FAIL below applies to the prior scan hash `1f7c0048…b0438` only.

# Proof source check — Broward area-offers scan

## Verdict: FAIL — one required attribution correction
Reviewed November 8, 2026, approximately 2:20–2:25 PM EST (America/New_York).
Read-only with respect to the scan, packet, accounts and external services. No messages sent, forms submitted, bookings, payments, or live changes. Only these proof notes and public-source archives were written.

Scan: `/workspace/playbooks/lawns-area-offers-scan-2026-11-07.md`
SHA256: `1f7c0048841ccb7a559e30593c1c8983bff6b7b7173b9a3f189d414d048b0438`
Expected prefix `1f7c0048`: matches.
Packet: `/workspace/proof-notes/lawns-area-offers-scan-check-request-2026-11-07.md`
SHA256: `4905337c39dfc3bf4f83f8e27bda2c293b501e9dee24a4dfffcc4318c4d9b4d7`
Expected `4905337c…b4d7`: matches.

All advertised competitor numbers, substantive quoted wording, service features and service-area assertions checked below agree with the public pages returned on this review. No substantive competitor quote mismatch found. FAIL is for the unqualified internal renewal assertion, not an invented competitor price. This verdict does not certify actual service availability or offer eligibility, source freshness, or the companies’ underlying statistical calculations.

## Required copy-paste replacement
Scan line 44, replace only:
> Renewal remains $139;

with:
> Renewal after four visits: Alexander reported a November 5 card reading “10% off ($139)”; Proof has not independently seen that card or verified the renewal amount.

The request packet repeats unqualified “$139 renewal” at line 118; it has the same attribution limitation. It is not independent supporting evidence. If the packet is reused, replace that phrase with:
> $139 renewal after four visits, Alexander-reported from the November 5 “10% off ($139)” card; not independently seen by Proof

No scan or packet edits made. Corrected copy must receive a new hash; this FAIL applies to the hash above.

## Method and HTTP / blocking record
Read scan and packet before source accesses; extracted all 15 unique cited URLs. Each was independently requested with WebFetch and ordinary public `curl -L --max-time 50 -A Mozilla/5.0`. No authentication or private app access used. WebFetch may return cached content and does not expose HTTP status; its successful readable return is not silently treated as a measured HTTP 200. Curl gives the explicit statuses below. User computer is offline; accesses used the box/fetch-provider networks, not the user's computer.

Archive: `/workspace/proof-notes/lawns-area-offers-live-2026-11-08/`. `manifest.json` records exact per-request EST timestamps, URLs, statuses and errors; `NN.headers`, `NN.html`, `NN.txt` preserve curl evidence. Requests started November 8, 2026 at 2:21:09–2:21:10 PM EST. All curl processes exited 0; an HTTP block still counts as a block. WebFetch returned readable page text for every cited URL in this review, including the three blocked curl accesses. Those three comparisons therefore rely on WebFetch rather than on their curl block-page archives. No unresolved JS-only, missing-page or access failure remained for the claims below.

|Archive ID|Source|Curl HTTP|WebFetch / block assessment|
|---|---|---|---|
|01|Quality|200|Readable; not blocked|
|02|Evergreen|403|Curl blocked; WebFetch readable; provider-specific block|
|03|LawnGuru|200|WebFetch also readable; earlier Nov 7 WebFetch 403 not reproduced|
|04|LawnStarter|200|Readable; not blocked|
|05|GreenPal|200|Readable; not blocked|
|06|Lawn Bros packages|406|Curl blocked; WebFetch readable|
|07|Lawn Bros homepage|406|Curl blocked; WebFetch readable|
|08|Mott's|200|Readable; not blocked|
|09|TruGreen southern|200|Readable; not blocked|
|10|TruGreen local|200|Readable; not blocked|
|11|Lawn Love|200|Readable; not blocked|
|12|Send Me a Pro|200|Readable; not blocked|
|13|Premium|200|Readable; not blocked|
|14|Angler|200|Readable; not blocked|
|15|Land-clearing candidate|200|Readable; not blocked|

The scan's Nov 7 access/failure statements are historical reports, not descriptions of today's requests. Without the original tool history they cannot be independently certified, except that the saved LawnGuru evidence exists and matches its quoted claims. Do not overwrite Nov 7 provenance with today's statuses.

## Per-claim comparisons
“Confirmed” means wording was observed, not that the advertiser's service or claimed savings were independently tested. Negative findings (“no expiry seen”, etc.) are bounded to returned page text. Confidence: High for direct curl + WebFetch concordance; Medium-high for WebFetch-only readable evidence where curl blocked; Medium for absence-based findings.

### 1. Quality Lawncare — Confirmed
URL: https://qualitylawncareandservice.com/lawn-care-pompano-beach
- **Confirmed, High:** 50% first-cut discount. Live: “Call us at (954) 520-6387 to schedule our services and get 50% off your first lawn cut!” Scan's shorter quotation is exact.
- **Confirmed, High:** Pompano Beach and surrounding Broward County. Live: “serves all neighborhoods and communities throughout Pompano Beach and the surrounding Broward County area”; “Proudly extending our dedicated service area down to McNabb Road”.
- **Confirmed, High:** mowing, edging, blowing. Live: “Regular mowing, edging, and blowing”.
- **Confirmed, Medium:** no base cut amount, computed dollar saving, minimum commitment, expiry, or priced multi-visit package in returned text. No invented term.

### 2. Evergreen — Confirmed
URL: https://www.evergreenpc.com/fort-lauderdale-broward-county/oakland-park/
- **Confirmed, Medium-high:** live heading “Proudly Serving The Oakland Park Area $50 Off Any New Pest or Lawn Agreement”. Scan treats this as discount, not a $50 total or a mowing offer.
- **Confirmed, Medium-high:** area text: “a trusted name in Oakland Park and throughout Broward County”.
- **Confirmed, Medium-high:** treatment context: “develop a personalized treatment plan that keeps your lawn vibrant and your property protected”. Mowing is not established.
- **Confirmed, Medium:** no underlying agreement price or expiration in returned text. Curl's 403 does not negate the readable WebFetch result.

### 3. LawnGuru — Confirmed in both saved snapshot and new accesses
URL: https://lawnguru.co/cities/oakland-park-fl/lawn-mowing
- **Confirmed, High:** “Trusted Lawn Mowing in Oakland Park, FL Starting at $38”.
- **Confirmed, High:** “$15 Off Recurring Mowing Service! Use code: MOW15”; “Receive three $5 credits at checkout. Credits will automatically be applied before each service!” Three credits, not $15 off one cut.
- **Confirmed, High:** “Lawn mowing in Oakland Park starts at $38 per cut, with rates varying up to $46 based on lawn size and service frequency.”
- **Confirmed, High:** “Price Range: $38.18 - $46.20”; “Average Price: $42.19”. Live paragraph: “the average customer in Oakland Park pays just $42.19 per cut, which includes lawn mowing, weed whipping, blowing, and edging.”
- **Confirmed, Medium:** no expiration in returned text; no property quote obtained. Headline rounded values and exact FAQ values are properly distinguished.
- **Confirmed, High:** Nov 7 saved `.txt` and `.html` both exist. Saved text contains every price, credit, code and inclusion above. Saved snapshot date says November 7; current returned page says November 8. No relevant offer/price drift observed. Snapshot hashes are recorded below.

### 4. LawnStarter — Confirmed
URL: https://www.lawnstarter.com/fort-lauderdale-fl-lawn-care
- **Confirmed, High:** “Fort Lauderdale, FL lawn care service starting at $19”; “Enter Your Address→ See Your Exact Price”.
- **Confirmed, High:** local ZIP list is present, including 33301 through various Fort Lauderdale-area ZIPs; no assertion that every ZIP in that list is a Lawns service zone.
- **Confirmed, Medium:** no fetched text establishes $19 as first-visit-only, universal recurring price, a four-visit bundle, or a Black Friday promotion. Scan rightly avoids those inferences.

### 5. GreenPal — Confirmed, including internal inconsistency
URL: https://www.yourgreenpal.com/local/lawn-care-oakland-park-fl
- **Confirmed, High:** “Avg $33/cut”; “$33 /mow Estimated Price for Oakland Park, FL: Based on average lawn size, every week mowing”.
- **Confirmed, High:** “Weekly customers save up to 30%”. Baseline needed to verify actual saving is not supplied; scan labels this a platform claim, not a calculated saving.
- **Confirmed, High:** “One-Time Cuts”; “Perfect for those in need of weekly, bi-weekly or monthly cuts.”
- **Confirmed, High:** contradictory FAQ figure: “Average weekly mowing ranges from $40–$70 for a standard yard.” Scan discloses inconsistency and adopts neither as an independent market mean.
- **Confirmed, High:** nearby-area quote “plus nearby Fort Lauderdale, Wilton Manors, and Lauderdale-by-the-Sea.”
- **Confirmed, Medium:** no guaranteed property bid established. Vendor blurbs and individual historic job figures are not promoted into independent company offers.

### 6. Lawn Bros — Confirmed; ambiguous billing correctly retained
URLs: https://lawnbrosflorida.com/residential-lawn-service-packages ; https://lawnbrosflorida.com/
- **Confirmed, Medium-high:** package page “$ 175.00” / “Platinum Package”; “$ 135.00” / “Gold Package”; “$ 115.00” / “Silver Package”; fourth amount “$ 85.00” without extracted tier heading. The report prudently uses “$85 tier”; the historical search-result name Bronze is not independently reverified here and must remain search-only, not a confirmed tier name.
- **Confirmed, Medium-high:** first three say “Lawn mowing service every 10 days”; fourth says “Lawn mowing service every 14 days”.
- **Confirmed, Medium-high:** each lists “Edge along walkways, trees etc”, “Trim hedges within property”, “Weed whacking”, “Weed control garden bed areas”, “Clean-up after work is completed”.
- **Confirmed, Medium-high:** Gold and Platinum each list “Fertilize lawn area (3x annually)” and “Fertilize shrubs (3x annually)”. Platinum lists “Monthly Irrigation check and repairs”; Gold, Silver and fourth tier list “Monthly site Inspection”.
- **Confirmed, Medium:** no billing period or lawn-size limit in returned package page. No justified per-month or per-cut conversion.
- **Confirmed, Medium-high:** homepage says “based in Coral Springs” and “residential and commercial services to Broward and Palm Beach Counties”.
- **Confirmed, Medium-high:** homepage contradictory excerpt “PLATINUM: Lawn mowing service every 20 days (3 visits mthly)”. Scan reproduces it rather than resolving it by invention.
- **Confirmed, Medium-high:** homepage “Save 20%”; no associated qualifying scope, dates or baseline established. Scan properly rejects a usable-deal interpretation.

### 7. Mott's Tree Services — Confirmed
URL: https://mott-s-tree-services.ueniweb.com/services
- **Confirmed, High:** title “Mott's Tree Services - Landscaping Services | Pompano Beach”. Hosted storefront does not independently establish full service boundaries.
- **Confirmed, High:** “Prices”; “Bi-weekly And Weekly Payment”; “Small Lawn Cutting $25.00”; “Small Medium Lawn Cutting $30.00”; “Medium Lawn Cutting $35.00”; “Large Lawn Cutting $40.00”; “Big Yard Lawn Cutting $45.00”. All five numbers and size labels match.
- **Confirmed, Medium:** size dimensions and per-cut versus installment unit are not defined. Scan does not equate “Small” to the Lawns 5,000 sq ft cap.
- **Confirmed, High:** “Prepare your outdoor space for the changing seasons with Mott's Tree Services' spring and fall cleanup services.” No discount stated in this service description.

### 8. TruGreen — Confirmed; treatment versus mowing distinguished
URLs: https://www.trugreen.com/agronomic-region/southern ; https://www.trugreen.com/local-lawn-care/florida/pembroke-pines
- **Confirmed, High:** “Special price of 50% off is for first Lawn application★, Tree & Shrub application✢, and/or Mosquito application★★ only. All other restrictions apply.” Scan uses an ellipsis, not a false verbatim full sentence.
- **Confirmed, High:** lawn footnote: “Requires purchase of annual plan. Special price is for first application only. Valid at participating TruGreen locations. Availability of services may vary by geography. Not to be combined with or used in conjunction with any other offer or discount.”
- **Confirmed, High:** local page: “TruGreen Ft Lauderdale services the following communities: Fort Lauderdale, Hallandale, Hialeah, Hollywood, Homestead, Key Biscayne, Miami, Miami Beach, Miami Gardens, North Miami Beach, Opa Locka, and Pembroke Pines.” The scan's named subset is correct; this does not create any Lawns Homestead offer.
- **Confirmed, Medium:** the cited promotion does not establish local branch participation or property eligibility, base lawn-treatment dollar total or visit count. Other pest-service footnotes have dollar amounts, but these are not a base dollar amount for the lawn offer and must not be substituted.
- **Confirmed, High:** treatment/fertilization/weed-control plan context, not mowing package.

### 9. Lawn Love — Confirmed
URL: https://lawnlove.com/florida/fort-lauderdale-lawn-care
- **Confirmed, High:** table “Average mowing price | $56”.
- **Confirmed, High:** “Enter your address, choose your service, and we’ll give you an instant price.”
- **Confirmed, High:** “Lawn Love's local pros mow lawns in Plantation, Coral Springs, Davie, Weston, and all Broward County communities.”
- **Confirmed, Medium:** no $29 starting figure, fixed multi-visit package or first-cut promotion found in returned local page text. Scan explicitly excludes search-only $29 rather than using it as price evidence. Original search synthesis not independently available.

### 10. Send Me a Pro — Confirmed
URL: https://downtownfortlauderdale.sendmeapro.com/lawn-care/
- **Confirmed, High:** title “Lawn Care - Send Me a Pro Downtown Fort Lauderdale”. Matching/franchise description supported by matching-coordinator and franchising FAQ text; wider area boundaries not specified.
- **Confirmed, High:** “You can choose to schedule mowing on a weekly basis to maintain a well-groomed lawn throughout the year. Alternatively, we offer discounted annual scheduling options for added convenience and savings.” Scan's quoted phrase matches.
- **Confirmed, Medium:** no numeric annual discount, visit count or total in that offer text.
- **Confirmed, High:** “Minimum of $125 per job” appears repeatedly near Residential Cleaning, Power Washing and other forms. **Can't verify:** whether it applies to lawn work. Scan correctly excludes it rather than asserting a lawn minimum.

### 11. Premium Lawn Care — Confirmed
URL: https://premiumlawncarellc.com/lawn-mowing/
- **Confirmed, High:** opening names Fort Lauderdale; “throughout Broward County, including Plantation, Sunrise, Lauderhill, Lauderdale Lakes, West Park, and Wilton Manors”.
- **Confirmed, High:** “one time lawn mowing services”; “choose bi-weekly lawn mowing package during slower winter growth or weekly lawn mowing service through the explosive summer season”; FAQ “weekly, bi-weekly, or custom schedules”.
- **Confirmed, High:** “After every visit, we blow clippings off driveways and walkways”; “Post-Mow Cleanup”.
- **Confirmed, Medium:** no numeric mowing tariff or promo found in returned page. A seasonal schedule/cleanup is not evidence of a seasonal sale.

### 12. Angler — Confirmed
URL: https://anglerlawn.com/2026/04/13/monthly-lawn-care-in-fort-lauderdale-what-to-budget-and-what-you-get/
- **Confirmed, High:** “Here’s a realistic breakdown of what Fort Lauderdale homeowners can expect to pay in 2026”. General market-guide framing, not explicitly Angler's price list.
- **Confirmed, High:** “Angler Lawn serves Fort Lauderdale and all of Broward County with flexible monthly plans tailored to your yard and your budget. Get a free estimate”; footer Wilton Manors address.
- **Confirmed, Medium:** company-specific tariff or promo not established. Guide tier numbers are correctly excluded from the scan's offer prices; no invented Angler quote.

### Rejected Black Friday candidate — Confirmed rejection
URL: https://fortlauderdalelandclearingservice.com/land-clearing-black-friday-deals
- **Confirmed, High:** title “Land Clearing Black Friday Deals for Commercial Projects | Fort Lauderdale Land Clearing Service”.
- **Confirmed, High:** “It is a good idea to ask contractors about holiday discounts or Black Friday promotions to maximize savings on land clearing projects.” The scan quotes an exact shorter substring ending at “promotions”.
- **Confirmed, Medium:** no specified company discount, price, service bundle, dated 2026 offer or running window established. Generic advice is not a verified deal.
- **Confirmed, High:** static “Thank You. Your request has been received.” text is in the fetched page. No form submitted by this checker; static content is not submission evidence.

## Internal controls, arithmetic, scope and search claims
- **Confirmed against task controls, High:** standard $45, small bi-weekly yard up to 5,000 sq ft; $19 + 3 × $45 = $154 exactly; four visits; $45 + $10 = $55 zone-2 per visit; scan preserves $154 package across zones rather than incorrectly adding the trip fee to it. Listed zone-2 ZIPs match supplied controls: 33301, 33304, 33305, 33306, 33308, 33313, 33316. These are supplied internal controls, not facts verified from competitor URLs.
- **Wrong evidence status, High:** “Renewal remains $139” omits required Alexander-reported / not independently seen qualification. Required replacement above. The report does not itself print “10% off”, but that phrase belongs inside attribution if included; 10% off $154 is $138.60, not exactly $139. Do not independently assert exact 10% arithmetic or alter the reported card amount.
- **Can't verify independently, Medium:** no splitting, catch-up fee separate, unused visits account credit rather than refunds, and rewards/seasonal details unset are internal context supplied by the packet, not publicly source-checked policy. This check does not approve or change those terms; no contradiction of the locked numeric controls was found.
- **Confirmed, High:** scan is labeled internal market research, not live/public offer copy. It excludes homestead/permaculture work and invents no Lawns homestead package, deliverable or service expansion. Competitor inclusion of Homestead in a service-area quotation is not a Lawns offer.
- **Confirmed arithmetic, High:** 3 × $5 = $15; LawnGuru FAQ midpoint ($38.18 + $46.20) / 2 = $42.19. The page itself publishes this average; an underlying customer-weighted statistical mean cannot be validated without data. Rounded $38–$46 and exact $38.18–$46.20 remain distinct. No cross-company market average calculated or invented.
- **Confirmed counts, High:** 12 main companies/platforms; 9 numeric rows (1–9), one unquantified discount (10), one no-price/no-promo provider (11), one market guide (12); one additional rejected candidate; 15 unique source URLs. Count does not mean 12 actual quotes or 12 eligible offers.
- **Confirmed caution, High:** Lawn Bros' “every 20 days (3 visits mthly)” is internally inconsistent; every 20 days is not three monthly visits. GreenPal's $33 estimate versus $40–$70 FAQ is also flagged rather than reconciled. Percent saving banners lack enough baseline information for independent dollar savings. No “save $X” calculation is fabricated.
- **Partly right / bounded, Medium:** no verified dated 2026 Black Friday/seasonal discount is visible in the cited source set. Cannot prove absence across the entire market; scan expressly disclaims that. Discount freshness, availability and eligibility remain unconfirmed.
- **Can't verify retrospectively:** the exact Nov 7 query-result lists, search snippets (“Bronze”, $29, additional LawnGuru city page), and historical tool statuses other than the saved LawnGuru snapshot cannot be reconstructed from scan + packet alone. They are labeled historical/search-only and are not used as verified prices. No new search run can prove what a prior search returned. No measured trend, Google Trends volume, demand growth or market-wide ranking is asserted.
- **Confirmed wording:** scan's comparison does not claim unique $19 hook or a competitor-equivalent four-visit package; it recommends no price/policy changes and requests no new Sisto decision.

## Saved snapshot integrity
- `lawnguru-oakland-park-fetch-2026-11-07.html`: `469e64e7da0c3d0055900479129665fa183b6d7b20c30bb762b5483f2ab2bec8`
- `lawnguru-oakland-park-fetch-2026-11-07.txt`: `3806ae20d1aa4c618d9aaa904472d6f75c83b742e83ebf702b39345317ed296b`

## Release rule
FAIL until the single scan renewal-attribution replacement is applied and the changed file is rehashed/reviewed. No competitor advertised price or feature replacement is required based on this source check. Do not treat this report as live-offer approval or independent verification of Lawns renewal policy. No messages sent; parent receives this local verdict only.
