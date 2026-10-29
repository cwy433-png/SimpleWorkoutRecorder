// Date/time label helpers. All output is English and uses local time.
// Intl/toLocale* are avoided on purpose so output never depends on the device locale.
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const pad2 = (n) => String(n).padStart(2, '0');

/** 'OCT 27' */
export function formatMonthDay(ts) {
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** 'OCT 27 · TUE' */
export function formatDayLabel(ts) {
  return `${formatMonthDay(ts)} · ${DAYS[new Date(ts).getDay()]}`;
}

/** '18:42' (24-hour clock) */
export function formatClock(ts) {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
