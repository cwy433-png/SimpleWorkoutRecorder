// localStorage persistence for workout history. Storage is injected so tests can fake it.
import { normalizeRecord } from './historyModel';

const KEY = 'workout_history';

const defaultStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

/** All records, normalized. Corrupt or missing data reads as []. */
export function readHistory(storage = defaultStorage()) {
  try {
    const parsed = JSON.parse(storage?.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeRecord) : [];
  } catch {
    return [];
  }
}

export function writeHistory(records, storage = defaultStorage()) {
  storage.setItem(KEY, JSON.stringify(records));
}

/** Add a record at the front (newest first). */
export function appendRecord(record, storage = defaultStorage()) {
  const next = [record, ...readHistory(storage)];
  writeHistory(next, storage);
  return next;
}

/** Replace the record with the same id, keeping its position. Unknown ids are ignored. */
export function replaceRecord(record, storage = defaultStorage()) {
  const next = readHistory(storage).map((r) => (r.id === record.id ? record : r));
  writeHistory(next, storage);
  return next;
}
