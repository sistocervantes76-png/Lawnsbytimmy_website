// Entry point for the test Worker only (wrangler.booking-test.jsonc).
// Production src/worker.js exports the same SlotLedger class.
import worker from "./worker.js";

export { SlotLedger } from "./booking/ledger.js";

export default worker;
