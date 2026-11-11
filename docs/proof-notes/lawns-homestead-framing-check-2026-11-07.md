> Recheck Nov 8, 2026, ~2:22 PM ET: PASS as an INTERNAL draft on revised files
> draft sha `a8f83bbe89e0b079e3d1ed76c101feaa47420f14947a2d8680685a7b5842ccad`,
> packet sha `f8596130c718461a9283039cfe2ae90e487f2f67e2b0b29de5afdef194199b3b`.
> Notes: `/workspace/proof-notes/lawns-homestead-framing-recheck-2026-11-08.md`.
> The FAIL below applies to the prior hashes only.

# Proof source-check — INTERNAL homestead-process framing

Reviewed Nov 7, 2026, approximately 3:46 PM EST (America/New_York).

## Overall verdict: FAIL — attribution and escalation fixes required

The substantive INTERNAL framing is sound: it keeps the acre model separate from the small-yard mowing offer, adopts no homestead construction/animal services, invents no homestead rate, and explicitly gates unresolved code/parcel/site questions. This is NOT approval of a homestead design, site conditions, public copy, new services, money, or any external action.

Required fixes: (R1) label the $139 renewal as Alexander-reported rather than independently verified/normal locked pricing; (R2) remove the claim that Proof has Sisto's own zone-2 words when only Alexander's report of the card is visible; (R3) do not send the three generic §10 questions as current decisions—two are premature, and the public-action default is already settled. None requires reopening the zone-2 mowing decision.

## 1. Frozen inputs and scope

| Input | Path | SHA256 |
|---|---|---|
| Packet | `/workspace/proof-notes/lawns-homestead-framing-check-request-2026-11-07.md` | `867d5588fc626949dab27f287ddbb0a981c04a8d5df85bce8d32d5db0d416559` |
| Draft | `/workspace/playbooks/lawns-homestead-process-framing-draft-2026-11-07.md` | `e66697c0b49ec672c03c044aad31817b95bbfeddb46bd14c44f5f60695620f04` |
| Sisto paste transcription | `/workspace/playbooks/sisto-oakland-park-homestead-plan-nov7-2026.md` | `41068f4e6d7758ad74676a2c9d44ab1d0a7e456f6c276817141391a4c8abf762` |

All three hashes were unchanged at the final pre-note check. Line numbers below refer to these versions.

Read all three inputs, the booking/payment playbook, prior Proof flow notes, relevant launch-plan price lines, and every source text in the downloaded directory. Inventory:
- `broward-geology.pdf` and `broward-geology.txt` (707 lines)
- `ifas-calendar.pdf` and `ifas-calendar.txt` (746 lines)
- `nws-rain.pdf` and `nws-rain.txt` (140 lines)

PDF content was read through its full pdftotext conversion. Independently downloaded the same three official PDFs to `/workspace/proof-notes/homestead-proof-live-2026-11-07/`; both the PDFs' hashes and fresh pdftotext outputs match Lawns' copies exactly. This checks the packet's evidence against currently retrievable official documents, not merely copied notes. These are respectively a 2012 study, 2024-revised calendar, and 2025 document's climatology—not newly measured 2026 parcel conditions.

No offer HTML was opened or rechecked. No source draft/packet/playbook edited. No Make, Stripe, calendar, CRM, website, deployment, messages, or contacts used. Only local research evidence and this note were written. Nothing in the reviewed files indicates a homestead publish; no independent live/deployment audit was conducted or implied.

## 2. Sisto provenance — direct user text versus agents' reports

### Homestead request: VERIFIED exact closing words

Alexander transcript `1c614ab4-ace0-4385-ba31-84616423eec7`, position 776, role **user**, speaker `cu:525478510`, contains the one-acre plan and ends:

> this is what im trying to frame in my process with Lawns by timmy

This supports draft L7 and packet L125; it is not merely Alexander/Lawns paraphrasing Sisto. The original user message's opening is `Site plan · 1 acre · Oakland Park, FL · zone 10b · north is up` and its visible end contains the same rain/topsoil/pond/fruit/animal/legal caveats as the paste file. The local file reformats the pasted interface text into headings/bullets and separates the final instruction into its header; it is not byte-for-byte original formatting. The transcript tool itself elides a middle stretch (`The steady breeze come...quick harvests.`), even with a one-message/file result, so a complete word-for-word comparison of that omitted stretch is NOT established. The visible beginning/end and final instruction match substantively. Draft L7 can stand; do not call the entire local file independently verified verbatim original text.

Lawns transcript position 75 contains Alexander's relay of the same request; it corroborates but is not the primary source for the exact closing quote.

### Zone 2: REPORTED CARD DECISION, not independently visible typed user/card text

Alexander transcript positions 794–795 contain his acknowledgement and his report:

> Sisto answered the zone 2 question on Sat Nov 7, 2026, in his own words via the card: "Show $55 per visit in those Fort Lauderdale ZIPs, keep the $154 package everywhere, and add that some ZIPs add a $10 trip fee to per-visit service."

At position 795 Alexander also specifies ZIPs 33301, 33304, 33305, 33306, 33308, 33313, 33316 and proposed display text:

> Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service.

Lawns transcript positions 86 and 88 repeat this report. The searchable/readable context contains NO intervening Sisto user message or card-answer object carrying that selection. Consequently: **Alexander-reported Sisto card selection; the underlying card itself is not independently verified here.** Agreement by another bot is not a second primary source.

For this check, use that reported decision as the current internal mowing direction; **do not reopen it or escalate it as a homestead question**. Draft L19 contains the corrected $55/$154/trip-fee direction. L164 expressly says it is NOT asked here and distinguishes mowing service zones from permaculture zones. Packet L363 also says decided. PASS on the correction, FAIL only on overconfident source attribution (R2).

### $139: renewal context supported, direct amount selection NOT independently verified

Direct user text in Alexander's transcript near positions 605–608:

> offer renewl with a discount rewards system a seasonal promotion of the time its in

Alexander then says renewing gets 10% off/$139. At position 615 he tells Proof the customer renews **after visit 4** and says Sisto picked `10% off ($139)` at approximately 12:46–12:47 PM EST Nov 5. The card pick itself is absent from the readable user messages. This matches Proof's supplied journal limitation, not independent confirmation of $139.

Draft L17 says renew, not initial package; L109 also says renewal. Thus it does NOT turn $139 into the initial package, but `Renew ... for $139` / `normal $139` lacks the necessary reported-source qualification. Older Proof notes `/workspace/proof-notes/lawns-quote-to-paid-complete-flow-2026-11-05.md` L44/L52 call it factual; those prior labels do not cure missing primary provenance. Use R1 instead of relying on circular team corroboration.

Better-established base: Alexander transcript position 593, direct user: `45 for up to 5000 square feet`; position 609 direct user: `small yard is 45`. Existing booking/payment playbook L9/L93–97 gives $154 = $19 + 3 × $45, bi-weekly only, no split/standalone $19 cut. Nothing here changes that initial package.

## 3. Items 1–5: structured verdicts

| Item | Verdict | Draft support / qualification |
|---|---|---|
| 1. Public-fact handling | PASS for INTERNAL, explicitly qualified use; a/e remain unresolved | F2–F13, L68–92. Detailed facts below. No legal/site/design clearance. |
| 2. No new package/prices/promises or changed small-yard offer | PASS on business boundaries; FAIL on pricing provenance pending R1/R2 | L3, L11–25, L31–33, L55–66, L109, L115–117. $139 is renewal, never initial; label source limitation. No homestead rate. |
| 3. Scale tension | PASS | L29: 43,560 / 5,000 = 8.712, correctly rounded to 8.7×. L31 explicitly excludes interpreting $19/$154 as an acre homestead offer; L33 holds eligibility/scope. |
| 4. Model ideas versus services | PASS | L9, L64–66, L96–103, L115–117. Food forests, animals, ponds, coops, cisterns, beds and shade houses are owner ideas/specialist topics, not offered services. |
| 5. Site-specific assumptions not generalized | PASS | L43, L49, L60–62, L70–74, L90, L127–128. Eight-inch topsoil, breeze, pond/groundwater and exact plant lists remain unverified model ideas. |

Internal-only labels PASS: title L1, L3 `NOT PUBLIC COPY. NOT LIVE`, walk wording L51 `not sent`, no-go-live path L111–117, and L166. No file evidence of a live homestead publish. This is evidence of local-document intent, not a current audit of external systems.

## 4. Public facts: exact findings and primary sources

Verdicts distinguish the PASTE's claim from whether the DRAFT handles it accurately.

### (a) Animals/birds — PARTLY RIGHT / current full official reconciliation still unverified; draft PASS with gates

Retried official Municode landing and Chapter 4 node through WebFetch: both returned HTTP 500. Public-page curl fallback for the Chapter 4 node returned HTTP 403. No browser used. Alternate official city page successfully opened:
https://www.oaklandparkfl.gov/188/Common-Violations
It covers dog limits, tree abuse and permit requirements, NOT a complete poultry authorization.

Current official-host search result at:
https://library.municode.com/fl/oakland_park/codes/code_of_ordinances?nodeId=COOR_CH4ANFO_ARTIINGE_S4-4ANBEKEZOONEX
returned actual code excerpts (not just a generated summary):
- §4-8: residential prohibition except household-type pets including `birds (excluding chickens, roosters and geese), rabbits, turtles, iguanas and tropical fish`.
- §4-1(a): live chickens/domesticated fowl/birds only in `chicken houses, sheds, cages or pens especially constructed` for confinement/housing.
- §4-1(c): `No person shall keep, maintain, own, possess or store any live crowing rooster or fowl within the limits of the city.`
- §4-1(d): no unattended roaming except within the housing enclosure.
- §4-2: no unsanitary conditions endangering health/safety and no `noisome odors or noxious gases`.
- §4-4: `any horse, cow, goat, hog, livestock or any other animal, except dogs and cats` barred outside A-1 Agricultural.

Official-host search header says codified through O-2026-012, enacted May 20, 2026 (Supp. 54):
https://library.municode.com/fl/oakland_park/codes/code_of_ordinances
This is **search-index evidence**, not a successful full current-code fetch or confirmation of every later uncodified amendment. One search synthesis incorrectly said chickens are permitted; the quoted §4-8 explicitly excludes them from the residential bird exception, so do NOT adopt that synthesis.

Conclusion: no residential hen permission follows from confinement language. Ducks/Muscovies are not expressly settled by the quoted §4-8 wording; absence from the list is not permission, especially with §4-4. Rabbit-as-pet wording is not approval of breeding/manure/rotation. Actual zoning, code interaction and current enactments require reconciliation before animal purchases/coops. Draft L74 says precisely this and labels mirror/current-code limits. No required factual change; optional add official-index corroboration and continued fetch failure to source key L143/packet S1. A reattempt at the eLaws §4-8 mirror also timed out.

### (b) Broward soil-testing route — CONFIRMED; draft PASS

Opened primary UF/IFAS Help Desk:
https://sfyl.ifas.ufl.edu/broward/urban-horticulture/help-desk/

> We can provide one free Soil Kit, which you pick up at the Extension office. ... register for the UF/IFAS soil testing service and submit your sample. The cost of the service is $34.95.

Draft L68 correctly avoids claiming a free completed analysis or a complete local laboratory test. Contact Extension for correct test/interpretation is appropriate. Paste L132 is reasonable as a referral shorthand, not evidence that a full test is free. The $34.95 is external source detail, NOT a new Lawns price and need not be added to the draft.

### (c) Rainfall and wet-season start — PARTLY RIGHT paste; draft PASS

Opened Florida Climate Center's station table:
https://climatecenter.fsu.edu/products-services/data/1991-2020-normals/ft-lauderdale
It identifies **Fort Lauderdale, Broward, COOP 083163**, **1991–2020**, annual precipitation **68.77 inches**. This is NOT Oakland Park parcel rainfall and NOT automatically the Fort Lauderdale–Hollywood airport normal. Paste L159 `About 60 inches` is 8.77 inches (about 12.8%) below this table. It is not a faithful rounding of 68.77; as a rough unreferenced regional generalization it may be plausible but cannot be treated as this station's or this acre's verified normal. Draft L80 correctly labels the mismatch and does not adopt a precise site total.

Official NWS climatological definition, freshly downloaded with identical bytes to packet PDF:
https://www.weather.gov/media/mfl/news/RainySeasonOutlook2025.pdf

> The South Florida wet season begins on May 15th and ends on October 15th ... 60-70% of the average yearly rainfall ...

Also: transitions may last two weeks or more; nearby locations can have large differences. Used ONLY its definition/climatology, not its 2025 forecast for 2026. UF/IFAS broad `June to October`/winter-spring driest wording is verified in S6 below. Paste's June start is less precise than NWS, not the NWS definition. `Dry` must mean relatively drier, not rain-free: station November normal alone is 4.66 inches. Draft L80 handles all distinctions correctly. An attempted alternate https://www.weather.gov/mfl/rainy_season returned 404; official PDF succeeded.

### (d) Soil/topsoil/water table/pond — regional variability CONFIRMED; model specifics CAN'T VERIFY; draft PASS

Current retrievable official FDOT PDF (July 2012; NRCS-derived regional corridor evidence):
https://fdotwww.blob.core.windows.net/sitefinity/docs/default-source/p-centralbrowardtransitstudy/geological-conditions.pdf?sfvrsn=24d63ae_2
§1.0 lists fine/gravelly sand, limestone substratum, muck, silty clay loam, artificial fill/Udorthents and urban-land complexes. §1.2: `Soil types within the Central Griffin Road Segment vary greatly.` Even the fine-sand description says both `poorly drained` and `rapidly permeable`; permeability is not equivalent to good drainage at a parcel.

Opened primary USGS (Fish 1988):
https://pubs.usgs.gov/publication/wri874034

> The surficial aquifer system, in which an unconfined groundwater flow system exists ...
> Drainage and urban development have greatly altered circulation patterns in east Broward County ...

Neither source establishes the actual acre's topsoil depth, uniform high water table, infiltration, pond filling, slope or groundwater/pond suitability. Eight-inch topsoil, flat layout, groundwater-filled pond and automatic low mounds in paste L72/L86/L160–161 are **unverified site/model claims**, not typical Oakland Park facts. Draft L49/L62/L70/L72/L127 accurately keeps them unverified and does not prescribe excavation. General sand/limestone context also appears in current UF/IFAS S6. No required factual change.

### (e) USDA hardiness zone — exact Oakland Park acre CAN'T VERIFY; draft PASS

Opened official map and instructions:
https://planthardiness.ars.usda.gov/
https://planthardiness.ars.usda.gov/pages/how-to-use-the-maps

> average annual extreme minimum winter temperature ... 10-degree F zones and 5-degree F half zones.
> Zones in this edition ... are based on 1991-2020 weather data.

Downloaded/viewed official Florida map through its official downloads page:
https://planthardiness.ars.usda.gov/pages/map-downloads
https://planthardiness.ars.usda.gov/system/files/FL300_HS.png

Official legend: **10b = 35–40°F; 11a = 40–45°F**. State map shows both zones in the broader southeastern/coastal Broward vicinity. It is not an Oakland Park municipal boundary or parcel lookup and cannot locate this unidentified acre. No address/coordinate provided. Do not infer a precise parcel zone from city name, state-map scale, or a generic ZIP.

Opened third-party page:
https://www.plantmaps.com/hardiness-zones-for-oakland-park-florida
It says Oakland Park spans 10b and 11a but displays `10b (35°F to 30°F)` and `11a (40°F to 35°F)`—not the correct USDA half-zone bands. **11a is a real official zone in the region, but this third-party city listing is not official confirmation of Oakland Park's exact boundaries/acre zone.** USDA does not supply an opened textual city-wide listing here. Paste L9/L158 single 10b remains unverified for this acre; draft L90 correctly says unresolved rather than changing it to 11a. Zones measure extreme minima, not chill hours or proof a particular fruit will set.

### (f) FS 604.71 — CONFIRMED limited protection; draft PASS

Opened **2026 Florida Statutes** on official Legislature site:
https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0604/Sections/0604.71.html

(2):
> Except as otherwise provided by law, a county, municipality, or other political subdivision of this state may not regulate vegetable gardens on residential properties. Any such local ordinance or regulation regulating vegetable gardens on residential properties is void and unenforceable.

(3):
> This section does not preclude the adoption of a local ordinance or regulation of a general nature that does not specifically regulate vegetable gardens, including, but not limited to, regulations and ordinances relating to water use during drought conditions, fertilizer use, or control of invasive species.

(4):
> ... a plot of ground where herbs, fruits, flowers, or vegetables are cultivated for human ingestion.

Private HOA covenants are not declared void by this language; animal/structure/pond permissions do not follow. UF/IFAS separately says check HOA bylaws and regulations before produce sales/cottage processing:
https://gardeningsolutions.ifas.ufl.edu/plants/edibles/garden-policy/
Do not replace the statute with that page's narrower family-food paraphrase. Draft L76 correctly distinguishes statutory actors, general rules and non-approvals. Paste L163 is incomplete shorthand, not a blanket homestead entitlement.

### (g) Hurricane dates — CONFIRMED; draft PASS

Opened NOAA/NHC:
https://www.nhc.noaa.gov/climo/

> The Atlantic hurricane season runs from June 1 to November 30.
> The peak ... is September 10, with most activity occurring between mid-August and mid-October.

NHC also says activity sometimes occurs outside the season. Draft L86 accurate. Paste July–September preparation block is too late if read as the time to START; draft L86/L100 explicitly requires earlier assessment.

Opened UF/IFAS:
https://gardeningsolutions.ifas.ufl.edu/plants/trees-and-shrubs/trees/preparing-trees-for-hurricanes/
Supports site-matched wind-resistant trees, rooting space, structural pruning, certified-arborist review for large trees, and hiring one for pruning trees over about 15 feet before season. Draft L58/L86 does not claim Timmy's certification or hurricane-proof results. City common-violations page also prohibits hatracking/more than 50% foliage removal; the draft appropriately rejects blanket topping.

### (h) Vegetable/tree windows, mulch and irrigation — PARTLY RIGHT paste; draft PASS

Opened UF/IFAS new-residents guide:
https://gardeningsolutions.ifas.ufl.edu/care/florida-friendly/florida-gardening-for-new-residents/
South Florida northern-style crops are `planted in the fall` and `produce through the end of the spring`; winter/spring are driest; broad rainy season June–October; rain makes summer `a convenient time to plant palms, shrubs, and small trees`. This does not say every species must be planted May–June or that rainfall eliminates establishment irrigation.

Freshly downloaded official South Florida calendar (October 2024 revision):
https://ask.ifas.ufl.edu/publication/EP452/pdf
HTML alternatives https://ask.ifas.ufl.edu/publication/EP452 and https://edis.ifas.ufl.edu/publication/EP452 both returned 307 errors through WebFetch; curl of the official PDF succeeded and matched packet bytes/text.

Calendar excerpts:
- November: `beans, broccoli, kale, snow/English peas, and strawberries` (local text L633–635).
- November: `Turn off systems and water only if needed. Plants need less supplemental watering in cooler weather.` (L629–630).
- March mulch conserves moisture/minimizes weeds; ring protects trees from lawnmowers/line trimmers (L150–153).
- January/February: prepare trees now; `Don't wait until hurricane season` (L22–25/L144–146).
- June: tropical vegetables such as pigeon peas/boniato/calabaza/chayote; focus on new plantings and water as needed if rainfall spotty; follow restrictions (L310–330).
- Every month: plant trees/shrubs and `water until established` (L707–708).

Thus Oct–Apr is a model shorthand, not a universal crop window; summer is not barren. Exact May–June anchor-tree plan, Jan–March hedge plan, plant combinations, mounds and sunn-hemp/cowpea choices are not independently approved as site-specific recommendations. Draft L82/L84/L88/L96–103/L128 correctly qualifies rather than sells them. No required factual change. Paste's `rain does the watering for you` must NOT become advice; draft expressly avoids it.

### (i) Low-chill peaches — blanket paste claim WRONG/unsupported; draft correction CONFIRMED

Opened primary UF/IFAS stone-fruit varieties:
https://hos.ifas.ufl.edu/stonefruit/varieties/

> A number of varieties have been developed for North, Central and Southern Florida ...

Table: **UFSun 100 chill units; UFBest 100 chill units**. Source also emphasizes site selection, drainage and appropriate rootstock.

This is sufficient to reject the paste L122/L158 categorical claim that peaches cannot fruit anywhere here simply because of winter chill. It is NOT proof that 100 chill units are consistently met at this particular Oakland Park acre or that UFSun/UFBest will fruit there. USDA extreme-minimum zone does not measure chill accumulation. Draft L92 is appropriately cautious and is not a South Florida/10b harvest promise. Other listed fruits (apples/pears/blueberries/currants/cherries) were not individually resolved; do not turn the correction into blanket approval for those either.

## 5. Required changes (copy-paste ready; no source files edited)

### R1 — $139 renewal provenance

**Draft L17; packet L137** quote:
> Renew the four-visit package for $139.

Replace that sentence with:
> Existing playbooks describe a $139 four-visit renewal after the initial four prepaid visits. Alexander reported a Nov 5 card selection of “10% off ($139)”; Proof has not independently seen that selection. This is a reported renewal term, not the initial $154 package or an acre/homestead price.

**Draft L109** quote:
> before discussing normal $139 four-visit renewal.

Replace fragment with:
> before discussing the after-four-visits renewal described in existing playbooks ($139, based on Alexander's reported card selection, not independently verified by Proof).

Why: direct Sisto text establishes renewal-discount intent, but the amount/pick is only Alexander's report at transcript position 615. Do not promote that into an independently confirmed initial or normal locked rate. No public URL exists for this internal decision; transcript and playbook provenance above are the sources. Matching public arithmetic alone cannot establish authorization.

### R2 — Zone-2 source attribution, not decision reopening

**Draft L19; packet L141**, opening quote:
> On Nov 7, 2026, Sisto decided (his own words, via Alexander's card):

Replace opening with:
> On Nov 7, 2026, Alexander reported that Sisto selected a card option with this direction (the card response itself is not visible in the searchable transcript):

Keep the existing $55, ZIP list, $154-everywhere, fee line and separate-mowing-track language. Replace the ending source sentence with:
> Sources: Alexander transcript position 795 and his relay in Lawns' transcript position 86; this is a reported Sisto card decision, not independently viewed typed words/card evidence. Treat the reported mowing direction as current; do not reopen it as a homestead question.

Why: readable Alexander/Lawns messages quote the card but do not expose the underlying user response. It would be false to say Proof independently heard Sisto say this. There is no public URL for the private card; transcript IDs/positions above are the exact sources.

### R3 — Remove unnecessary generic escalation

**Draft L159–164**, heading and questions:
> ## 10. Sisto-only decisions — not approval requests sent
> 1. **A new service?** ...
> 2. **Larger-property money/scope?** ...
> 3. **Posts/sends/site?** ...

Replace L159–164 with:

> ## 10. Future approval gates — no current Sisto questions to send
>
> 1. **New services: not proposed now.** Keep the checklist internal and offer no homestead installs, animal care, ponds or cisterns. If a precise new service is later proposed, prepare its scope, competence/permit checks and exclusions for Proof before asking Sisto to approve that service and its money.
> 2. **Acre-scale pricing: premature now.** Measure total/mowable area and exclusions first. Only if actual acre-scale work is proposed, bring Sisto a specific existing-service scope for his pricing decision. Invent no rate and reuse no small-yard package automatically.
> 3. **Public action: already settled default.** Keep this internal. No posts, sends, website changes or go-live without Proof's check and Sisto's explicit approval of that exact proposed action. There is no public-action request to send him now.
> 4. **Zone 2 mowing display:** Alexander's reported Nov 7 card decision is recorded in L3. Do not reopen it here or confuse it with permaculture zones.

Why: standing rules already in booking/payment L116–119 and draft L116–117 settle the internal/no-publish default. A new-service/rate/public-action approval belongs to Sisto when there is a concrete proposal, not when the only recommendation is to do nothing public and invent nothing. Alexander's homestead assignment (transcript position 778) also asks for only truly Sisto decisions, not generic research/checklist questions. This does not mean Sisto's approval of a future exact external action is optional.

## 6. Planned questions — disposition to Proof, DO NOT SEND

| Planned question | Disposition | Why / when to ask |
|---|---|---|
| Q1 New services beyond current services? | ALREADY SAFE DEFAULT / can wait; not a present escalation | No new service is being proposed now. Keep internal. Ask only after preparing one exact new-service proposal. Draft L66/L116 and booking/payment standing rules already establish non-activation. |
| Q2 Acre scope/price? | PREMATURE | Sisto owns price/money, but `measure first; invent no rate` needs no pricing answer yet. Ask with a measured, concrete existing-service scope if actually proposed. Draft L31–33/L115 already holds unknown eligibility. |
| Q3 Publish/send/change site? | ALREADY SETTLED | No such action proposed; standing rule is no action without Proof and Sisto's explicit yes. Do not ask a redundant `should we publish?` with recommendation keep internal. Ask only about an exact later public change. |

Zone 2 is NOT a fourth question. Draft L164 already removes it; R2 changes provenance only.

## 7. Optional nits (not blockers)

1. Add official-host indexed §4-1/2/4/8 corroboration and retry failures to draft S1/packet S1. Keep the current full-code/address caveat: official index text is not a full current legal clearance.
2. Add official Florida map URL and correct 10b/11a bands to research source key if useful. Do not supply an invented parcel address or city-wide zone resolution.
3. Say local paste is a formatted transcription; don't claim the whole file was compared verbatim against the original when the transcript tool elides its middle. Exact final user instruction IS verified.
4. Older booking/payment L150/L208 and launch-plan L11 still say zone-2 display/package pending. This is source staleness, not grounds to reopen the decision in this homestead draft. Leave the paused mowing-track owner to reconcile those separately; no edits made here.
5. Source paste is evidence of Sisto's supplied model, NOT scientific authority. Preserve it as evidence; correct the framing, not the historical paste. Do not sanitize his original unsupported rain/fruit/soil claims into purported verified facts.

## 8. Confidence and residual gates

High confidence (~90%) in the INTERNAL framing/boundaries, arithmetic, public citations and required provenance fixes. High confidence exact closing homestead words are Sisto's user message. Medium confidence in the relayed $139/zone-2 card decisions as business provenance: consistent agent reports, but card events not independently visible. Low/unresolved confidence in exact parcel hardiness zone, current code interaction/parcel zoning, soil/water depth, drainage/pond viability and detailed horticultural design. Those stay gated and are NOT failures of an explicitly non-actionable internal model.

This FAIL is narrow and fixable. After R1–R3, the framing can pass as an INTERNAL process draft with unresolved site/legal/design facts clearly excluded. Do not call it a verified one-acre plan or ready-to-publish offer. No external action is approved or taken.
