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

/**
 * Sequential draw without replacement. Fan aggregates stay persistent; this
 * is only the deterministic, event-local reconstruction of affinity visitors.
 */
export function sampleHypergeometric(input: {
  population: number;
  successes: number;
  draws: number;
  random: () => number;
}): number {
  let population = Math.max(0, Math.round(input.population));
  let successes = Math.min(population, Math.max(0, Math.round(input.successes)));
  let result = 0;
  const draws = Math.min(population, Math.max(0, Math.round(input.draws)));
  for (let index = 0; index < draws; index += 1) {
    if (input.random() < successes / population) {
      result += 1;
      successes -= 1;
    }
    population -= 1;
  }
  return result;
}
