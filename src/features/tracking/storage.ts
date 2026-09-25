import type { HealthSample, SessionRecord, TrackingData, TrackingPrefs } from './types';

export const TRACKING_STORAGE_KEY = 'forty-hz-tracking';
export const HEALTH_STORAGE_KEY = 'forty-hz-health-samples';

export const DEFAULT_TRACKING_PREFS: TrackingPrefs = {
  mode: 'checkin',
  reactionTest: false,
};

export function loadTrackingData(): TrackingData {
  const stored = readJson<Partial<TrackingData>>(TRACKING_STORAGE_KEY);

  return {
    prefs: { ...DEFAULT_TRACKING_PREFS, ...stored?.prefs },
    records: Array.isArray(stored?.records) ? stored.records.filter(isRecord) : [],
    experimentQueue: Array.isArray(stored?.experimentQueue)
      ? stored.experimentQueue.filter((value) => value === 'active' || value === 'sham')
      : [],
  };
}

export function saveTrackingData(data: TrackingData): void {
  writeJson(TRACKING_STORAGE_KEY, data);
}

export function loadHealthSamples(): HealthSample[] {
  const stored = readJson<unknown>(HEALTH_STORAGE_KEY);
  return Array.isArray(stored) ? stored.filter(isHealthSample) : [];
}

export function saveHealthSamples(samples: HealthSample[]): void {
  writeJson(HEALTH_STORAGE_KEY, samples);
}

export type ExportBundle = {
  app: 'forty-hz';
  version: 1;
  exportedAt: string;
  records: SessionRecord[];
  healthSamples: HealthSample[];
};

export function createExportBundle(records: SessionRecord[], healthSamples: HealthSample[]): ExportBundle {
  return {
    app: 'forty-hz',
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    healthSamples,
  };
}

export function parseExportBundle(text: string): { records: SessionRecord[]; healthSamples: HealthSample[] } | null {
  try {
    const parsed = JSON.parse(text) as Partial<ExportBundle>;
    if (parsed.app !== 'forty-hz') {
      return null;
    }

    return {
      records: Array.isArray(parsed.records) ? parsed.records.filter(isRecord) : [],
      healthSamples: Array.isArray(parsed.healthSamples) ? parsed.healthSamples.filter(isHealthSample) : [],
    };
  } catch {
    return null;
  }
}

export function mergeRecords(current: SessionRecord[], incoming: SessionRecord[]): SessionRecord[] {
  const byId = new Map(current.map((record) => [record.id, record]));
  for (const record of incoming) {
    byId.set(record.id, record);
  }
  return Array.from(byId.values()).sort((a, b) => a.startedAt - b.startedAt);
}

function isRecord(value: unknown): value is SessionRecord {
  const record = value as SessionRecord | null;
  return (
    typeof record?.id === 'string'
    && typeof record.startedAt === 'number'
    && typeof record.endedAt === 'number'
    && typeof record.profileId === 'string'
  );
}

function isHealthSample(value: unknown): value is HealthSample {
  const sample = value as HealthSample | null;
  return (
    (sample?.kind === 'hr' || sample?.kind === 'hrv')
    && Number.isFinite(sample.at)
    && Number.isFinite(sample.value)
  );
}

function readJson<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable or full; runtime state should remain usable.
  }
}
