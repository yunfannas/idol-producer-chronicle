/** Stable pseudo-random stream: identical save/event keys replay identically. */
export function createSeededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleBinomial(trials: number, probability: number, random: () => number): number {
  const p = Math.min(1, Math.max(0, probability));
  let result = 0;
  for (let index = 0; index < Math.max(0, Math.round(trials)); index += 1) {
    if (random() < p) result += 1;
  }
  return result;
}
