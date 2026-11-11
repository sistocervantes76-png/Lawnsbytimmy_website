# TEST_Msg_Log draft packet
Date compiled: Saturday, Nov 7, 2026 (America/New_York)
Status: **APPROVED TO SEND, NOT SENT YET.** These lines were logged only to the CRM `TEST_Msg_Log` tab during the Nov 5 test. No real customer has been texted from this packet. Wording OKed (item 8, "7-8 yes" in Alexander's chat, Nov 8). Sending these Lawns customer texts was approved Sun Nov 8, 2026 in Proof's chat (Proof reported about 7:18 PM ET), when Sisto typed that Lawns and Fork/Substack are different situations and "the answer for Lawns is yes," plus "After I hit Done it should catch them out." This yes does not turn on live ACCEPT routing in 6691639, deploy the offer page, create live Stripe lawn prices, or copy the Job Done path live.

Sources:
- Quote text template: TEST quote scenario 6918627, module 9 (writes `quote_text` to `TEST_Msg_Log`)
- All other customer texts: `/workspace/lawns-flow/flow-server.mjs` (the test flow service)
- Example fills: CRM snapshot Nov 5, 2026 ~2:19 PM ET at `/workspace/lawns-offer-page/proof/flow/crm-test-tabs-snapshot-1419ET.json` and the later note-clear snapshot

Proof (Nov 5) flagged that these drafts mention things Sisto has not approved yet: the ACCEPT pay-link line, "charged after each visit," and "Link good for 3 days." Showing zone 2 at $55 is now his decision (Nov 7, below). **Update, Sun Nov 8, 2026 ~5:55 PM ET:** Sisto answered "7-8 yes" in Alexander's chat. Item 8 OKs this wording, including the three flagged lines. Lawns and Proof independently read that typed turn. **Later update, Sun Nov 8, 2026 in Proof's chat** (Proof reported about 7:18 PM ET): Sisto typed that Proof had mixed Lawns with Fork Algorithm/Substack, "the answer for Lawns is yes," and "After I hit Done it should catch them out." Sending these Lawns texts is now approved. The live send/charge path is still TEST-only and was not turned on.

Placeholders are in [brackets]. Test pay URLs were temporary tunnels; they are written here as `[pay link]`. The business phone in the drafts is (954) 880-3500.

**Zone 2: decided by Sisto, Sat Nov 7, 2026** (his words, via Alexander's card): "Show $55 per visit in those Fort Lauderdale ZIPs, keep the $154 package everywhere, and add that some ZIPs add a $10 trip fee to per-visit service."
Zone 2 ZIPs: 33301, 33304, 33305, 33306, 33308, 33313, 33316. Make already charges $55 there ($45 + $10 trip fee).
Test code updated Nov 7 (~3:45 PM ET): `ZONE2_PACKAGE_ENABLED=true`. Every zone now gets pay-link 2a. The old 2b "package hidden in zone 2" text was removed from the code and from this packet.

---

## Customer-facing SMS

### 1. Quote text (`quote_text`)
When: after a new quote is created.

Template:
> Hi [First], thanks for reaching out to Lawns by Timmy! Your price is $[price] per visit for bi-weekly mowing. Reply ACCEPT to book and get your secure pay link. Reply STOP to opt out.

Zone 1 example ($45):
> Hi TEST, thanks for reaching out to Lawns by Timmy! Your price is $45 per visit for bi-weekly mowing. Reply ACCEPT to book and get your secure pay link. Reply STOP to opt out.

Zone 2 example ($55):
> Hi TEST, thanks for reaching out to Lawns by Timmy! Your price is $55 per visit for bi-weekly mowing. Reply ACCEPT to book and get your secure pay link. Reply STOP to opt out.

Notes: This message names the per-visit price only. The package choice is in the pay-link text after they reply ACCEPT. Showing $55 in zone 2 is his decision (Nov 7). ACCEPT line OKed (item 8, Nov 8). Sending approved (Proof's chat, Nov 8). Not sent yet.

### 2a. Pay link (`pay_link`), all zones
When: they reply ACCEPT and the yard is a small bi-weekly in zone 1 or zone 2. The package is offered in both zones (Sisto, Nov 7).

Template:
> Thanks [First]! Book Lawns by Timmy here: [pay link] Choose the 4-visit package ($154 today: first cut $19, then 3 at $45) or $[45] per visit (card saved, charged after each visit). Bi-weekly only. Link good for 3 days. Reply STOP to opt out.

Zone 2 example ($55):
> Thanks TEST! Book Lawns by Timmy here: [pay link] Choose the 4-visit package ($154 today: first cut $19, then 3 at $45) or $55 per visit (card saved, charged after each visit). Bi-weekly only. Link good for 3 days. Reply STOP to opt out.

The test pay page also lists this line in its terms: "Some Fort Lauderdale ZIPs add a $10 trip fee to per-visit service." For zone 2, the per-visit option adds: "Includes the $10 trip fee for your area."

"charged after each visit" and "Link good for 3 days" (the 72-hour test link window) OKed (item 8, Nov 8). Sending approved (Proof's chat, Nov 8). Not sent yet. The live ACCEPT/pay-link path is still TEST-only.

### 2b. (Removed Nov 7, 2026)
The old zone 2 text, which hid the package and said only "$55 per visit (includes the $10 trip fee for your area)", is retired. Sisto decided on the package everywhere, so zone 2 uses 2a with $55.

### 3. Package paid (`receipt_package`)
> Thanks [First]! Your 4-visit package is paid ($154.00). Your first cut counts as the $19 visit. Timmy will text you to set your first visit. Questions? Call or text (954) 880-3500.

### 4. Card saved, nothing charged today (`receipt_card_saved`)
> Thanks [First]! Your card ending [last4] is saved. Nothing was charged today; we'll charge $[45.00 or 55.00] after each completed visit. Timmy will text you to set your first visit. Questions? Call or text (954) 880-3500.

### 5. Package visit done (`receipt_package_visit`)
> Hi [First], today's lawn visit at [address] is done. That used 1 prepaid package visit; [N] left. Questions? Call or text (954) 880-3500. Quick feedback: reply with a number 1-5 (5 = great).

### 6. Per-visit charge succeeded (`receipt_visit_charge`)
> Hi [First], today's lawn service at [address] is done. We charged $[45.00 or 55.00] to your card ending [last4]. Questions? Call or text (954) 880-3500. Quick feedback: reply with a number 1-5 (5 = great).

### 7. Card declined, retry link (`payment_failed_retry_link`)
> Hi [First], today's lawn service at [address] is done, but your card ending [last4] was declined for $[amount]. Please pay here: [pay link] Questions? Call or text (954) 880-3500.

A declined card does not schedule the next visit.

### 8. Last package visit / renewal offer (`renewal_offer`)
> [First], that was the last visit in your package. Keep your bi-weekly spot: renew 4 visits for $139 here: [pay link] Bi-weekly only. Reply STOP to opt out.

The test renewal link window is 7 days. Nothing is auto-charged. Team default (Alexander, Nov 7): hold and prepare this $139 renewal link rather than auto-charging. Wording OKed (item 8, Nov 8). Sending approved (Proof's chat, Nov 8). Not sent yet. Renewal sending still depends on the live Job Done path, which is TEST-only.

### 9. Renewal paid (`receipt_renewal`)
> Thanks [First]! Your 4-visit renewal is paid ($139.00). You have 4 visits left. Questions? Call or text (954) 880-3500.

### 10. Retry payment succeeded (`receipt_retry`)
> Thanks [First]! We got your payment of $[amount], and your new card ending [last4] is saved for next time. Questions? Call or text (954) 880-3500.

---

## Pay-page consent (not an SMS, but part of the wording he must OK)

Shown on the test checkout page when they save a card:

> By saving your card, you let Lawns by Timmy charge it after each completed bi-weekly visit at your quoted price ([$45 or $55] per visit), or for package renewals you agree to. Text or call (954) 880-3500 to update or remove your card.

The page itself marks this as draft wording for Sisto to approve. Consent wording OKed (Alexander-reported item 8, Nov 8 ~5:55 PM ET). The page label is unchanged, and nothing was deployed.

Expired start-link page text (also draft):
> This link has expired. Text ACCEPT to (954) 880-3500 for a new one, or call us.

---

## Not customer texts (logged in the same tab)

Internal notes to info@lawnsbytimmy.com were also written to `TEST_Msg_Log` during the test (package paid, card saved, card declined, price held for a hand charge, ACCEPT with no matching CRM row). Those are alerts for Timmy, not customer copy.

Live text-replies scenario 6691639 (unchanged, not part of this test build) does not send the customer a confirmation text for STOP or YES. It emails info@lawnsbytimmy.com and updates the opt-out list. YES still means opt back in. The TEST clone (6918616, OFF) classifies a 1–5 rating but has no rating-response text; Proof noted that the live rating route should be copied before go-live.

---

Nothing in this packet has been sent or turned on. **Sending these Lawns customer texts is approved** (Sisto in Proof's chat, Nov 8: "the answer for Lawns is yes"). They have not been sent yet. This yes does not turn on live ACCEPT routing in 6691639, deploy the offer page, create live Stripe lawn prices, or copy Job Done live. 10DLC coverage for pay links and receipts remains a go-live item. 6691639 was not changed.
