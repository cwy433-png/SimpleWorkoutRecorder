// localStorage persistence for workout history. Storage is injected so tests can fake it.
import { normalizeRecord } from './historyModel';

const KEY = 'workout_history';

const defaultStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

/** Thrown by writers when the stored history exists but cannot be read, so it is never overwritten. */
export class HistoryCorruptError extends Error {
  constructor(message = 'Stored workout history is unreadable') {
    super(message);
    this.name = 'HistoryCorruptError';
  }
}

/** Raw stored array. A missing or empty key is []; anything unreadable throws. */
function readStrict(storage) {
  const raw = storage?.getItem(KEY);
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HistoryCorruptError();
  }
  if (!Array.isArray(parsed)) throw new HistoryCorruptError();
  return parsed;
}

/** All records, normalized. Corrupt or missing data reads as [] (never throws). */
export function readHistory(storage = defaultStorage()) {
  try {
    return readStrict(storage).map(normalizeRecord);
  } catch {
    return [];
  }
}

export function writeHistory(records, storage = defaultStorage()) {
  storage.setItem(KEY, JSON.stringify(records));
}

/** Add a record at the front (newest first). Throws HistoryCorruptError without writing if storage is unreadable. */
export function appendRecord(record, storage = defaultStorage()) {
  const next = [record, ...readStrict(storage).map(normalizeRecord)];
  writeHistory(next, storage);
  return next;
}

/** Replace the record with the same id, keeping its position. Unknown ids are ignored. Throws HistoryCorruptError without writing if storage is unreadable. */
export function replaceRecord(record, storage = defaultStorage()) {
  const next = readStrict(storage).map(normalizeRecord).map((r) => (r.id === record.id ? record : r));
  writeHistory(next, storage);
  return next;
}
