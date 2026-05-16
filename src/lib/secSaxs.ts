import type { SaxsData } from '../types/saxs';

export function averageFrames(frames: SaxsData[]): SaxsData {
  const n = frames.length;
  if (n === 0) throw new Error('No frames to average');
  const ref = frames[0];
  const nPts = ref.q.length;

  const I = new Array<number>(nPts).fill(0);
  const errSq = new Array<number>(nPts).fill(0);

  for (const frame of frames) {
    for (let i = 0; i < nPts; i++) {
      I[i] += frame.I[i];
      errSq[i] += frame.err[i] * frame.err[i];
    }
  }

  return {
    q: ref.q,
    I: I.map((v) => v / n),
    err: errSq.map((v) => Math.sqrt(v) / n),
    filename: `avg (${n} frames)`,
  };
}

export function subtractBuffer(signal: SaxsData, buffer: SaxsData): SaxsData {
  return {
    q: signal.q,
    I: signal.I.map((v, i) => v - buffer.I[i]),
    err: signal.err.map((v, i) =>
      Math.sqrt(v * v + buffer.err[i] * buffer.err[i]),
    ),
    filename: 'subtracted',
  };
}

export function frameIntensity(frame: SaxsData): number {
  return frame.I.reduce((s, v) => s + v, 0) / frame.I.length;
}

export function autoDetectRegions(frames: SaxsData[]): {
  bufferRange: [number, number];
  signalRange: [number, number];
} {
  const n = frames.length;
  const intensities = frames.map(frameIntensity);
  const maxI = Math.max(...intensities);
  const minI = Math.min(...intensities);
  const threshold = minI + (maxI - minI) * 0.5;

  const aboveIdx = intensities
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v > threshold)
    .map(({ i }) => i);

  if (aboveIdx.length === 0) {
    return {
      bufferRange: [0, Math.max(0, Math.floor(n * 0.15) - 1)],
      signalRange: [Math.floor(n * 0.4), Math.floor(n * 0.65)],
    };
  }

  const sigStart = aboveIdx[0];
  const sigEnd = aboveIdx[aboveIdx.length - 1];

  // Buffer: up to 6 frames immediately before the peak
  const bufEnd = Math.max(0, sigStart - 1);
  const bufStart = Math.max(0, bufEnd - 5);

  return {
    bufferRange: [bufStart, bufEnd],
    signalRange: [sigStart, sigEnd],
  };
}
