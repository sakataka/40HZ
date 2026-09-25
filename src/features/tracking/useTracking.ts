import { useCallback, useEffect, useRef, useState } from 'react';
import { getRecommendationProfile } from '../session/presets';
import type { BlindCondition, SessionEndInfo } from '../session/types';
import { mergeHealthSamples } from './health';
import { drawCondition } from './stats';
import {
  loadHealthSamples,
  loadTrackingData,
  mergeRecords,
  saveHealthSamples,
  saveTrackingData,
} from './storage';
import type { CheckIn, HealthSample, SessionRecord, TrackingData, TrackingPrefs } from './types';

type Draft = {
  profileId: string;
  condition?: BlindCondition;
  pre?: CheckIn;
};

export type TrackingFlow =
  | { step: 'idle' }
  | { step: 'pre' }
  | { step: 'running'; draft: Draft }
  | { step: 'post'; draft: Draft; end: SessionEndInfo }
  | { step: 'result'; record: SessionRecord };

export function useTracking() {
  const [data, setData] = useState<TrackingData>(loadTrackingData);
  const [healthSamples, setHealthSamples] = useState<HealthSample[]>(loadHealthSamples);
  const [flow, setFlowState] = useState<TrackingFlow>({ step: 'idle' });
  const flowRef = useRef(flow);

  const setFlow = useCallback((next: TrackingFlow) => {
    flowRef.current = next;
    setFlowState(next);
  }, []);

  useEffect(() => {
    saveTrackingData(data);
  }, [data]);

  useEffect(() => {
    saveHealthSamples(healthSamples);
  }, [healthSamples]);

  function updatePrefs(updates: Partial<TrackingPrefs>): void {
    setData((current) => ({ ...current, prefs: { ...current.prefs, ...updates } }));
  }

  function beginPre(): void {
    setFlow({ step: 'pre' });
  }

  function cancel(): void {
    setFlow({ step: 'idle' });
  }

  /** Locks in the draft for the upcoming run and, in experiment mode, draws the hidden arm. */
  function beginRun(profileId: string, pre: CheckIn | undefined): BlindCondition | undefined {
    let condition: BlindCondition | undefined;

    if (data.prefs.mode === 'experiment') {
      const drawn = drawCondition(data.experimentQueue);
      condition = drawn.condition;
      setData((current) => ({ ...current, experimentQueue: drawn.queue }));
    }

    setFlow({ step: 'running', draft: { profileId, condition, pre } });
    return condition;
  }

  const handleSessionEnd = useCallback((end: SessionEndInfo) => {
    const current = flowRef.current;
    if (current.step !== 'running') {
      return;
    }
    setFlow({ step: 'post', draft: current.draft, end });
  }, [setFlow]);

  function submitPost(post: CheckIn | undefined): void {
    const current = flowRef.current;
    if (current.step !== 'post') {
      return;
    }

    const { draft, end } = current;
    const record: SessionRecord = {
      id: `${end.startedAt}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: end.startedAt,
      endedAt: end.endedAt,
      plannedMinutes: end.plannedMinutes,
      profileId: draft.profileId,
      program: getRecommendationProfile(draft.profileId).program,
      condition: draft.condition,
      completed: end.completed,
      pre: draft.pre,
      post,
    };

    setData((currentData) => ({ ...currentData, records: [...currentData.records, record] }));
    setFlow(post && draft.pre ? { step: 'result', record } : { step: 'idle' });
  }

  function deleteRecord(id: string): void {
    setData((current) => ({
      ...current,
      records: current.records.filter((record) => record.id !== id),
    }));
  }

  function clearRecords(): void {
    setData((current) => ({ ...current, records: [], experimentQueue: [] }));
  }

  function importRecords(records: SessionRecord[]): void {
    setData((current) => ({ ...current, records: mergeRecords(current.records, records) }));
  }

  function importHealth(samples: HealthSample[]): number {
    const before = healthSamples.length;
    const merged = mergeHealthSamples(healthSamples, samples);
    setHealthSamples(merged);
    return merged.length - before;
  }

  function clearHealth(): void {
    setHealthSamples([]);
  }

  return {
    beginPre,
    beginRun,
    cancel,
    clearHealth,
    clearRecords,
    deleteRecord,
    flow,
    handleSessionEnd,
    healthSamples,
    importHealth,
    importRecords,
    prefs: data.prefs,
    records: data.records,
    submitPost,
    updatePrefs,
  };
}
