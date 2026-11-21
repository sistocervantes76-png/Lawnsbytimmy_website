// Entry point for the test Worker only (wrangler.booking-test.jsonc).
// The production Worker (src/worker.js) does not export the Durable Object,
// so its existing config does not need a migration.
import worker from "./worker.js";

export { SlotLedger } from "./booking/ledger.js";

export default worker;
