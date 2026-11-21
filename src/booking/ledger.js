// One SQLite Durable Object for the whole route. Lawn capacity is a single
// number, so one named object is the lock: two payments can't take the last seat.
// Sharding this would reintroduce the race.

import { DurableObject } from "cloudflare:workers";
import { bookingConfig } from "./config.js";
import { SlotBook } from "./book.js";

export class SlotLedger extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec("CREATE TABLE IF NOT EXISTS ledger (id TEXT PRIMARY KEY, body TEXT NOT NULL)");
    });
  }

  // transactionSync does not yield, so the read, the seat check, and the write
  // commit together. The outbound booking_paid call stays outside this method.
  mutate(fn) {
    return this.ctx.storage.transactionSync(() => {
      const rows = this.ctx.storage.sql.exec("SELECT body FROM ledger WHERE id = ?", "state").toArray();
      const state = rows[0]?.body ? JSON.parse(rows[0].body) : undefined;
      const book = new SlotBook(state, bookingConfig(this.env));
      const result = fn(book, Date.now());
      this.ctx.storage.sql.exec("DELETE FROM ledger WHERE id = ?", "state");
      this.ctx.storage.sql.exec(
        "INSERT INTO ledger (id, body) VALUES (?, ?)",
        "state",
        JSON.stringify(book.state),
      );
      return result;
    });
  }

  list() {
    return this.mutate((book, now) => book.listSlots(now));
  }

  hold(input) {
    return this.mutate((book, now) => book.tryHold(input, now));
  }

  attachPayment(bookingId, info) {
    return this.mutate((book) => book.attachPayment(bookingId, info));
  }

  updatePlan(bookingId, patch) {
    return this.mutate((book, now) => book.updatePlan(bookingId, patch, now));
  }

  release(bookingId) {
    return this.mutate((book) => book.release(bookingId));
  }

  prepareConfirm(info) {
    return this.mutate((book, now) => book.prepareConfirm(info, now));
  }

  markForwarded(info) {
    return this.mutate((book, now) => book.markForwarded(info, now));
  }

  abortForward(info) {
    return this.mutate((book) => book.abortForward(info));
  }

  releaseFromEvent(info) {
    return this.mutate((book, now) => book.releaseFromEvent(info, now));
  }

  attachCard(info) {
    return this.mutate((book, now) => book.attachCard(info, now));
  }

  finishIgnored(eventId) {
    return this.mutate((book, now) => book.finishIgnored(eventId, now));
  }

  read(bookingId) {
    return this.mutate((book) => book.read(bookingId));
  }

  readByPaymentIntent(paymentIntentId) {
    return this.mutate((book) => book.readByPaymentIntent(paymentIntentId));
  }

  putSnapshot(snapshot) {
    return this.mutate((book, now) => book.putSnapshot(snapshot, now));
  }

  readSnapshot() {
    return this.mutate((book) => book.readSnapshot());
  }
}
