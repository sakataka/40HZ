import { describe, expect, it } from 'vitest';
import { breathPointAt, breathsPerMinute } from '../src/features/session/breath';
import {
  mergeHealthSamples,
  parseHealthText,
  sessionHeartRate,
} from '../src/features/tracking/health';
import { summarizeReaction } from '../src/features/tracking/reaction';
import {
  compareExperiment,
  countArms,
  drawCondition,
  summarizeByProfile,
  verdictOf,
  welchInterval,
} from '../src/features/tracking/stats';
import { createExportBundle, parseExportBundle } from '../src/features/tracking/storage';
import type { SessionRecord } from '../src/features/tracking/types';

const MINUTE = 60_000;

function record(overrides: Partial<SessionRecord> & { clarityGain?: number }): SessionRecord {
  const { clarityGain = 1, ...rest } = overrides;
  return {
    id: Math.random().toString(36),
    startedAt: 10 * MINUTE,
    endedAt: 30 * MINUTE,
    plannedMinutes: 20,
    profileId: 'recommended',
    program: 'gamma',
    completed: true,
    pre: { fatigue: 6, mood: 5, clarity: 4 },
    post: { fatigue: 5, mood: 6, clarity: 4 + clarityGain },
    ...rest,
  };
}

describe('welchInterval', () => {
  it('matches a hand-computed Welch interval', () => {
    const interval = welchInterval([2, 3, 4], [0, 1, 2]);
    // diff 2, se sqrt(1/3 + 1/3), df 4 -> t 2.776
    expect(interval?.diff).toBe(2);
    expect(interval?.low).toBeCloseTo(2 - 2.776 * Math.sqrt(2 / 3), 3);
    expect(interval?.high).toBeCloseTo(2 + 2.776 * Math.sqrt(2 / 3), 3);
  });

  it('needs at least two values per arm', () => {
    expect(welchInterval([1], [1, 2])).toBeNull();
  });
});

describe('blind comparison', () => {
  it('draws balanced blocks of four', () => {
    let queue: ('active' | 'sham')[] = [];
    const drawn: string[] = [];
    for (let index = 0; index < 8; index += 1) {
      const next = drawCondition(queue);
      drawn.push(next.condition);
      queue = next.queue;
    }
    expect(drawn.slice(0, 4).filter((value) => value === 'active')).toHaveLength(2);
    expect(drawn.slice(4).filter((value) => value === 'active')).toHaveLength(2);
  });

  it('only reports an interval once each arm has enough completed sessions', () => {
    const early = [
      record({ condition: 'active', clarityGain: 3 }),
      record({ condition: 'active', clarityGain: 2 }),
      record({ condition: 'sham', clarityGain: 0 }),
      record({ condition: 'sham', clarityGain: 1 }),
    ];
    expect(compareExperiment(early, [])[0].diff).toBeNull();

    const enough = [
      ...early,
      record({ condition: 'active', clarityGain: 3 }),
      record({ condition: 'sham', clarityGain: 0 }),
      record({ condition: 'sham', clarityGain: 5, completed: false }),
    ];
    expect(countArms(enough)).toEqual({ active: 3, sham: 3 });
    const clarity = compareExperiment(enough, [])[0];
    expect(clarity.metric.key).toBe('clarity');
    expect(clarity.diff).toBeCloseTo(8 / 3 - 1 / 3);
    expect(verdictOf(clarity)).toBe('favorsActive');
  });

  it('keeps blind trials out of the open-label preset summary', () => {
    const summaries = summarizeByProfile(
      [record({ condition: 'active' }), record({ profileId: 'breath-sigh', program: 'breath', clarityGain: 2 })],
      [],
    );
    expect(summaries).toEqual([
      expect.objectContaining({ profileId: 'breath-sigh', count: 1, averages: expect.objectContaining({ clarity: 2, fatigue: 1 }) }),
    ]);
  });
});

describe('reaction summary', () => {
  it('reports median, lapses and false starts', () => {
    expect(summarizeReaction([250, 300, 600, 280], 2)).toEqual({
      medianMs: 290,
      lapses: 1,
      falseStarts: 2,
      trials: 4,
    });
  });
});

describe('health import', () => {
  it('parses ISO and Japanese date formats and ignores noise', () => {
    const samples = parseHealthText(
      [
        'HR,2026-09-25T10:15:00+09:00,68',
        'HRV, 2026/09/25 10:20, 42.5 ms',
        'garbage line',
        'HR,not a date,70',
      ].join('\n'),
    );

    expect(samples).toEqual([
      { kind: 'hr', at: Date.parse('2026-09-25T10:15:00+09:00'), value: 68 },
      { kind: 'hrv', at: new Date(2026, 8, 25, 10, 20).getTime(), value: 42.5 },
    ]);
  });

  it('deduplicates merged samples and computes session windows', () => {
    const now = 60 * MINUTE;
    const merged = mergeHealthSamples(
      [{ kind: 'hr', at: 5 * MINUTE, value: 80 }],
      [
        { kind: 'hr', at: 5 * MINUTE, value: 80 },
        { kind: 'hr', at: 15 * MINUTE, value: 70 },
        { kind: 'hr', at: 25 * MINUTE, value: 66 },
        { kind: 'hrv', at: 35 * MINUTE, value: 50 },
      ],
      now,
    );

    expect(merged).toHaveLength(4);
    expect(sessionHeartRate(record({}), merged)).toEqual({ before: 80, during: 68, hrv: 50 });
  });
});

describe('export bundle', () => {
  it('round-trips records and rejects foreign JSON', () => {
    const records = [record({})];
    const text = JSON.stringify(createExportBundle(records, []));
    expect(parseExportBundle(text)?.records).toEqual(records);
    expect(parseExportBundle('{"foo":1}')).toBeNull();
  });
});

describe('breath pattern', () => {
  const sigh = { inhaleSec: 2.5, topUpSec: 1, exhaleSec: 5.5 };

  it('walks through inhale, top-up and exhale', () => {
    expect(breathPointAt(0, sigh)).toEqual({ stage: 'inhale', level: 0 });
    expect(breathPointAt(2.5, sigh).stage).toBe('topUp');
    expect(breathPointAt(3.5, sigh)).toEqual({ stage: 'exhale', level: 1 });
    expect(breathPointAt(9, sigh).stage).toBe('inhale');
    expect(breathsPerMinute({ inhaleSec: 4.5, topUpSec: 0, exhaleSec: 6.5 })).toBe(5.5);
  });
});
