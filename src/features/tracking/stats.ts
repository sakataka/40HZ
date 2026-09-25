import type { BlindCondition } from '../session/types';
import { sessionHeartRate } from './health';
import type { HealthSample, SessionRecord } from './types';

export type MetricKey = 'clarity' | 'mood' | 'fatigue' | 'reaction' | 'heartRate';

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  unit: string;
  /** Positive means "better after the session". */
  improvement: (record: SessionRecord, healthSamples: HealthSample[]) => number | null;
};

export const METRICS: MetricDefinition[] = [
  {
    key: 'clarity',
    label: '頭のスッキリ',
    unit: '点',
    improvement: (record) => (record.pre && record.post ? record.post.clarity - record.pre.clarity : null),
  },
  {
    key: 'mood',
    label: '気分',
    unit: '点',
    improvement: (record) => (record.pre && record.post ? record.post.mood - record.pre.mood : null),
  },
  {
    key: 'fatigue',
    label: '疲れの軽減',
    unit: '点',
    improvement: (record) => (record.pre && record.post ? record.pre.fatigue - record.post.fatigue : null),
  },
  {
    key: 'reaction',
    label: '反応時間の短縮',
    unit: 'ms',
    improvement: (record) =>
      record.pre?.reaction && record.post?.reaction
        ? record.pre.reaction.medianMs - record.post.reaction.medianMs
        : null,
  },
  {
    key: 'heartRate',
    label: '心拍の低下',
    unit: 'bpm',
    improvement: (record, samples) => {
      const heartRate = sessionHeartRate(record, samples);
      return heartRate.before != null && heartRate.during != null
        ? heartRate.before - heartRate.during
        : null;
    },
  },
];

export const MIN_PER_ARM = 3;

export type ArmComparison = {
  metric: MetricDefinition;
  active: number[];
  sham: number[];
  diff: number | null;
  low: number | null;
  high: number | null;
};

export function mean(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function variance(values: number[]): number {
  const average = mean(values);
  if (average == null || values.length < 2) {
    return 0;
  }
  return values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
}

/** Welch's two-sample 95% confidence interval for mean(a) - mean(b). */
export function welchInterval(a: number[], b: number[]): { diff: number; low: number; high: number } | null {
  if (a.length < 2 || b.length < 2) {
    return null;
  }

  const diff = mean(a)! - mean(b)!;
  const va = variance(a) / a.length;
  const vb = variance(b) / b.length;
  const se = Math.sqrt(va + vb);

  if (se === 0) {
    return { diff, low: diff, high: diff };
  }

  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  const margin = tCritical95(df) * se;
  return { diff, low: diff - margin, high: diff + margin };
}

const T_TABLE = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086];

export function tCritical95(df: number): number {
  if (!Number.isFinite(df) || df >= 120) {
    return 1.96;
  }
  if (df >= T_TABLE.length) {
    return 1.96 + 2.4 / df;
  }
  return T_TABLE[Math.max(0, Math.floor(df) - 1)];
}

export function isAnalyzable(record: SessionRecord): boolean {
  return record.completed && record.pre != null && record.post != null;
}

export function compareExperiment(records: SessionRecord[], healthSamples: HealthSample[]): ArmComparison[] {
  const trials = records.filter((record) => record.condition && isAnalyzable(record));

  return METRICS.map((metric) => {
    const valuesFor = (condition: BlindCondition) =>
      trials
        .filter((record) => record.condition === condition)
        .map((record) => metric.improvement(record, healthSamples))
        .filter((value): value is number => value != null);
    const active = valuesFor('active');
    const sham = valuesFor('sham');
    const interval = active.length >= MIN_PER_ARM && sham.length >= MIN_PER_ARM
      ? welchInterval(active, sham)
      : null;

    return {
      metric,
      active,
      sham,
      diff: interval?.diff ?? null,
      low: interval?.low ?? null,
      high: interval?.high ?? null,
    };
  });
}

export function countArms(records: SessionRecord[]): Record<BlindCondition, number> {
  const trials = records.filter((record) => record.condition && isAnalyzable(record));
  return {
    active: trials.filter((record) => record.condition === 'active').length,
    sham: trials.filter((record) => record.condition === 'sham').length,
  };
}

export type ProfileSummary = {
  profileId: string;
  count: number;
  averages: Partial<Record<MetricKey, number>>;
};

/** Open-label check-ins grouped by preset. Blind trials are summarized separately. */
export function summarizeByProfile(records: SessionRecord[], healthSamples: HealthSample[]): ProfileSummary[] {
  const groups = new Map<string, SessionRecord[]>();
  for (const record of records) {
    if (record.condition || !isAnalyzable(record)) {
      continue;
    }
    groups.set(record.profileId, [...(groups.get(record.profileId) ?? []), record]);
  }

  return Array.from(groups.entries()).map(([profileId, group]) => {
    const averages: Partial<Record<MetricKey, number>> = {};
    for (const metric of METRICS) {
      const average = mean(
        group
          .map((record) => metric.improvement(record, healthSamples))
          .filter((value): value is number => value != null),
      );
      if (average != null) {
        averages[metric.key] = average;
      }
    }
    return { profileId, count: group.length, averages };
  });
}

export type Verdict = 'pending' | 'favorsActive' | 'favorsSham' | 'noDifference';

export function verdictOf(comparison: ArmComparison): Verdict {
  if (comparison.low == null || comparison.high == null) {
    return 'pending';
  }
  if (comparison.low > 0) {
    return 'favorsActive';
  }
  if (comparison.high < 0) {
    return 'favorsSham';
  }
  return 'noDifference';
}

/** Block randomization in blocks of four keeps the two arms balanced over time. */
export function drawCondition(
  queue: BlindCondition[],
  random: () => number = Math.random,
): { condition: BlindCondition; queue: BlindCondition[] } {
  const pool = queue.length ? [...queue] : shuffle<BlindCondition>(['active', 'active', 'sham', 'sham'], random);
  const [condition, ...rest] = pool;
  return { condition, queue: rest };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}
