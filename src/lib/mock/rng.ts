/**
 * Deterministic pseudo-randomness.
 *
 * The bulk dataset (hundreds of documents, a firm-wide return queue) is
 * generated rather than typed out, but it must be IDENTICAL on every render,
 * every reload and every machine — otherwise the demo video and the hosted
 * build disagree, and "hundreds of rows" becomes a liability instead of a
 * proof of scale. mulberry32 gives us a tiny, seedable generator.
 */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rand {
  private next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  float(min = 0, max = 1) {
    return min + this.next() * (max - min);
  }

  int(min: number, max: number) {
    return Math.floor(this.float(min, max + 1));
  }

  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)]!;
  }

  /** Weighted pick: `[["a", 3], ["b", 1]]` picks "a" three times as often. */
  weighted<T>(pairs: ReadonlyArray<readonly [T, number]>): T {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = this.float(0, total);
    for (const [value, w] of pairs) {
      r -= w;
      if (r <= 0) return value;
    }
    return pairs[pairs.length - 1]![0];
  }

  bool(trueProbability = 0.5) {
    return this.next() < trueProbability;
  }

  /** Money rounded to the nearest `step` dollars. */
  money(min: number, max: number, step = 1) {
    return Math.round(this.float(min, max) / step) * step;
  }

  /** An ISO date `min`..`max` days offset from the supplied anchor. */
  dateOffset(anchor: Date, minDays: number, maxDays: number) {
    const d = new Date(anchor.getTime() + this.int(minDays, maxDays) * 86_400_000);
    return d.toISOString();
  }

  shuffle<T>(arr: T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }
}
