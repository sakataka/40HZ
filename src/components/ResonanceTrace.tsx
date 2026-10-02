import { useEffect, useRef } from 'react';
import { breathPointAt } from '../features/session/breath';
import { tracePoint, type TraceKind } from '../features/session/trace';
import type { BreathPattern } from '../features/session/types';

type ResonanceTraceProps = {
  kind: TraceKind;
  breath?: BreathPattern;
  /** Wall-clock start of the running session, used to keep the breath trace in step with the audio. */
  startedAt: number | null;
  live: boolean;
  /** Fades the middle of the trace so the countdown on top stays legible. */
  clearCenter?: boolean;
};

const STEPS = 220;
const ECHOES = 7;
const ECHO_LAG_SEC = 0.14;
const MORPH_SEC = 0.9;
const IDLE_ENERGY = 0.3;

/**
 * Draws the current sound as a phosphor-like trace with a short afterglow.
 * The figure only drifts and breathes; brightness never pulses.
 */
export function ResonanceTrace({ kind, breath, startedAt, live, clearCenter = false }: ResonanceTraceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ kind, breath, startedAt, live });
  propsRef.current = { kind, breath, startedAt, live };

  useEffect(() => {
    const canvas = canvasRef.current;
    // jsdom has no canvas; the trace is decorative, so it simply stays blank there.
    const context = typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom')
      ? null
      : canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let ratio = 1;
    let frame = 0;
    let last = performance.now();
    let clock = 0;
    let energy = 0;
    let currentKind = propsRef.current.kind;
    let previousKind = currentKind;
    let morph = 1;
    let color = '';
    let glow = 0.14;
    let colorCheckedAt = -Infinity;
    let drawnKey = '';

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, 2.5);
      width = Math.max(1, Math.round(rect.width * ratio));
      height = Math.max(1, Math.round(rect.height * ratio));
      canvas!.width = width;
      canvas!.height = height;
      drawnKey = '';
    }

    function readColors(now: number) {
      if (now - colorCheckedAt < 400) {
        return;
      }
      colorCheckedAt = now;
      const style = getComputedStyle(canvas!);
      const nextColor = style.getPropertyValue('--mood').trim() || '#888';
      const nextGlow = Number.parseFloat(style.getPropertyValue('--trace-glow')) || 0.14;
      if (nextColor !== color || nextGlow !== glow) {
        color = nextColor;
        glow = nextGlow;
        drawnKey = '';
      }
    }

    function breathLevelAt(offsetSec: number): number {
      const { breath: pattern, startedAt: start, live: isLive } = propsRef.current;
      if (pattern && start != null && isLive) {
        return breathPointAt((Date.now() - start) / 1000 - offsetSec, pattern).level;
      }
      return 0.84 + 0.04 * Math.sin(((clock - offsetSec) * Math.PI * 2) / 12);
    }

    function point(u: number, t: number, level: number): [number, number] {
      const next = tracePoint(currentKind, u, t, level);
      if (morph >= 1) {
        return next;
      }
      const from = tracePoint(previousKind, u, t, level);
      const mix = 0.5 - 0.5 * Math.cos(Math.PI * morph);
      return [from[0] + (next[0] - from[0]) * mix, from[1] + (next[1] - from[1]) * mix];
    }

    function stroke(t: number, level: number, alpha: number, lineWidth: number) {
      const radius = Math.min(width, height) / 2;
      const cx = width / 2;
      const cy = height / 2;
      context!.beginPath();
      for (let index = 0; index <= STEPS; index += 1) {
        const [x, y] = point(index / STEPS, t, level);
        if (index === 0) {
          context!.moveTo(cx + x * radius, cy + y * radius);
        } else {
          context!.lineTo(cx + x * radius, cy + y * radius);
        }
      }
      context!.closePath();
      context!.globalAlpha = alpha;
      context!.lineWidth = lineWidth;
      context!.stroke();
    }

    function draw(now: number) {
      frame = window.requestAnimationFrame(draw);
      const props = propsRef.current;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      readColors(now);

      if (props.kind !== currentKind) {
        previousKind = currentKind;
        currentKind = props.kind;
        morph = 0;
      }

      const still = Boolean(reducedMotion?.matches);
      const followsBreath = Boolean(props.breath && props.startedAt != null && props.live);
      morph = still ? 1 : Math.min(1, morph + dt / MORPH_SEC);
      energy += ((props.live ? 1 : IDLE_ENERGY) - energy) * Math.min(1, dt * 1.4);
      if (!still) {
        clock += dt * (0.25 + 0.75 * energy);
      }

      // With reduced motion only the breath guide keeps moving, because it is the instruction itself.
      const key = `${currentKind}|${props.live}|${width}|${color}`;
      if (still && !followsBreath && key === drawnKey) {
        return;
      }
      drawnKey = key;

      context!.clearRect(0, 0, width, height);
      context!.strokeStyle = color;
      context!.lineJoin = 'round';
      const echoes = still ? 1 : ECHOES;
      const brightness = 0.55 + 0.45 * energy;

      for (let echo = echoes - 1; echo >= 1; echo -= 1) {
        const offset = echo * ECHO_LAG_SEC;
        const fade = (1 - echo / echoes) ** 1.7;
        stroke(clock - offset, breathLevelAt(offset), 0.32 * fade * brightness, 1.1 * ratio);
      }

      const level = breathLevelAt(0);
      stroke(clock, level, glow * brightness, 9 * ratio);
      stroke(clock, level, 0.95 * brightness, 1.6 * ratio);
      context!.globalAlpha = 1;
    }

    resize();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    frame = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`np-trace${clearCenter ? ' is-clear-center' : ''}`} aria-hidden="true" />;
}
