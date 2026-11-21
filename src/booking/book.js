// In-memory slot book. The Durable Object runs these same methods inside one
// synchronous storage transaction, so two customers can't take the last seat.
// MemoryLedger serializes the same way for unit tests.

import {
  bookingConfig,
  formatPhoneDisplay,
  isoToMdy,
  serviceDayCode,
  visitLabel,
} from "./config.js";
import { openSlots, seatsLeft, activeHolds } from "./slots.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export function emptyState() {
  return { holds: {}, events: {}, snapshot: { jobs: [], blocks: [], fetchedAt: 0 } };
}

export function bookingPaidPayload(hold) {
  const visits = (hold.visits || []).map((iso, index) => ({
    n: index + 1,
    date: isoToMdy(iso),
    label: visitLabel(iso),
  }));
  const phone = formatPhoneDisplay(hold.customer?.phone);
  return {
    event: "booking_paid",
    test: true,
    payment_intent_id: hold.paymentIntentId,
    booking_id: hold.bookingId,
    customer_id: hold.customerId,
    plan: hold.plan === "package" ? "package" : "per_visit",
    zone: hold.zone,
    amount_cents: hold.amountCents,
    price_per_visit: hold.pricePerVisit,
    service_day: serviceDayCode(hold.visits[0]),
    window_label: hold.windowLabel,
    stripe_customer_id: hold.stripeCustomerId,
    card: {
      brand: hold.cardBrand || "",
      last4: hold.cardLast4 || "",
      saved: !!hold.saveCard,
    },
    customer: {
      first_name: hold.customer.first_name,
      last_name: hold.customer.last_name,
      email: hold.customer.email,
      phone,
      address: hold.customer.address,
      city: hold.customer.city,
      zip: hold.customer.zip,
      sms_consent: !!hold.customer.sms_consent,
    },
    visits,
  };
}

export class SlotBook {
  constructor(state, config) {
    this.state = state && state.holds && state.events && state.snapshot ? state : emptyState();
    this.config = config;
  }

  prune(now) {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(now));
    for (const [id, hold] of Object.entries(this.state.holds)) {
      const last = hold.visits?.[hold.visits.length - 1] || "";
      const expiredLongAgo = hold.expiresAt && hold.expiresAt < now - DAY_MS;
      if (hold.status === "confirmed" && last && last < today) delete this.state.holds[id];
      else if ((hold.status === "released" || hold.status === "held") && expiredLongAgo) delete this.state.holds[id];
    }
    for (const [id, event] of Object.entries(this.state.events)) {
      if (event?.at && event.at < now - 14 * DAY_MS) delete this.state.events[id];
    }
  }

  listSlots(now) {
    this.prune(now);
    return openSlots({
      now,
      config: this.config,
      holds: this.state.holds,
      jobs: this.state.snapshot.jobs,
      blocks: this.state.snapshot.blocks,
    });
  }

  hasRoom(hold, now) {
    const others = activeHolds(this.state.holds, now).filter((item) => item.bookingId !== hold.bookingId);
    const window = this.config.windows.find((item) => item.id === hold.windowId);
    if (!window) return false;
    return hold.visits.every((date) => seatsLeft(
      date,
      window,
      this.config,
      others,
      this.state.snapshot.jobs,
      this.state.snapshot.blocks,
    ) > 0);
  }

  tryHold(input, now) {
    this.prune(now);
    const previous = input.replaceBookingId && this.state.holds[input.replaceBookingId];
    const releasedPrevious = !!(previous && previous.status === "held");
    if (releasedPrevious) previous.status = "released";
    const offered = this.listSlots(now);
    const day = offered.days.find((item) => item.date === input.date);
    const win = day?.windows.find((item) => item.id === input.windowId);
    if (!win) {
      if (releasedPrevious) previous.status = "held";
      return { ok: false, reason: "taken" };
    }
    const window = this.config.windows.find((item) => item.id === input.windowId);
    const record = {
      bookingId: input.bookingId,
      customerId: input.customerId,
      plan: input.plan,
      zone: input.zone,
      amountCents: input.amountCents,
      pricePerVisit: input.pricePerVisit,
      zip: input.zip,
      windowId: input.windowId,
      windowLabel: window.label,
      visits: win.visits.map((visit) => visit.iso),
      expiresAt: now + this.config.holdMinutes * 60 * 1000,
      status: "held",
      needsReschedule: false,
      saveCard: !!input.saveCard,
      paymentIntentId: "",
      stripeCustomerId: "",
      cardLast4: "",
      cardBrand: "",
      forwarded: false,
      forwardClaim: 0,
      customer: input.customer,
    };
    this.state.holds[record.bookingId] = record;
    return { ok: true, booking: record };
  }

  attachPayment(bookingId, info) {
    const hold = this.state.holds[bookingId];
    if (!hold || hold.status === "released") return { ok: false };
    hold.paymentIntentId = info.paymentIntentId || hold.paymentIntentId;
    hold.stripeCustomerId = info.stripeCustomerId || hold.stripeCustomerId;
    return { ok: true, booking: hold };
  }

  updatePlan(bookingId, patch, now) {
    const hold = this.state.holds[bookingId];
    if (!hold || hold.status !== "held" || hold.expiresAt <= now) return { ok: false, reason: "expired" };
    let saveCard = !!patch.saveCard;
    let saveCardLocked = false;
    if (hold.saveCard && !saveCard) {
      saveCard = true;
      saveCardLocked = true;
    }
    hold.plan = patch.plan;
    hold.zone = patch.zone;
    hold.amountCents = patch.amountCents;
    hold.pricePerVisit = patch.pricePerVisit;
    hold.saveCard = saveCard;
    return { ok: true, saveCardLocked, booking: hold };
  }

  release(bookingId) {
    const hold = this.state.holds[bookingId];
    if (!hold || hold.status === "confirmed") return { ok: false };
    hold.status = "released";
    return { ok: true };
  }

  prepareConfirm({ bookingId, card, eventId }, now) {
    this.prune(now);
    if (eventId && this.state.events[eventId]?.done) return { duplicate: true };
    const hold = this.state.holds[bookingId];
    if (!hold) return { missing: true };
    if (hold.forwarded) {
      if (eventId) this.state.events[eventId] = { done: true, at: now, bookingId };
      return { send: false, duplicate: true, booking: hold };
    }
    if (hold.forwardClaim && now - hold.forwardClaim < 60_000) return { inProgress: true };
    if (hold.status !== "confirmed") {
      const previous = hold.status;
      const expired = previous !== "held" || hold.expiresAt <= now;
      const room = this.hasRoom(hold, now);
      hold.needsReschedule = !room && (expired || previous === "released");
      hold.status = "confirmed";
    }
    if (card?.last4) hold.cardLast4 = String(card.last4);
    if (card?.brand) hold.cardBrand = String(card.brand);
    if (typeof card?.saved === "boolean") hold.saveCard = card.saved;
    hold.forwardClaim = now;
    return { send: true, payload: bookingPaidPayload(hold), booking: hold };
  }

  markForwarded({ bookingId, eventId }, now) {
    const hold = this.state.holds[bookingId];
    if (hold) {
      hold.forwarded = true;
      hold.forwardClaim = 0;
    }
    if (eventId) this.state.events[eventId] = { done: true, at: now, bookingId };
    return { ok: true };
  }

  abortForward({ bookingId }) {
    const hold = this.state.holds[bookingId];
    if (hold) hold.forwardClaim = 0;
    return { ok: true };
  }

  releaseFromEvent({ bookingId, eventId }, now) {
    if (eventId && this.state.events[eventId]?.done) return { duplicate: true };
    const hold = this.state.holds[bookingId];
    if (!hold) {
      if (eventId) this.state.events[eventId] = { done: true, at: now, bookingId };
      return { missing: true };
    }
    if (hold.status !== "confirmed") hold.status = "released";
    if (eventId) this.state.events[eventId] = { done: true, at: now, bookingId };
    return { ok: true, ignored: hold.status === "confirmed" };
  }

  attachCard({ bookingId, card, eventId }, now) {
    if (eventId && this.state.events[eventId]?.done) return { duplicate: true };
    const hold = this.state.holds[bookingId];
    if (hold && card) {
      if (card.last4) hold.cardLast4 = String(card.last4);
      if (card.brand) hold.cardBrand = String(card.brand);
    }
    if (eventId) this.state.events[eventId] = { done: true, at: now, bookingId };
    return { ok: true };
  }

  finishIgnored(eventId, now) {
    if (!eventId) return { ok: false };
    if (this.state.events[eventId]?.done) return { duplicate: true };
    this.state.events[eventId] = { done: true, at: now };
    return { ok: true };
  }

  read(bookingId) {
    const hold = this.state.holds[bookingId];
    return hold ? structuredClone(hold) : null;
  }

  readByPaymentIntent(paymentIntentId) {
    const hold = Object.values(this.state.holds).find((item) => item.paymentIntentId === paymentIntentId);
    return hold ? structuredClone(hold) : null;
  }

  putSnapshot(snapshot, now) {
    this.state.snapshot = {
      jobs: Array.isArray(snapshot?.jobs) ? snapshot.jobs : [],
      blocks: Array.isArray(snapshot?.blocks) ? snapshot.blocks : [],
      fetchedAt: now,
    };
    return { ok: true };
  }

  readSnapshot() {
    return this.state.snapshot || { jobs: [], blocks: [], fetchedAt: 0 };
  }
}

function cloneState(state) {
  return structuredClone(state);
}

// Promise chain stands in for the Durable Object transaction: the check and
// the write run to completion before the next hold starts.
export class MemoryLedger {
  constructor(env = {}, options = {}) {
    this.env = env;
    this.now = options.now || (() => Date.now());
    this.state = emptyState();
    this.chain = Promise.resolve();
  }

  lock(fn) {
    const run = this.chain.then(() => {
      const book = new SlotBook(cloneState(this.state), bookingConfig(this.env));
      const result = fn(book, this.now());
      this.state = book.state;
      return result;
    });
    this.chain = run.then(() => undefined, () => undefined);
    return run;
  }

  list() {
    return this.lock((book, now) => book.listSlots(now));
  }

  hold(input) {
    return this.lock((book, now) => book.tryHold(input, now));
  }

  attachPayment(bookingId, info) {
    return this.lock((book) => book.attachPayment(bookingId, info));
  }

  updatePlan(bookingId, patch) {
    return this.lock((book, now) => book.updatePlan(bookingId, patch, now));
  }

  release(bookingId) {
    return this.lock((book) => book.release(bookingId));
  }

  prepareConfirm(info) {
    return this.lock((book, now) => book.prepareConfirm(info, now));
  }

  markForwarded(info) {
    return this.lock((book, now) => book.markForwarded(info, now));
  }

  abortForward(info) {
    return this.lock((book) => book.abortForward(info));
  }

  releaseFromEvent(info) {
    return this.lock((book, now) => book.releaseFromEvent(info, now));
  }

  attachCard(info) {
    return this.lock((book, now) => book.attachCard(info, now));
  }

  finishIgnored(eventId) {
    return this.lock((book, now) => book.finishIgnored(eventId, now));
  }

  read(bookingId) {
    return this.lock((book) => book.read(bookingId));
  }

  readByPaymentIntent(paymentIntentId) {
    return this.lock((book) => book.readByPaymentIntent(paymentIntentId));
  }

  putSnapshot(snapshot) {
    return this.lock((book, now) => book.putSnapshot(snapshot, now));
  }

  readSnapshot() {
    return this.lock((book) => book.readSnapshot());
  }
}
