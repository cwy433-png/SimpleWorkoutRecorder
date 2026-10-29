// localStorage persistence for workout history. Storage is injected so tests can fake it.
import { normalizeRecord } from './historyModel';

const KEY = 'workout_history';
/** Where unreadable history is moved before a fresh history is started: [{ setAsideAt, raw }]. */
export const UNREADABLE_KEY = 'workout_history_unreadable';

const defaultStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

/** Stored array, or null when the key holds something that is not a JSON array. Missing or empty is []. */
function readRaw(storage) {
  const raw = storage?.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** All records, normalized. Corrupt or missing data reads as [] (never throws). */
export function readHistory(storage = defaultStorage()) {
  return (readRaw(storage) ?? []).map(normalizeRecord);
}

/** Copies of unreadable history set aside so far, oldest first. */
export function readUnreadableCopies(storage = defaultStorage()) {
  const raw = storage?.getItem(UNREADABLE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through: keep whatever is there as one more copy
  }
  return [{ setAsideAt: null, raw }];
}

/**
 * If the stored history cannot be read, move it verbatim to UNREADABLE_KEY and clear it, so the
 * next write starts a fresh history instead of failing or overwriting it. Returns true if it moved.
 */
export function setAsideUnreadableHistory(storage = defaultStorage(), now = Date.now()) {
  if (readRaw(storage) !== null) return false;
  const copies = [...readUnreadableCopies(storage), { setAsideAt: now, raw: storage.getItem(KEY) }];
  storage.setItem(UNREADABLE_KEY, JSON.stringify(copies));
  storage.removeItem(KEY);
  return true;
}

/** Stored records for a write: unreadable history is set aside first, then reads as []. */
function readForWrite(storage) {
  setAsideUnreadableHistory(storage);
  return readRaw(storage).map(normalizeRecord);
}

export function writeHistory(records, storage = defaultStorage()) {
  storage.setItem(KEY, JSON.stringify(records));
}

/** Add a record at the front (newest first). Unreadable stored history is set aside first. */
export function appendRecord(record, storage = defaultStorage()) {
  const next = [record, ...readForWrite(storage)];
  writeHistory(next, storage);
  return next;
}

/** Replace the record with the same id, keeping its position. Unknown ids are ignored. Unreadable stored history is set aside first. */
export function replaceRecord(record, storage = defaultStorage()) {
  const next = readForWrite(storage).map((r) => (r.id === record.id ? record : r));
  writeHistory(next, storage);
  return next;
}

/**
 * Save a finished strength session. Idempotent: if history already holds a strength record for
 * the same session (same startTime, and same dayId when both have one), that record is replaced
 * and keeps its id instead of a duplicate being added. Unreadable stored history is set aside first.
 */
export function saveStrengthRecord(record, storage = defaultStorage()) {
  const existing = readForWrite(storage).find(
      (r) =>
        r.type === 'strength' &&
        r.startTime != null &&
        r.startTime === record.startTime &&
        (record.dayId == null || r.dayId == null || r.dayId === record.dayId),
    );
  if (!existing) return appendRecord(record, storage);
  return replaceRecord({ ...record, id: existing.id }, storage);
}
