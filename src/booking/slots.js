// Which arrival windows are open. A window is offered only when all four
// bi-weekly dates have a free seat. Jobs come from the sheet snapshot.
// Calendar blocks are optional: a missing blocks or calendar field means none.

import {
  addDaysIso,
  bookingConfig,
  etIsoDate,
  isServiceDay,
  isoToMdy,
  toIsoDate,
  visitLabel,
} from "./config.js";

function minutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function rangesOverlap(startA, endA, startB, endB) {
  const a0 = minutes(startA);
  const a1 = minutes(endA);
  const b0 = minutes(startB);
  const b1 = minutes(endB);
  if (a0 === null || a1 === null || b0 === null || b1 === null) return true;
  return a0 < b1 && b0 < a1;
}

export function activeHolds(holds, now) {
  return Object.values(holds || {}).filter((hold) => {
    if (!hold || !hold.windowId || !Array.isArray(hold.visits)) return false;
    if (hold.status === "confirmed") return true;
    return hold.status === "held" && hold.expiresAt > now;
  });
}

function blockCloses(block, date, window) {
  if (!block || typeof block !== "object") return false;
  const blockDate = toIsoDate(block.date || block.start || "");
  if (blockDate !== date) return false;
  const title = String(block.title || "");
  const allDay = block.all_day === true || block.allDay === true || String(block.all_day || "").toLowerCase() === "true";
  const lbt = title.startsWith("LBT Block");
  if (!allDay && !lbt) return false;
  const start = block.start_time || "";
  const end = block.end_time || "";
  if (allDay || !start || !end) return true;
  return rangesOverlap(window.start, window.end, start, end);
}

export function windowFromNotes(notes, windows) {
  const text = String(notes || "").replace(/[\u2013\u2014]/g, "-").toLowerCase();
  const ordered = [...windows].sort((a, b) => b.label.length - a.label.length);
  for (const window of ordered) {
    const label = window.label.replace(/[\u2013\u2014]/g, "-").toLowerCase();
    if (label && text.includes(label)) return window.id;
  }
  return "";
}

function asCells(row) {
  if (Array.isArray(row)) return row;
  if (!row || typeof row !== "object") return [];
  const keys = Object.keys(row);
  if (keys.length && keys.every((key) => /^\d+$/.test(key))) {
    const max = Math.max(...keys.map(Number));
    return Array.from({ length: max + 1 }, (_, index) => row[String(index)] ?? "");
  }
  return Object.values(row);
}

function column(header, name) {
  return header.findIndex((cell) => String(cell || "").trim().toLowerCase() === name.toLowerCase());
}

// Sheet reply: header row, then one row per job.
// Column B is Service_Date and column G is Job_Status when the headers say so,
// which is the TEST_Jobs layout. Job_Notes carries "Window <label>".
export function jobsFromValues(values, windows) {
  const rows = (Array.isArray(values) ? values : []).map(asCells).filter((row) => row.some((cell) => String(cell || "").trim()));
  if (!rows.length) return [];
  const header = rows[0].map((cell) => String(cell || "").trim());
  const dateHeader = column(header, "Service_Date");
  const statusHeader = column(header, "Job_Status");
  const notesHeader = column(header, "Job_Notes");
  const idHeader = column(header, "Job_ID");
  const hasHeader = dateHeader >= 0 || statusHeader >= 0;
  const dateCol = dateHeader >= 0 ? dateHeader : 1;
  const statusCol = statusHeader >= 0 ? statusHeader : 6;
  const jobs = [];
  for (const cells of hasHeader ? rows.slice(1) : rows) {
    const status = String(cells[statusCol] ?? "").trim();
    if (!/^scheduled$/i.test(status)) continue;
    const date = toIsoDate(cells[dateCol]);
    if (!date) continue;
    const notes = notesHeader >= 0 ? String(cells[notesHeader] ?? "") : cells.map((cell) => String(cell ?? "")).join(" ");
    jobs.push({
      job_id: String(idHeader >= 0 ? cells[idHeader] : cells[0] || "").slice(0, 80),
      service_date: date,
      status: "Scheduled",
      window: windowFromNotes(notes, windows),
    });
  }
  return jobs;
}

function unwrap(data) {
  let value = data;
  for (let i = 0; i < 3; i++) {
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        return value;
      }
    } else if (value && typeof value === "object" && !Array.isArray(value) && !Array.isArray(value.valueRanges) && !Array.isArray(value.jobs) && value.body !== undefined) {
      value = value.body;
    } else {
      break;
    }
  }
  return value;
}

function pushJob(jobs, job, windows) {
  if (!job || typeof job !== "object") return;
  const status = String(job.status || job.Job_Status || "").trim();
  if (!/^scheduled$/i.test(status)) return;
  const date = toIsoDate(job.service_date || job.Service_Date || job.date);
  if (!date) return;
  const hinted = String(job.window || job.Window || "");
  const notes = `${hinted} ${job.notes || job.Job_Notes || ""}`;
  const known = windows.find((window) => window.id === hinted);
  jobs.push({
    job_id: String(job.job_id || job.Job_ID || "").slice(0, 80),
    service_date: date,
    status: "Scheduled",
    window: known?.id || windowFromNotes(notes, windows),
  });
}

// Accepts the sheet reply { valueRanges } or { jobs, blocks? }.
// A missing calendar or blocks field is an empty block list, not an error.
export function parseAvailability(data, windows) {
  const body = unwrap(data);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const err = new Error("availability reply was not a schedule");
    err.code = "availability";
    throw err;
  }
  const hasRanges = Array.isArray(body.valueRanges);
  const hasJobs = Array.isArray(body.jobs);
  if (!hasRanges && !hasJobs) {
    const err = new Error("availability reply was not a schedule");
    err.code = "availability";
    throw err;
  }
  const jobs = [];
  if (hasJobs) for (const job of body.jobs) pushJob(jobs, job, windows);
  if (hasRanges) {
    const ranges = body.valueRanges.filter((range) => /jobs/i.test(String(range?.range || "")));
    if (body.valueRanges.length && !ranges.length) {
      const err = new Error("availability reply has no Jobs tab");
      err.code = "availability";
      throw err;
    }
    for (const range of ranges) jobs.push(...jobsFromValues(range?.values, windows));
  }
  const blocks = []
    .concat(Array.isArray(body.blocks) ? body.blocks : [])
    .concat(Array.isArray(body.calendar) ? body.calendar : []);
  return {
    jobs: jobs.slice(0, 2000),
    blocks: blocks.filter((block) => block && typeof block === "object").slice(0, 500),
  };
}

function usageForDate(date, config, holds, jobs, blocks) {
  const usage = new Map(config.windows.map((window) => [window.id, { jobs: 0, holds: 0, blocked: false }]));
  for (const block of blocks || []) {
    for (const window of config.windows) {
      if (blockCloses(block, date, window)) usage.get(window.id).blocked = true;
    }
  }
  const loose = [];
  for (const job of jobs || []) {
    if (job.service_date !== date || !/^scheduled$/i.test(String(job.status || ""))) continue;
    if (job.window && usage.has(job.window)) usage.get(job.window).jobs += 1;
    else loose.push(job);
  }
  loose.sort((a, b) => String(a.job_id || "").localeCompare(String(b.job_id || "")));
  loose.forEach((job, index) => {
    const window = config.windows[index % config.windows.length];
    usage.get(window.id).jobs += 1;
  });
  for (const hold of holds) {
    if (hold.windowId && hold.visits.includes(date) && usage.has(hold.windowId)) {
      usage.get(hold.windowId).holds += 1;
    }
  }
  return usage;
}

export function seatsLeft(date, window, config, holds, jobs, blocks) {
  // A blocked date has no seats, so any 4-visit series that lands on it is not offered or held.
  if (config.blockedDates?.has?.(date)) return 0;
  const usage = usageForDate(date, config, holds, jobs, blocks).get(window.id);
  if (!usage || usage.blocked) return 0;
  return Math.max(0, config.capPerWindow - usage.jobs - usage.holds);
}

export function openSlots({ now, config, holds = {}, jobs = [], blocks = [] }) {
  const today = etIsoDate(now);
  const active = activeHolds(holds, now);
  const days = [];
  for (let lead = config.minLeadDays; lead <= config.maxLeadDays; lead++) {
    const date = addDaysIso(today, lead);
    if (!isServiceDay(date)) continue;
    const windows = [];
    for (const window of config.windows) {
      const visits = config.visitOffsetsDays.map((offset) => addDaysIso(date, offset));
      if (!visits.every((visit) => isServiceDay(visit))) continue;
      const open = Math.min(...visits.map((visit) => seatsLeft(visit, window, config, active, jobs, blocks)));
      if (open < 1) continue;
      windows.push({
        id: window.id,
        label: window.label,
        open,
        visits: visits.map((iso, index) => ({
          n: index + 1,
          iso,
          date: isoToMdy(iso),
          label: visitLabel(iso),
        })),
      });
    }
    if (windows.length) days.push({ date, label: visitLabel(date), windows });
  }
  return { timezone: "America/New_York", days };
}

export function defaultOpenSlots(now, env = {}) {
  return openSlots({ now, config: bookingConfig(env) });
}
