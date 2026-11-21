// Prices, zones, and the schedule defaults for the test booking page.
// Windows, cap, and how far ahead a customer can book are config.
// The four bi-weekly dates and Tue–Sat are fixed.

export const PACKAGE_CENTS = 15400;
export const VISIT_ZONE1_CENTS = 4500;
export const VISIT_ZONE2_CENTS = 5500;
export const FIRST_CUT_CENTS = 1900;

// Same ZIP lists the quote form uses. Anything else is zone 3 (no online price).
export const ZONE1_ZIPS = ["33309", "33311", "33312", "33315", "33334"];
export const ZONE2_ZIPS = ["33301", "33304", "33305", "33306", "33308", "33313", "33316"];

export const ESTIMATE_URL = "https://calendar.app.google/cEtwcki68DJwSfv89";
export const QUOTE_URL = "/#quote-form";

const DEFAULT_WINDOWS = [
  { id: "0800-1000", label: "8\u201310 AM", start: "08:00", end: "10:00" },
  { id: "1000-1200", label: "10 AM\u201312 PM", start: "10:00", end: "12:00" },
];

const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayIndex(iso) {
  const [year, month, day] = String(iso || "").split("-").map(Number);
  if (!year || !month || !day) return -1;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function isServiceDay(iso) {
  const day = weekdayIndex(iso);
  return day >= 2 && day <= 6;
}

export function serviceDayCode(iso) {
  const day = weekdayIndex(iso);
  return day >= 0 ? DAY_CODES[day] : "";
}

export function etIsoDate(now) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

export function addDaysIso(iso, days) {
  const [year, month, day] = String(iso).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function toIsoDate(value) {
  const text = String(value || "").trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return "";
  return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
}

// Sheet dates are M/D/YYYY with no leading zeros.
export function isoToMdy(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return "";
  return `${Number(match[2])}/${Number(match[3])}/${match[1]}`;
}

export function visitLabel(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!match) return "";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 16));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function zoneForZip(zip) {
  const digits = String(zip || "").replace(/\D/g, "").slice(0, 5);
  if (ZONE2_ZIPS.includes(digits)) return 2;
  if (ZONE1_ZIPS.includes(digits)) return 1;
  return 3;
}

export function quotePrice({ zip, plan, yard }) {
  const zone = zoneForZip(zip);
  const pricePerVisit = zone === 2 ? 55 : 45;
  if (yard !== "yes") return { payable: false, zone, reason: "yard", pricePerVisit };
  if (zone === 3) return { payable: false, zone, reason: "zone", pricePerVisit };
  if (plan === "package") {
    return { payable: true, zone, plan, amountCents: PACKAGE_CENTS, pricePerVisit, tripFee: zone === 2 };
  }
  if (plan === "per_visit") {
    const amountCents = zone === 2 ? VISIT_ZONE2_CENTS : VISIT_ZONE1_CENTS;
    return { payable: true, zone, plan, amountCents, pricePerVisit, tripFee: zone === 2 };
  }
  return { payable: false, zone, reason: "plan", pricePerVisit };
}

export function formatPhoneDisplay(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (!/^\d{10}$/.test(ten)) return "";
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

export function moneyLabel(cents) {
  const amount = Number(cents);
  if (!Number.isInteger(amount) || amount < 0) return "";
  return amount % 100 === 0 ? `$${amount / 100}` : `$${(amount / 100).toFixed(2)}`;
}

function asWindow(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id || "");
  const label = String(row.label || "").trim();
  const start = String(row.start || "");
  const end = String(row.end || "");
  if (!/^[A-Za-z0-9-]{1,40}$/.test(id) || !label || label.length > 40) return null;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end) return null;
  return { id, label, start, end };
}

function clampedInt(value, min, max) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) return null;
  return number;
}

// Schedule knobs can be overridden with BOOKING_CONFIG_JSON on the test Worker.
// Prices and the Tue–Sat / 4-visit rule stay in code.
export function bookingConfig(env = {}) {
  const config = {
    windows: DEFAULT_WINDOWS.map((window) => ({ ...window })),
    capPerWindow: 2,
    minLeadDays: 2,
    maxLeadDays: 21,
    holdMinutes: 15,
    visitOffsetsDays: [0, 14, 28, 42],
    windowsConfirmed: String(env.BOOKING_WINDOWS_CONFIRMED || "").trim() === "yes",
    configWarning: "",
  };
  const raw = String(env.BOOKING_CONFIG_JSON || "").trim();
  if (!raw) return config;
  try {
    const over = JSON.parse(raw);
    if (Array.isArray(over.windows)) {
      const windows = over.windows.map(asWindow).filter(Boolean);
      if (windows.length) config.windows = windows;
    }
    const cap = clampedInt(over.capPerWindow, 1, 20);
    const minLead = clampedInt(over.minLeadDays, 0, 30);
    const maxLead = clampedInt(over.maxLeadDays, 1, 60);
    const hold = clampedInt(over.holdMinutes, 5, 60);
    if (cap) config.capPerWindow = cap;
    if (minLead !== null) config.minLeadDays = minLead;
    if (maxLead) config.maxLeadDays = maxLead;
    if (hold) config.holdMinutes = hold;
    if (config.minLeadDays > config.maxLeadDays) {
      config.minLeadDays = 2;
      config.maxLeadDays = 21;
    }
  } catch {
    config.configWarning = "ignored";
  }
  return config;
}

// New bookings use LC- plus digits so they match ^LC-\d+$.
// Web-lead IDs with hyphens stay valid for account sign-in, but are not minted here.
export function newCustomerId(now = Date.now(), rand = () => crypto.getRandomValues(new Uint8Array(1))[0]) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(now));
  const take = (type) => String(parts.find((part) => part.type === type)?.value || "").replace(/\D/g, "").padStart(2, "0");
  let hour = take("hour");
  if (hour === "24") hour = "00";
  const stamp = `${take("year")}${take("month")}${take("day")}${hour}${take("minute")}${take("second")}`;
  return `LC-${stamp}${String(rand() % 100).padStart(2, "0")}`;
}

export function newBookingId() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `BK-${hex}`;
}
