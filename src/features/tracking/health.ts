import type { HealthSample, SessionRecord } from './types';

const MINUTE = 60_000;
const BASELINE_WINDOW_MS = 15 * MINUTE;
const HRV_WINDOW_BEFORE_MS = 10 * MINUTE;
const HRV_WINDOW_AFTER_MS = 30 * MINUTE;
const RETENTION_MS = 365 * 24 * 60 * MINUTE;

export const SHORTCUT_NAME = '40Hz Health';

/**
 * Parses the text the "40Hz Health" shortcut copies to the clipboard.
 * One sample per line: `HR,<date>,<value>` or `HRV,<date>,<value>`.
 * Dates may be ISO 8601 or the Japanese display format (2026/09/25 10:15).
 */
export function parseHealthText(text: string): HealthSample[] {
  const samples: HealthSample[] = [];

  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^(HRV|HR)\s*[,\t]\s*(.+?)\s*[,\t]\s*([\d.]+)/i);
    if (!match) {
      continue;
    }

    const at = parseDate(match[2]);
    const value = Number(match[3]);
    if (at == null || !Number.isFinite(value) || value <= 0) {
      continue;
    }

    samples.push({ kind: match[1].toUpperCase() === 'HRV' ? 'hrv' : 'hr', at, value });
  }

  return samples;
}

export function parseDate(value: string): number | null {
  const local = value.match(
    /^(\d{4})[/年.-](\d{1,2})[/月.-](\d{1,2})日?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (local) {
    const [, year, month, day, hour, minute, second] = local.map(Number);
    return new Date(year, month - 1, day, hour, minute, second || 0).getTime();
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function mergeHealthSamples(
  current: HealthSample[],
  incoming: HealthSample[],
  now = Date.now(),
): HealthSample[] {
  const byKey = new Map<string, HealthSample>();
  for (const sample of [...current, ...incoming]) {
    if (now - sample.at > RETENTION_MS) {
      continue;
    }
    byKey.set(`${sample.kind}:${sample.at}`, sample);
  }
  return Array.from(byKey.values()).sort((a, b) => a.at - b.at);
}

export type SessionHeartRate = {
  before: number | null;
  during: number | null;
  hrv: number | null;
};

export function sessionHeartRate(record: SessionRecord, samples: HealthSample[]): SessionHeartRate {
  return {
    before: averageBetween(samples, 'hr', record.startedAt - BASELINE_WINDOW_MS, record.startedAt),
    during: averageBetween(samples, 'hr', record.startedAt, record.endedAt),
    hrv: averageBetween(
      samples,
      'hrv',
      record.startedAt - HRV_WINDOW_BEFORE_MS,
      record.endedAt + HRV_WINDOW_AFTER_MS,
    ),
  };
}

function averageBetween(
  samples: HealthSample[],
  kind: HealthSample['kind'],
  from: number,
  to: number,
): number | null {
  const values = samples
    .filter((sample) => sample.kind === kind && sample.at >= from && sample.at < to)
    .map((sample) => sample.value);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}
