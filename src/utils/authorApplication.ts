/** Milliseconds in a calendar month window for author applications (30 days). */
export const AUTHOR_APPLICATION_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export const addMonths = (from: Date, months: number): Date => {
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
};

export const getRemainingMs = (targetIso: string): number =>
  Math.max(0, new Date(targetIso).getTime() - Date.now());

export const formatCountdown = (targetIso: string): string => {
  const ms = getRemainingMs(targetIso);
  if (ms <= 0) return '';

  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours.toString().padStart(2, '0')}h`);
  parts.push(`${minutes.toString().padStart(2, '0')}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);
  return parts.join(' ');
};

export const formatLocalDateTime = (iso: string, locale = 'sv-SE'): string =>
  new Date(iso).toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
