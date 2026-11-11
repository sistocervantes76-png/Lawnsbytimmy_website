# Proof check — Lawns two-question missed-call SMS plan (Tue Nov 10, 2026, ~7:58 PM ET)

> **Status note (docs bundle, after 8:20:34 PM ET Nov 10):** The Proof-passed “address + what service you need” wording below was applied at 8:07:25 PM ET and is **no longer the current live first text.** At 8:20:34 PM ET it was replaced by address + which day works best (Tue–Sat). See `lawns-missed-call-address-day-apply-2026-11-10.md` and `../CHANGELOG.md`.

Verdict: FIX (one wording issue). Everything else checks out.

Inputs verified: request sha 2b8a8487…be87, plan sha 24836c32…ff4d. All six Nov 10 7:51 PM backup files match their sidecars (sha256sum -c OK).

Source: Sisto's own typed turn, read independently in Alexander's transcript (position 1029, speaker cu:525478510, Nov 10, 7:46 PM ET): "The questions we text them should be just two... the rest should be asked when they accept the offer. ... we just need their address and what service they're looking for." The relay matches. At 7:47 PM he also chose to hold the preview (Alexander, position 1034).

1) CONFIRMED. In the backup, module id 4 (ringcentral:sendSMSMMS) mapper.text is the 5-question text, 244 chars, which is 2 GSM-7 segments. Module 8 (Customers addRow) values.23 and module 9 (owner email) content both list address, gate, pets, bi-weekly/monthly, last cut. Nothing else needs changing for the wording.
2) Counts CONFIRMED: primary 156 chars, alternate 159, both all GSM-7, 1 segment.
   FIX: the example list "(mowing, tree work, or irrigation)" isn't in Sisto's words, and lawnsbytimmy.com lists only mowing services (mowing, edging, line trimming, blow-off). Nothing I have shows irrigation as a service. Tree work only appears in his story. Don't show customers a service list he hasn't confirmed. Safe replacement, using only his two items (146 chars, 1 segment):
   "Hi, this is Timmy's assistant at Lawns by Timmy! Sorry we missed you. Reply with: 1) your address 2) what service you need. Reply STOP to opt out."
   If Sisto wants examples, he names them himself.
   Note: keeping "For a fast quote," pushes it to 164 chars, which is 2 segments.
3) After-ACCEPT text: 157 chars, GSM-7, 1 segment, CONFIRMED. Its facts are the same four live questions, with "36 inches" in place of 36". This is new wording and needs Sisto's OK. The Nov 8 yes doesn't cover it.
4) Conflicts CONFIRMED and correctly left to Sisto:
   - 6246200 module 6 prices by a size+frequency key (for example smallbiweekly 45, smallmonthly 50 or 60 in summer). Asking frequency only after ACCEPT means the price he offers has to assume a frequency. This also applies to the after-ACCEPT "Bi-weekly or monthly?" question: by the time they accept, a price is usually already tied to a frequency.
   - Timing A/B: ACCEPT is not live (6691639 has no outbound SMS), so changing 6671272 now means nobody asks the other four questions automatically.
   - Form leads would be asked twice. 6246200 is unchanged.
   - Teaching facts and the held preview need updating only after the live text actually changes.
Nothing changed, sent or run by this check.

## Live readback check (Nov 10, 2026, ~8:12 PM ET): PASS
- Authority: Sisto's own typed turn in Lawns chat (position 126, cu:525478510): "Make it live, put it in, and does the wording need to be changed in RingCentral". Verified.
- Fresh live read of 6671272: status active, lastEdit 2026-11-11T01:07:25.720Z (8:07:25 PM ET).
  - Module 4 text exactly matches the passed 146-char text. It is all ASCII/GSM-7, 1 segment.
  - Module 8 values.23 reads: "Missed call {{5.call_time}}. Auto-text sent asking for address and what service they need."
  - Module 9: "...quick-quote questions (address and what service they need)."
- Before backup sha 084b39e8…e663 checks out. After snapshot sha e4b4b29c…dcd6 checks out. A full diff of the two shows exactly 3 changed fields (module 4 text, module 8 values.23, module 9 content). No other change.
- RingCentral: Make sends the text from module 4's own text through the RingCentral connection, so the Make change is enough. Can't verify: whether a separate auto-reply is set up inside the RingCentral app. That was not inspected.
- Known gap confirmed: gate, pets, frequency, and last cut aren't asked anywhere live until ACCEPT go-live.
